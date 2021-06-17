import {setGlobalState, getGlobalState } from './state'
import {generateKeysFromEmailPassword, getAddressSensibleFtList, getAddressBsvBalance} from '../lib'
import {Account, BalanceBsv, Key, SensibleFt} from './stateType'
import * as createPostMsg from 'post-msg';

// local account storage
const accountStorageKey = 'accountStorageKey'
function saveAccountStorage(account: Account | null) {
    const str = account ? JSON.stringify(account) : ''
    localStorage.setItem(accountStorageKey, str)
}
function getAccountStorage(): Account | null {
    const str = localStorage.getItem(accountStorageKey)
    if (!str) {
        return null
    }
    return JSON.parse(str)
}

// app action
let pollingBsvTimer = 0
let pollingSensibleFtTimer = 0
export async function pollingBsvBalance(){
    clearInterval(pollingBsvTimer)
    const fn = async () => {
        const account = getGlobalState('account')
        const key = getGlobalState('key')
        if (!account || !key) {
            return
        }
        try {
            const balance = await getAddressBsvBalance(account.network, key.address)
            setGlobalState('bsvBalance', {balance})
        } catch (err) {
            console.log('getAddressBsvBalance err', account.network, key.address, err)
        }
    }
    await fn()
    pollingBsvTimer = window.setInterval(fn, 5000)
}
export async function pollingSensibleFtBalance() {
    clearInterval(pollingSensibleFtTimer)
    const fn = async () => {
        const account = getGlobalState('account')
        const key = getGlobalState('key')
        if (!account || !key) {
            return
        }
        try {
            const sensibleFtList = await getAddressSensibleFtList(account.network, key.address)
            setGlobalState('sensibleFtList', sensibleFtList)
        } catch (err) {
            console.log('getAddressSensibleFtList err', account.network, key.address, err)
        }
    }
    await fn()
    pollingSensibleFtTimer = window.setInterval(fn, 5000)
}

export async function saveAccount(account: Account | null) {
    saveAccountStorage(account)
    if (account) {
        const key = generateKeysFromEmailPassword(account.email, account.password, account.network)
        setGlobalState('account', account)
        setGlobalState('key', key)
        await pollingSensibleFtBalance()
        pollingBsvBalance()
    } else {
        setGlobalState("account", null)
        setGlobalState('key', null)
    }
}

export function recoverAccountFromStorage() {
    const account = getAccountStorage()
    saveAccount(account)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// iframe action
export async function runIframeTask() {
    if (window === window.top) {
        return
    }
    const hashdata = JSON.parse(decodeURIComponent(window.location.hash.substr(1)))
    const postMsg = createPostMsg(window.top, '*')
    const id = hashdata.id

    let preAccount: Account | null = null
    let preBsvBalance: BalanceBsv | null = null
    let preSensibleFtBalance: SensibleFt[] = []
    let accountKey: Key | null = null
    // let lastBsvBalance: 

    postMsg.emit(id, {
        type: 'ready'
    })

    const isBsvBalanceEqual = (b1: BalanceBsv | null, b2: BalanceBsv | null) => {
        if (!b1 && !b2) {
            return true
        }
        return b1?.balance === b2?.balance
    }
    const isSensibleFtBalanceEqual = (b1: SensibleFt[], b2: SensibleFt[]) => {
        if (b1.length !== b2.length) {
            return false
        }
        b1.sort((item1, item2) => item1.genesis.localeCompare(item2.genesis))
        b2.sort((item1, item2) => item1.genesis.localeCompare(item2.genesis))

        for (let i = 0; i < b1.length; i++) {
            const item1 = b1[i]
            const item2 = b2[i]
            if (item1.genesis !== item2.genesis) {
                return false
            }
            if (item1.balance !== item2.balance) {
                return false
            }
        }                
        return true
    }
    const isAccountEqual = (b1: Account | null, b2: Account | null) => {
        return (
            b1?.email === b2?.email &&
            b1?.network === b2?.network &&
            b1?.password === b2?.password
        )
    }
    const requestLatestData = async () => {
        const latestAccount = getAccountStorage()
        if (!(isAccountEqual(latestAccount, preAccount))) {
            postMsg.emit(id, {
                type: 'account',
                data: latestAccount
            })
        }
        preAccount = latestAccount;
        if (preAccount) {
            // get balance
            accountKey = generateKeysFromEmailPassword(preAccount.email, preAccount.password, preAccount.network)
            try {
                const latestBalance = await getAddressBsvBalance(preAccount.network, accountKey.address)
                const equal = isBsvBalanceEqual(preBsvBalance, {balance: latestBalance})
                preBsvBalance = {balance: latestBalance}
                if (!equal) {
                    postMsg.emit(id, {
                        type: 'bsvBalance', 
                        data: preBsvBalance,
                    })
                }
            } catch (err) {}
            try {
                const latestBalance = await getAddressSensibleFtList(preAccount.network, accountKey.address)
                const equal = isSensibleFtBalanceEqual(preSensibleFtBalance, latestBalance)
                preSensibleFtBalance = latestBalance
                if (!equal) {
                    postMsg.emit(id, {
                        type: 'sensibleFtBalance',
                        data: preSensibleFtBalance
                    })
                }
            } catch (err) {}
            return true
        } else {
            return false
        }
    }

    const handleRequest = (method: string, fn: Function) => {
        postMsg.on(id, async function (_: any, eventData: any) {
            const {type, data} = eventData
            if (type === 'request' && data?.method === method) {
                const requestId = data.requestId
                try {
                    const res = await fn(data.params)
                    postMsg.emit(id, {
                        type: 'response',
                        data: {
                            requestId,
                            method,
                            response: res,
                        }
                    })
                } catch (err) {
                    postMsg.emit(id, {
                        type: 'response',
                        data: {
                            requestId,
                            method,
                            error: err.toString()
                        }
                    })
                }
            }
        })
    }

    handleRequest('getAccount', async () => {
        await requestLatestData()
        if (!preAccount) {
            return null
        }
        return {
            name: preAccount.email,
            email: preAccount.email,
            network: preAccount.network,
        }
    });
    handleRequest('getBsvBalance', async () => {
        await requestLatestData()
        return preBsvBalance
    })
    handleRequest('getSensibleFtBalance', async () => {
        await requestLatestData()
        return preSensibleFtBalance
    })
    handleRequest('getAddress', async () => {
        await requestLatestData()
        if (!accountKey) {
            return null
        }
        return accountKey.address
    })
    handleRequest('logout', async () => {
        saveAccountStorage(null)
    })

    for (;;) {
        const signed = await requestLatestData()
        await sleep(signed ? 3000 : 500)
    }

}