# bsv web wallet

## install

```
npm i -S git+https://github.com/klouskingsley/bsv-web-wallet.git
```

## Usage

```js
import webWallet from "bsv-web-wallet";
const { Bsv } = webWallet;

const bsv = new Bsv();
// 连接到钱包
await bsv.requestAccount().then();
// 获取钱包账户信息
const accountInfo = await bsv.getAccount();
// 获取bsv 余额
const bsvBalance = await bsv.getBsvBalance();
// 发送bsv
const transferBsvRes = await bsv.transferBsv({
  receivers: [{ address: "xxx", amount: 333 }],
});
// 发送 sensible ft
const transferFtTres = await bsv.transferSensibleFt({
  receivers: [{ address: "xxx", amount: 344 }],
  codehash: "codehash",
  genesis: "genesis",
  rabinApis: [
    "https://s1.satoplay.com"
]
});
const transferAll = await bsv.transferAll([{
    receivers: [{ address: "xxx", amount: 344 }],
  codehash: "codehash",
  genesis: "genesis",
  rabinApis: [
    "https://s1.satoplay.com"
]
}])
```

## api

### bsv.requestAccount(): Promise<void>

连接到钱包

### bsv.exitAccount(): Promise<void>

退出登录

### bsv.getAccount(): Promise<{name: string, network: 'mainnet' | 'testnet'}>

获取钱包账户信息

### bsv.getAddress(): Promise<string>

获取钱包地址

### bsv.getBsvBalance(): Promise<{balance: number}>

获取钱包 bsv 余额，balance 单位为 satoshi

### bsv.getSensibleFtBalance(): Promise<Array<SensibleFt>>

获取钱包 sensible ft 余额

```ts
interface SensibleFt {
  genesis: string;
  codehash: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: number;
  balance: number;
}
```

### bsv.transferBsv({receivers: Array<Receiver>}): Promise<{txid: string}>

bsv 转账

```ts
interface Receiver {
  address: string;
  amount: number;
}
```

### bsv.transferSensibleFt({receivers: Array<Receiver>, codehash: string, genesis: string, rabinApis: Array<String>}): Promise<{txid: string}>

sensible ft 转账

```ts
interface Receiver {
  address: string;
  amount: number;
}
```


### bsv.transferAll([{receivers: Array<Receiver>, codehash: string, genesis: string, rabinApis: Array<String>}): Promise<{txid: string}]>

bsv 和 sensible ft 混合转账

```ts
interface Receiver {
  address: string;
  amount: number;
}
```
