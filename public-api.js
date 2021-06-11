// request_account

// transfer_bsv

// transfer_sensible_ft

// on: account

import createPostMsg from "post-msg";
import createEmitter from "on-emit";

// createOpener: postMsg:on:ready -> postMsg:post:ready -> postMsg:on:func-xxx -> postMsg:post:func-xxx
// 流程
/**
     * 
打开 iframe 不断请求 在线状态 和余额, 如果状态有变更，那么通知，如果余额有变更，那么通知

1. 连接
    1. 打开 openner 进行连接
    2. 返回 连接结果
2. 交易
    1. 打开 openner 进行 transfer
    2. 返回 transfer 结果
    


     */

function Bsv({ pageUrl = "http://localhost:3000/tic-tac-toe" } = {}) {
  const uuid = function () {
    return `${Date.now()}.${Math.random()}`;
  };
  const stringifyHash = function (data) {
    return encodeURIComponent(JSON.stringify(data));
  };
  const createIframe = function (url) {
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.cssText =
      "position: fixed; top: 0; left: 0; width: 50px; height: 50px;";
    return iframe;
  };

  const _createBackIframe = function () {
    const hashdata = {
      type: "iframe",
      id: uuid(),
    };
    const url = `${pageUrl}#${stringifyHash(hashdata)}`;
    const iframe = createIframe(url);
    document.body.appendChild(iframe);

    const targetWindow = iframe.contentWindow;
    const postMsg = createPostMsg(targetWindow, "*");
    function log(type, data, origin, source) {
      console.log(type, data, origin, source);
    }
    postMsg.on(`${hashdata.id}`, (type, data, origin) => {
      console.log("type", type, data, origin);
    });

    const rpc = (method, params) => {
      const requestId = uuid();
      return new Promise((resolve, reject) => {
        postMsg.on(hashdata.id, (_, eventData) => {
          if (eventData.type !== "response") {
            return;
          }
          const data = eventData.data;
          if (data.requestId === requestId) {
            data.error ? reject(error) : resolve(data.response);
          }
        });
        postMsg.emit(hashdata.id, {
          type: "request",
          data: {
            requestId,
            method,
            params,
          },
        });
      });
    };

    const getAccount = () => rpc("getAccount");
    const getBsvBalance = () => rpc("getBsvBalance");
    const getSensibleFtBalance = () => rpc("getSensibleFtBalance");
    const destroy = function () {
      iframe.parentChild.removeChild(iframe);
    };

    return {
      getAccount,
      getBsvBalance,
      getSensibleFtBalance,
      destroy,
    };
  };

  let backIframe = _createBackIframe();

  const outEmitter = createEmitter();
  const requestAccount = async function () {
    // 授权成功 resolve 账户信息
    // 授权失败 reject 错误信息
    // 账户信息, 资产余额 变更时，调用 outEmitter
  };
  const transferBsv = function () {
    // 交易成功 resolve  获取资产余额 是否变更
    // 交易失败 reject
  };
  const transferSensibleFt = function () {
    // 交易成功 resolve  获取资产余额 是否变更
    // 交易失败 reject
  };

  return {
    requestAccount,
    transferBsv,
    transferSensibleFt,
    getAccount: backIframe.getAccount,
    getBsvBalance: backIframe.getBsvBalance,
    getSensibleFtBalance: backIframe.getSensibleFtBalance,
    on: outEmitter.on,
  };
}

window.xxx = Bsv();
