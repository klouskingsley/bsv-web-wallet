import { bsv, toHex } from 'scryptlib';
import { NetWork } from '../web3';
import {Key, SensibleFt, SensibleSatotx, TransferReceiver, BsvUtxo} from '../state/stateType'
import axios from 'axios'
import {SensibleFT} from 'sensible-sdk'
import * as tokenProto from 'sensible-sdk/dist/bcp02/tokenProto'
import * as protoHeader from 'sensible-sdk/dist/common/protoheader'
import { getCodeHash } from 'sensible-sdk/dist/common/utils';
import * as util from './util'
import * as Sentry from "@sentry/react";

function getSensibleApiPrefix(network: NetWork) {
    const test = network === NetWork.Mainnet ? '' : '/test'
    return `https://api.sensiblequery.com${test}`
}
function isSensibleSuccess(res: any) {
    return res.code === 0 && res.msg === 'ok'
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function formatValue(value: number, decimal: number) {
    // const bigNum = bsv.crypto.BN.fromNumber(value)
    // return bigNum.div(10**decimal).toString(10)
    // return value / (10**decimal)
    return util.div(value, util.getDecimalString(decimal))
}

export function isValidAddress(network: NetWork, address: string) {
    try {
        new bsv.Address(address, network)
        return true
    } catch (_) {
        return false
    }
}

export function generateKeysFromEmailPassword(email: string, pass: string, network: NetWork = NetWork.Testnet): Key {
    let s: string = email
    s += '|'+pass+'|';
    s += s.length+'|!@'+((pass.length*7)+email.length)*7;
    var regchars = (pass.match(/[a-z]+/g)) ? pass.match(/[a-z]+/g)!.length : 1;
    var regupchars = (pass.match(/[A-Z]+/g)) ? pass.match(/[A-Z]+/g)!.length : 1;
    var regnums = (pass.match(/[0-9]+/g)) ? pass.match(/[0-9]+/g)!.length : 1;
    s += ((regnums+regchars)+regupchars)*pass.length+'3571';
    s += (s+''+s);

    let bufferS = Buffer.from(s)
    bufferS = bsv.crypto.Hash.sha256(bufferS)
	for(let i=0;i<=49;i++){
        const tmp = Buffer.from(bufferS.toString('hex'))
        bufferS = bsv.crypto.Hash.sha256(tmp)
	}
    const hex = bsv.crypto.Hash.sha256(Buffer.from(bufferS.toString('hex'))).toString('hex')
    
    const privateKey = new bsv.PrivateKey(hex, network)
    const address = privateKey.toAddress(network).toString()
    
    return {
        address,
        privateKey: privateKey.toString(),
        publicKey: privateKey.toPublicKey().toString()
    }
}

export function getSensibleFtHistoryUrl(network: NetWork, address: string, genesis: string, codehash: string) {
    // https://sensiblequery.com/#/ft/utxo/a1961d0c0ab39f1bd0f79c2f6ae27138cca0620c/d4266deb03b5fdb7c9af39fa71f86f4b1f6390422e9bcd1556399a3f0063965f00000000/1111111111111111111114oLvT2
    const test = network === NetWork.Mainnet ? '' : '/test'
    return `https://sensiblequery.com${test}/#/ft/utxo/${codehash}/${genesis}/${address}`
}


export function getWocAddressUrl(network: NetWork, address: string) {
    let url = ''
    if (network === NetWork.Mainnet) {
        url = 'https://whatsonchain.com/address/'
    } 
    if (network === NetWork.Testnet) {
        url = 'https://test.whatsonchain.com/address/'
    }
    if (!url) {
        return url
    }
    url += address
    return url
}

export function getWocTransactionUrl(network: NetWork, txid: string) {
    let url = ''
    if (network === NetWork.Mainnet) {
        url = 'https://whatsonchain.com/tx/'
    } 
    if (network === NetWork.Testnet) {
        url = 'https://test.whatsonchain.com/tx/'
    }
    if (!url) {
        return url
    }
    url += txid
    return url
}

// todo ????????????
export async function getAddressSensibleFtList(network: NetWork, address: string): Promise<SensibleFt[]> {
    // todo remove next line
    let res: SensibleFt[] = []
    try {
        for (let page = 1; ; page++) {
            const list = await getAddressSensibleFtListByPage(network, address, page)
            res = [...res, ...list]
            if (list.length === 0) {
                break
            }
        }
    } catch (err) {
        console.log('getAddressSensibleFtList error')
        console.error(err)
    }
    return res;
}

export async function getAddressSensibleFtListByPage(network: NetWork, address: string, page: number): Promise<SensibleFt[]> {
    const apiPrefix = getSensibleApiPrefix(network)
    const {data} = await axios.get(`${apiPrefix}/ft/summary/${address}?cursor=${(page - 1) * 20}&size=20`)
    const success = isSensibleSuccess(data)

    if (success) {
        return (data.data || []).map((item: any) => {
            return {
                genesis: item.genesis,
                codehash: item.codehash,
                tokenName: item.name,
                tokenSymbol: item.symbol,
                tokenDecimal: item.decimal,
                balance: util.plus(item.balance, item.pendingBalance),
            }
        })
    }
    throw new Error(data.msg)
}

// ?????? bsv utxo
export async function getAddressBsvUtxoList(network: NetWork, address: string, page: number): Promise<BsvUtxo[]> {
    const pageSize = 16
    const cursor = (page - 1) * pageSize
    const apiPrefix = getSensibleApiPrefix(network)
    const {data} = await axios.get(`${apiPrefix}/address/${address}/utxo?cursor=${cursor}&size=${pageSize}`)
    const success = isSensibleSuccess(data)
    if (success) {
        return (data.data || []).map((item: any) => {
            return {
                txId: item.txid, 
                outputIndex: item.vout,
                satoshis: item.satoshi,
                address: address,
            }
        })
    }

    // const fakeUtxoList: BsvUtxo[] = [
    //     {
    //         txId: '6a18f5b859fb4c281affaf8f6245a2fe0813867d4b7d24948da18e099462619b',
    //         outputIndex: 0,
    //         satoshis: 98775,
    //         address,
    //     },
    //     {
    //         txId: 'de980facfe7b10a84bfa658130b2b7725565510f967534459d63e6c9717a08e2',
    //         outputIndex: 0,
    //         satoshis: 98679,
    //         address,
    //     },
    //     {
    //         txId: '8ace8ab3995de63af867d929561b3a48bb499ea8d6e64c2ecefba29c6213764f',
    //         outputIndex: 4,
    //         satoshis: 4939535,
    //         address,
    //     },
    //     {
    //         txId: '74bec534becb77f894bcacaf2386604642a1ea00e371838b1780f5235a12bb9d',
    //         outputIndex: 2,
    //         satoshis: 45033315,
    //         address,
    //     }
    // ]
    // if (page === 1) {
    //     return fakeUtxoList
    // }
    // return []
    
    throw new Error(data.msg)
}

// ??????bsv ??????, ???????????????ft utxo????????????????????????
export async function getAddressBsvBalance(network: NetWork, address: string): Promise<number | string> {
    const apiPrefix = getSensibleApiPrefix(network)
    const {data} = await axios.get(`${apiPrefix}/address/${address}/balance`)
    const success = isSensibleSuccess(data)
    if (success) {
        return util.plus(data.data.satoshi, data.data.pendingSatoshi)
    }
    throw new Error(data.msg)
}

export async function getAddressBsvBalanceByUtxo(network: NetWork, address: string): Promise<string> {
    let page = 1
    let sum: string = '0'
    for (;;) {
        const utxoList = await getAddressBsvUtxoList(network, address, page)
        const total = utxoList.reduce((prev: any, cur: any) => util.plus(prev, cur.satoshis), '0')
        sum = util.plus(sum, total)
        if (utxoList.length === 0) {
            break
        }
        page++
    }
    console.log('balance', sum)
    return sum
}

// ?????? sensible ft ??????
export async function getAddressSensibleFtBalance(network: NetWork, address: string, codehash: string, genesis: string): Promise<number> {
    const apiPrefix = getSensibleApiPrefix(network)
    const {data} = await axios.get(`${apiPrefix}/ft/balance/${codehash}/${genesis}/${address}`)
    const success = isSensibleSuccess(data)
    if (success) {
        return data.data.satoshi
    }
    throw new Error(data.msg)
}

// ?????? sensible ?????? ??????
export async function getSensibleAddressUrl(network: NetWork, address: string, codehash: string, genesis: string) {
    const test = network === NetWork.Mainnet ? '' : '/test'
    // https://sensiblequery.com/#/ft/utxo/ac939f3cf7aba022d09f05e5448f1e635c81dbb3/598d220eaecb68cf783cbc6cc6295d042897874f/1FJCX1QG7KyaHpx1U2iVe4xoAWNVB1Wd3L
    return `https://sensiblequery.com${test}/#/ft/utxo/${codehash}/${genesis}/${address}`
}


// ????????????
export async function broadcastSensibleQeury(network: NetWork, rawtx: string) {
    const apiPrefx = getSensibleApiPrefix(network)
    console.log('sensible ????????????', network, rawtx)
    const {data} = await axios.post(`${apiPrefx}/pushtx`, {
        txHex: rawtx,
    })
    const success = isSensibleSuccess(data)
    if (success) {
        return new bsv.Transaction(rawtx).hash
    }
    throw new Error(data.msg)
}


// ?????? token ??????
const mapBsvFeeError = (err: Error) => {
    if (err.message === "Insufficient balance.") {
        // ??????????????????????????????
        return new Error('Low bsv balance to pay miners')
    }
    return err
}
export async function transferSensibleFt(network: NetWork, signers: SensibleSatotx[], senderWif: string, receivers: TransferReceiver[], codehash: string, genesis: string, ){
    const selectRes = signers && signers.length > 0 ? await SensibleFT.selectSigners(signers) : await SensibleFT.selectSigners();
    // const selectRes = await SensibleFT.selectSigners();

    const ft = new SensibleFT({
        network: network as any,
        purse: senderWif,
        feeb: 0.5,
        signerSelecteds: selectRes.signerSelecteds,
        signers: selectRes.signers,
    })
    console.log('transferSensibleFt', receivers, network, codehash, genesis, signers)

    try {
        const {txid, tx} = await ft.transfer({
            senderWif: senderWif,
            receivers,
            codehash,
            genesis,
        })
        util.checkFeeRate(tx)
        const txParseRes = parseTransaction(network, tx.serialize(true))
        return {
            txid,
            outputs: txParseRes.outputs,
        }
    } catch (_err) {
        const err = mapBsvFeeError(_err)
        const errMsg = err.toString();
        const isBsvAmountExceed =
          errMsg.indexOf(
            "The count of utxos should not be more than 3 in transfer"
          ) > 0;
        let isFtUtxoAmountExceed = errMsg.indexOf('Too many token-utxos') > 0;
        console.log("broadcast sensible ft error");
        console.error(err);

        if (!isBsvAmountExceed && !isFtUtxoAmountExceed) {
            throw err;
        }

        // ?????? bsv utxo ??? merge bsv utxo
        if (isBsvAmountExceed) {
            try {
                await mergeBsvUtxo(network, senderWif)
                await sleep(3000)
            } catch (err) {
                console.log('merge bsv utxo fail')
                console.error(err)
                throw err
            }

            // merge ??????????????? ft transfer ??????
            try {
                const {txid, tx} = await ft.transfer({
                    senderWif: senderWif,
                    receivers,
                    codehash,
                    genesis,
                })
                util.checkFeeRate(tx)
                const txParseRes = parseTransaction(network, tx.serialize(true))
                return {
                    txid,
                    outputs: txParseRes.outputs,
                }
            } catch (_err) {
                const err = mapBsvFeeError(_err)
                console.log('ft transfer fail after bsv utxo merge')
                console.error(err)
                const errMsg = err.toString()
                isFtUtxoAmountExceed = errMsg.indexOf('Too many token-utxos') > 0;
                if (!isFtUtxoAmountExceed) {
                    throw err
                }
            }
        }

        if (isFtUtxoAmountExceed) {
            // merge utxo
            try {
                const {tx} = await ft.merge({
                    ownerWif: senderWif,
                    codehash,
                    genesis,
                })
                util.checkFeeRate(tx)
                await sleep(3000)
            } catch (err) {
                console.log('merge ft utxo fail')
                console.error(err)
                throw err
            }

            // merge ??????????????? ft transfer ??????
            try {
                const {txid, tx} = await ft.transfer({
                    senderWif: senderWif,
                    receivers,
                    codehash,
                    genesis,
                })
                util.checkFeeRate(tx)
                const txParseRes = parseTransaction(network, tx.serialize(true))
                return {
                    txid,
                    outputs: txParseRes.outputs,
                }
            } catch (_err) {
                const err = mapBsvFeeError(_err)
                console.log('ft transfer fail after ft utxo merge')
                console.error(err)
                throw err
            }
        }
    } 
}

const Signature = bsv.crypto.Signature;
export const sighashType = Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID;


// p2pkh ??????
export function unlockP2PKHInput(privateKey: bsv.PrivateKey, tx: bsv.Transaction, inputIndex: number, sigtype: number) {
    const sig = new bsv.Transaction.Signature({
      publicKey: privateKey.publicKey,
      prevTxId: tx.inputs[inputIndex].prevTxId,
      outputIndex: tx.inputs[inputIndex].outputIndex,
      inputIndex,
      signature: bsv.Transaction.Sighash.sign(
        tx,
        privateKey,
        sigtype,
        inputIndex,
        tx.inputs[inputIndex].output.script,
        tx.inputs[inputIndex].output.satoshisBN
      ),
      sigtype,
    });
  
    tx.inputs[inputIndex].setScript(
      bsv.Script.buildPublicKeyHashIn(
        sig.publicKey,
        sig.signature.toDER(),
        sig.sigtype
      )
    );
  }

// ?????? bsv ??????
function checkBsvReceiversSatisfied(receivers: TransferReceiver[], tx: any, network: NetWork) {
    let satified = true
    const txAddressAmountMap: {[key: string]: number} = {}
    const getKey = (address: string, amount: any) => {
        return `${address}_${util.toString(amount)}`
    }
    tx.outputs.forEach((output: any) => {
        const address = output.script.toAddress(network);
        const amount = output.satoshis
        const key = getKey(address, amount)
        txAddressAmountMap[key] = (txAddressAmountMap[key] || 0) + 1
    })
    for (let i = 0; i < receivers.length; i++) {
        const rece = receivers[i]
        const key = getKey(rece.address, rece.amount)
        if (!txAddressAmountMap[key]) {
            satified = false
            break
        }
        txAddressAmountMap[key] = txAddressAmountMap[key] - 1
    }
    return satified
}
export async function transferBsv(network: NetWork, senderWif: string, receivers: TransferReceiver[]) {
    // 1. ???????????? utxo ??????
    // 2. ?????? utxo ?????? ?????? ?????? receivers ??????
    // 3. ????????????
    // 4. ????????????
    console.log('arguments', network, senderWif, receivers)
    const address = new bsv.PrivateKey(senderWif, network).toAddress(network)
    const balance = await getAddressBsvBalanceByUtxo(network, address)
    const totalOutput = receivers.reduce((prev: any, cur) => util.plus(prev, cur.amount), '0')
    if (util.lessThan(balance, totalOutput)) {
        throw new Error('Insufficient_bsv_Balance')
    }
    let utxoValue: string = '0'
    let selectedUtxoList = []

    const tx = new bsv.Transaction()
    tx.feePerKb(500)
    const dust = 456

    // input = output + fee + change
    // ????????????: ?????? change ???, fee ??????, ?????? input ?????????, ???????????????????????????, ?????????????????????
    
    for (let page = 1; ;page++) {
        const utxoResList = await getAddressBsvUtxoList(network, address, page)
        for (let i = 0; i < utxoResList.length; i++) {
            const item = utxoResList[i]
            utxoValue = util.plus(utxoValue, item.satoshis)
            selectedUtxoList.push(item)
            tx.addInput(
                new bsv.Transaction.Input.PublicKeyHash({
                    output: new bsv.Transaction.Output({
                        script: bsv.Script.buildPublicKeyHashOut(item.address),
                        satoshis: item.satoshis,
                    }),
                    prevTxId: item.txId,
                    outputIndex: item.outputIndex,
                    script: bsv.Script.empty(),
                })
            );
            if (util.lessThanEqual(util.plus(totalOutput, dust), utxoValue)) {
                break
            }
        }
        if (util.lessThanEqual(util.plus(totalOutput, dust), utxoValue)) {
            break
        }
        if (utxoResList.length <= 0 ) {
            break
        }
    }
    receivers.forEach(item => {
        tx.to(item.address, +item.amount)
    })
    if (util.greaterThan(util.minus(utxoValue, +totalOutput), 0)) {
        tx.change(address)
    }
    // ?????? (utxo?????? - fee - ????????????) = ?????? < dust?????????????????????
    if (util.lessThan(util.minus(utxoValue, tx.getFee(), totalOutput), dust)) {
        // ????????????
        tx.clearOutputs()
        receivers.forEach((item, index) => {
            
            if (receivers.length === index + 1) {
                // ?????????????????? change
                tx.change(item.address)
            } else {
                tx.to(item.address, +item.amount)
            }
        })
    }
    tx.inputs.forEach((_: any, inputIndex: number) => {
        const privateKey = new bsv.PrivateKey(senderWif)
        unlockP2PKHInput(privateKey, tx, inputIndex, sighashType);
    });
    util.checkFeeRate(tx)
    const txid = await broadcastSensibleQeury(network, tx.serialize())
    const txParseRes = parseTransaction(network, tx.serialize(true))

    const amountSatified = checkBsvReceiversSatisfied(receivers, tx, network)
    if (!amountSatified) {
        console.log(util.safeJsonStringify({
            type: 'bsvTransferAmountNotSatified',
            txid: tx.hash,
            receivers,
            outputs: txParseRes.outputs,
        }))
        Sentry.captureMessage(`bsvTransferAmountNotSatified_${address}_${tx.hash}`);
    }
    return {
        txid,
        outputs: txParseRes.outputs,
        fee: tx.getFee()
    }
}

// ?????? bsv utxo, ????????????
export async function mergeBsvUtxo(network: NetWork, senderWif: string) {
    const address = new bsv.PrivateKey(senderWif, network).toAddress(network)
    const utxolist = await getAddressBsvUtxoList(network, address, 1)
    const tx = new bsv.Transaction()
    tx.feePerKb(500)
    utxolist.forEach(item => {
        tx.addInput(new bsv.Transaction.Input.PublicKeyHash({
            output: new bsv.Transaction.Output({
                script: bsv.Script.buildPublicKeyHashOut(item.address),
                satoshis: item.satoshis,
            }),
            prevTxId: item.txId,
            outputIndex: item.outputIndex,
            script: bsv.Script.empty(),
        }))
    })
    tx.change(address)
    tx.inputs.forEach((_: any, inputIndex: number) => {
        const privateKey = new bsv.PrivateKey(senderWif)
        unlockP2PKHInput(privateKey, tx, inputIndex, sighashType)
    })
    util.checkFeeRate(tx)
    const txid = await broadcastSensibleQeury(network, tx.serialize())
    const txParseRes = parseTransaction(network, tx.serialize(true))
    return {
        txid,
        outputs: txParseRes.outputs,
    }
}

// ?????? sensible ft
export async function mergeSensibleFt(network: NetWork) {}

const hasProtoFlag = function (scriptBuffer: any) {
    const flag = protoHeader.getFlag(scriptBuffer);
    if (flag.compare(protoHeader.PROTO_FLAG) === 0) {
      return true;
    }
    return false;
};


const parseTokenContractScript = function (scriptBuf: any, network: any = "mainnet") {
    const hasSensibleFlag = hasProtoFlag(scriptBuf);
    if (!hasSensibleFlag) {
      return null;
    }
    const dataPart = tokenProto.parseDataPart(scriptBuf);
    const tokenAddress = new bsv.Address(
      Buffer.from(dataPart.tokenAddress!, "hex"),
      network
    ).toString();
    // const genesis = getGenesis(dataPart.sensibleID!.txid, dataPart.sensibleID!.index);
    const genesis = toHex(tokenProto.getTokenID(scriptBuf));
    const codehash = getCodeHash(new bsv.Script(scriptBuf));
    return {
      ...dataPart,
      genesis,
      codehash,
      tokenAddress,
    };
};



export function parseTransaction(network: NetWork, rawtx: string) {
    let tx
    try {
        tx = new bsv.Transaction(rawtx)
    } catch (err) {
        return {
            error: err.message
        }
    }

    const inputs = tx.inputs.map((input: any, index: number) => {
        const ftToken: any = parseTokenContractScript(input.script.toBuffer(), network);

        let ret: any = {
            index: index,
            prevTxId: input.prevTxId.toString('hex'),
            outputIndex: input.outputIndex,
            script: input.script.toString('hex'),
        }
        try {
            const addr = input.script.toAddress(network);
            if (addr) {
                ret.address = addr.toString()
            }
        } catch (err) {}
        if (!ftToken) {
            return ret
        }
        if (ftToken.tokenAmount <= 0) {
            return ret
        }
        ret = {
            ...ret,
            isFt: true,
            ftDetail: {
                genesis: ftToken.genesis,
                codehash: ftToken.codehash,
                address: ftToken.tokenAddress,
                decimal: ftToken.decimalNum,
                name: ftToken.tokenName,
                symbol: ftToken.tokenSymbol,
            }
        }
        return ret
    })
    const outputs = tx.outputs.map((output: any, index: number) => {
        const ftToken: any = parseTokenContractScript(output.script.toBuffer(), network);
        let ret: any = {
            index: index,
            satoshis: output.satoshis,
            script: output.script.toString('hex')
        }
        try {
            const addr = output.script.toAddress(network);
            if (addr) {
                ret.address = addr.toString()
            }
        } catch (err) {}
        if (!ftToken) {
            return ret
        }
        if (ftToken.tokenAmount <= 0) {
            return ret
        }
        ret = {
            ...ret,
            isFt: true,
            ftDetail: {
                genesis: ftToken.genesis,
                codehash: ftToken.codehash,
                address: ftToken.tokenAddress,
                decimal: ftToken.decimalNum,
                name: ftToken.tokenName,
                symbol: ftToken.tokenSymbol,
                amount: ftToken.tokenAmount,
            }
        }
        return ret
    })

    return {
        inputs: inputs,
        outputs: outputs,
        txid: tx.hash,
    }
    
}