import BigNumber from "bignumber.js";
import {message} from 'antd'

// 最大是253，那么全部用 string 吧
type NumberDuck = number | string

export function div (a: NumberDuck, ...others: NumberDuck[]): string {
    let biga = new BigNumber(a)
    for (let i = 0; i < others.length; i++) {
        biga = biga.div(new BigNumber(others[i]))
    }
    return biga.toString()
}

export function multi(a: NumberDuck,  ...others: NumberDuck[]): string {
    let biga = new BigNumber(a)
    for (let i = 0; i < others.length; i++) {
        biga = biga.multipliedBy(new BigNumber(others[i]))
    }
    return biga.toString()
}

export function plus(a: NumberDuck,  ...others: NumberDuck[]): string {
    let biga = new BigNumber(a)
    for (let i = 0; i < others.length; i++) {
        biga = biga.plus(new BigNumber(others[i]))
    }
    return biga.toString()
}

export function minus(a: NumberDuck,  ...others: NumberDuck[]): string {
    let biga = new BigNumber(a)
    for (let i = 0; i < others.length; i++) {
        biga = biga.minus(new BigNumber(others[i]))
    }
    return biga.toString()
}

export function getDecimalString(decimalNum: number): string {
    return new BigNumber(10).pow(decimalNum).toString()
}

export function lessThan(a: NumberDuck, b: NumberDuck):boolean {
    let biga = new BigNumber(a)
    return biga.lt(new BigNumber(b))
}

export function lessThanEqual(a: NumberDuck, b: NumberDuck):boolean {
    let biga = new BigNumber(a)
    return biga.lte(new BigNumber(b))
}

export function greaterThan(a: NumberDuck, b: NumberDuck):boolean {
    let biga = new BigNumber(a)
    return biga.gt(new BigNumber(b))
}

export function greaterThanEqual(a: NumberDuck, b: NumberDuck):boolean {
    let biga = new BigNumber(a)
    return biga.gte(new BigNumber(b))
}

export function equal(a: NumberDuck, b: NumberDuck): boolean {
    let biga = new BigNumber(a)
    return biga.eq(new BigNumber(b))
}

export function toString(a: NumberDuck): string {
    return new BigNumber(a).toString()
}

export function checkFeeRate(tx: any, minFeeRate?: number) {
    minFeeRate = minFeeRate || 0.5
    const size = tx.toBuffer().length
    const feeRate = tx.getFee() / size;
    if (feeRate < minFeeRate) {
        const msg = `The fee rate should not be less than ${minFeeRate}, but in the end it is ${feeRate}`
        message.error(msg)
        throw new Error(msg)
    }
}

export function safeJsonStringify(data: any) {
    return JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value // return everything else unchanged
    ));
}

// 传过来 string/int -> 显示(float) -> bigint
