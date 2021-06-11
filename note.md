# 接口

## 请求 account

打开页面，如果没有登录，进行登录；如果已登录显示授权

## 请求交易

打开页面，让用户授权确认

## withdraw

# 页面结构

- title
  - logo
  - 退出登录
  - 提现
  - 历史交易
- 功能区
  - 功能 title
  - 详细功能
    - 账号密码登录
    - 已登录授权
    - 交易授权
    - bsv 提现
    - token 提现

# 架构

- ## 页面
- 页面操作，监听, 给 sdk 发送 onready, sdk postMessage 进行交易，交易完成关闭自己
- sdk，打开页面，给页面 postMessage, 发送消息
  - 提供方法
