import BigNumber from "bignumber.js";

// 最大是253，那么全部用 string 吧
type NumberDuck = number | string

export function div (a: NumberDuck, ...others: NumberDuck[]): NumberDuck {
    let biga = new BigNumber(a)
    for (let i = 0; i < others.length; i++) {
        biga = biga.div(new BigNumber(others[i]))
    }
    return biga.toString()
}

export function multi(a: NumberDuck,  ...others: NumberDuck[]): NumberDuck {
    let biga = new BigNumber(a)
    for (let i = 0; i < others.length; i++) {
        biga = biga.multipliedBy(new BigNumber(others[i]))
    }
    return biga.toString()
}

export function plus(a: NumberDuck,  ...others: NumberDuck[]): NumberDuck {
    let biga = new BigNumber(a)
    for (let i = 0; i < others.length; i++) {
        biga = biga.plus(new BigNumber(others[i]))
    }
    return biga.toString()
}

export function minus(a: NumberDuck,  ...others: NumberDuck[]): NumberDuck {
    let biga = new BigNumber(a)
    for (let i = 0; i < others.length; i++) {
        biga = biga.minus(new BigNumber(others[i]))
    }
    return biga.toString()
}

export function getDecimalString(decimalNum: number): string {
    return new BigNumber(10).pow(decimalNum).toString()
}

// 传过来 string/int -> 显示(float) -> bigint
