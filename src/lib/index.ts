import { bsv } from 'scryptlib';
import { NetWork } from '../web3';
import {Key, SensibleFt, SensibleSatotx, TransferReceiver, BsvUtxo} from '../state/stateType'
import axios from 'axios'
import {SensibleFT} from 'sensible-sdk'

function getSensibleApiPrefix(network: NetWork) {
    const test = network === NetWork.Mainnet ? '' : '/test'
    return `https://api.sensiblequery.com${test}`
}
function isSensibleSuccess(res: any) {
    return res.code === 0 && res.msg === 'ok'
}

export function formatValue(value: number, decimal: number) {
    // const bigNum = bsv.crypto.BN.fromNumber(value)
    // return bigNum.div(10**decimal).toString(10)
    return value / (10**decimal)
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
                balance: item.balance + item.pendingBalance,
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

// 获取bsv 余额
export async function getAddressBsvBalance(network: NetWork, address: string): Promise<number> {
    const apiPrefix = getSensibleApiPrefix(network)
    const {data} = await axios.get(`${apiPrefix}/address/${address}/balance`)
    const success = isSensibleSuccess(data)
    if (success) {
        return data.data.satoshi
    }
    throw new Error(data.msg)
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
    return new Error(data.msg)
}


// 发送 token 交易
export async function transferSensibleFt(network: NetWork, signers: SensibleSatotx[], senderWif: string, receivers: TransferReceiver[], codehash: string, genesis: string){
    const ft = new SensibleFT({
        network: network as any,
        purse: senderWif,
        feeb: 0.5,
        signers
    })
    const {txid} = await ft.transfer({
        senderWif: senderWif,
        receivers,
        codehash,
        genesis,
    })
    return {txid}
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
    const balance = await getAddressBsvBalance(network, address)
    const totalOutput = receivers.reduce((prev, cur) => prev + cur.amount, 0)
    if (balance < totalOutput) {
        throw new Error('Insufficient_Balance')
    }
    let utxoValue = 0
    let selectedUtxoList = []

    const tx = new bsv.Transaction()
    tx.feePerKb(500)
    const dust = 456

    // input = output + fee + change
    // 异常情况: 加上 change 后, fee 增加, 原本 input 不够了, 此时将所有输出移除, 然后
    
    for (let page = 1; ;page++) {
        const utxoResList = await getAddressBsvUtxoList(network, address, page)
        for (let i = 0; i < utxoResList.length; i++) {
            const item = utxoResList[i]
            utxoValue += item.satoshis
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
            if (totalOutput <= utxoValue) {
                break
            }
        }
        if (totalOutput <= utxoValue) {
            break
        }
    }
    receivers.forEach(item => {
        tx.to(item.address, item.amount)
    })
    if (utxoValue - totalOutput > 0) {
        tx.change(address)
    }
    if (utxoValue + tx.getFee() + dust > totalOutput) {
        tx.clearOutputs()
        receivers.forEach(item => {
            tx.to(item.address, item.amount)
        })
    }
    tx.inputs.forEach((_: any, inputIndex: number) => {
        const privateKey = new bsv.PrivateKey(senderWif)
        unlockP2PKHInput(privateKey, tx, inputIndex, sighashType);
    });
    const txid = await broadcastSensibleQeury(network, tx.serialize())
    return {
        txid
    }
}
