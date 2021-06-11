import {setGlobalState, getGlobalState } from './state'
import {generateKeysFromEmailPassword, getAddressSensibleFtList, getAddressBsvBalance} from '../lib'
import {Account} from './stateType'

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
    pollingSensibleFtTimer = window.setInterval(fn, 5000)
}

export function saveAccount(account: Account | null) {
    saveAccountStorage(account)
    if (account) {
        const key = generateKeysFromEmailPassword(account.email, account.password, account.network)
        setGlobalState('account', account)
        setGlobalState('key', key)
        pollingBsvBalance()
        pollingSensibleFtBalance()
    } else {
        setGlobalState("account", null)
        setGlobalState('key', null)
    }
}

export function recoverAccountFromStorage() {
    const account = getAccountStorage()
    saveAccount(account)
}

