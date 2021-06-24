import { bsv, toHex } from 'scryptlib';
import { NetWork } from '../web3';
import {Key, SensibleFt, SensibleSatotx, TransferReceiver, BsvUtxo} from '../state/stateType'
import axios from 'axios'
import {SensibleFT} from 'sensible-sdk'
import * as tokenProto from 'sensible-sdk/dist/bcp02/tokenProto'
import * as protoHeader from 'sensible-sdk/dist/bcp02/protoheader'
import { getCodeHash } from 'sensible-sdk/dist/common/utils';
import * as util from './util'

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

// todo 分页获取
export async function getAddressSensibleFtList(network: NetWork, address: string): Promise<SensibleFt[]> {
    // todo remove next line
    const apiPrefix = getSensibleApiPrefix(network)
    const {data} = await axios.get(`${apiPrefix}/ft/summary/${address}?cursor=0&size=20`)
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

// 获取 bsv utxo
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
    throw new Error(data.msg)
}

// 获取bsv 余额, 这里加入了ft utxo的值，暂时不能用
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
        sum += utxoList.reduce((prev: any, cur: any) => util.plus(prev, cur.satoshis), '0')
        if (utxoList.length === 0) {
            break
        }
        page++
    }
    return sum
}

// 获取 sensible ft 余额
export async function getAddressSensibleFtBalance(network: NetWork, address: string, codehash: string, genesis: string): Promise<number> {
    const apiPrefix = getSensibleApiPrefix(network)
    const {data} = await axios.get(`${apiPrefix}/ft/balance/${codehash}/${genesis}/${address}`)
    const success = isSensibleSuccess(data)
    if (success) {
        return data.data.satoshi
    }
    throw new Error(data.msg)
}

// 获取 sensible 余额 地址
export async function getSensibleAddressUrl(network: NetWork, address: string, codehash: string, genesis: string) {
    const test = network === NetWork.Mainnet ? '' : '/test'
    // https://sensiblequery.com/#/ft/utxo/ac939f3cf7aba022d09f05e5448f1e635c81dbb3/598d220eaecb68cf783cbc6cc6295d042897874f/1FJCX1QG7KyaHpx1U2iVe4xoAWNVB1Wd3L
    return `https://sensiblequery.com${test}/#/ft/utxo/${codehash}/${genesis}/${address}`
}


// 广播交易
export async function broadcastSensibleQeury(network: NetWork, rawtx: string) {
    const apiPrefx = getSensibleApiPrefix(network)
    const {data} = await axios.post(`${apiPrefx}/pushtx`, {
        txHex: rawtx,
    })
    const success = isSensibleSuccess(data)
    if (success) {
        return new bsv.Transaction(rawtx).hash
    }
    throw new Error(data.msg)
}


// 发送 token 交易
const mapBsvFeeError = (err: Error) => {
    if (err.message === "Insufficient balance.") {
        // 将模糊的错误信息转换
        return new Error('Low bsv balance to pay miners')
    }
    return err
}
export async function transferSensibleFt(network: NetWork, signers: SensibleSatotx[], senderWif: string, receivers: TransferReceiver[], codehash: string, genesis: string){
    const selectRes = await SensibleFT.selectSigners()
    const ft = new SensibleFT({
        network: network as any,
        purse: senderWif,
        feeb: 0.5,
        signerSelecteds: selectRes.signerSelecteds,
        signers: selectRes.signers,
    })
    console.log('transferSensibleFt', receivers, network, codehash, genesis)

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
        console.log("broadcast sensible ft error ");
        console.error(err);

        if (!isBsvAmountExceed && !isFtUtxoAmountExceed) {
            throw err;
        }

        // 如果 bsv utxo 先 merge bsv utxo
        if (isBsvAmountExceed) {
            try {
                await mergeBsvUtxo(network, senderWif)
                await sleep(3000)
            } catch (err) {
                console.log('merge bsv utxo fail')
                console.error(err)
                throw err
            }

            // merge 后重新发起 ft transfer 交易
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

            // merge 后重新发起 ft transfer 交易
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


// p2pkh 解锁
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

// 发送 bsv 交易
export async function transferBsv(network: NetWork, senderWif: string, receivers: TransferReceiver[]) {
    // 1. 获取用户 utxo 列表
    // 2. 判断 utxo 金额 是否 满足 receivers 金额
    // 3. 构造交易
    // 4. 广播交易
    console.log('arguments', network, senderWif, receivers)
    const address = new bsv.PrivateKey(senderWif, network).toAddress(network)
    const balance = await getAddressBsvBalanceByUtxo(network, address)
    const totalOutput = receivers.reduce((prev: any, cur) => util.plus(prev, cur.amount), '0')
    if (util.lessThan(balance, totalOutput)) {
        throw new Error('Insufficient_Balance')
    }
    let utxoValue: number | string = 0
    let selectedUtxoList = []

    const tx = new bsv.Transaction()
    tx.feePerKb(500)
    const dust = 456

    // input = output + fee + change
    // 异常情况: 加上 change 后, fee 增加, 原本 input 不够了, 此时将所有输出移除, 然后，暂不考虑
    
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
            if (util.lessThanEqual(totalOutput, util.plus(utxoValue, dust))) {
                break
            }
        }
        if (util.lessThanEqual(totalOutput, util.plus(utxoValue, dust))) {
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
    // 如果 (utxo输入 - fee - 所有输出) = 找零 < dust，那么全部转出
    if (util.lessThan(util.minus(utxoValue, tx.getFee(), totalOutput), dust)) {
        // 全部转出
        tx.clearOutputs()
        receivers.forEach((item, index) => {
            
            if (receivers.length === index + 1) {
                // 最后一个使用 change
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
    return {
        txid,
        outputs: txParseRes.outputs,
        fee: tx.getFee()
    }
}

// 合并 bsv utxo, 合并一页
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

// 合并 sensible ft
export async function mergeSensibleFt(network: NetWork) {}

const getGenesis = function (txid: string, index: number) {
    const txidBuf = Buffer.from(txid, "hex").reverse();
    const indexBuf = Buffer.alloc(4, 0);
    indexBuf.writeUInt32LE(index);
    return toHex(Buffer.concat([txidBuf, indexBuf]));
};

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
    const genesis = getGenesis(dataPart.tokenID!.txid, dataPart.tokenID!.index);
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