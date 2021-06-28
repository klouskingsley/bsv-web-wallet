// request_account

// transfer_bsv

// transfer_sensible_ft

// on: account

import createPostMsg from "post-msg";
import createEmitter from "on-emit";
import { getSiteMetadata } from "./src/lib/dom";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

function Bsv({
  pageUrl = "https://klouskingsley.github.io/bsv-web-wallet",
  debug = false,
} = {}) {
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
      "position: fixed; top: -200px; left: -200px; width: 50px; height: 50px;";
    return iframe;
  };

  const outEmitter = createEmitter();

  const openPopupAndRequest = async function (method, params) {
    const id = uuid();
    const requestId = uuid();
    const hashdata = {
      type: "popup",
      id,
      data: {
        type: "request",
        data: {
          method: method,
          requestId,
          params,
        },
      },
    };
    const url = `${pageUrl}#${stringifyHash(hashdata)}`;
    const popWidth = 450;
    const popHeight = 700;
    const popTop = Math.round((window.innerHeight - popHeight) / 2);
    const popLeft = Math.round((window.innerWidth - popWidth) / 2);
    const targetWindow = window.open(
      url,
      "webWalletPopup",
      `width=${popWidth}, height=${popHeight}, left=${popLeft}, top=${popTop}, resizable,scrollbars,status`
    );
    const postMsg = createPostMsg(targetWindow, "*");
    return new Promise((resolve, reject) => {
      postMsg.on(id, (_, eventData) => {
        const { type, data } = eventData;
        if (type === "response" && data.requestId === requestId) {
          if (!targetWindow.closed) {
            targetWindow.close();
          }
          data.error ? reject(data.error) : resolve(data.response);
        }
      });
    });
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
    postMsg.on(`${hashdata.id}`, (type, data, origin) => {
      debug && console.log("type", type, data, origin);
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

    const pingUntilResponse = async () => {
      let receivedPong = false;
      for (;;) {
        rpc("ping").then(() => {
          receivedPong = true;
        });
        if (receivedPong) {
          break;
        }
        await sleep(50);
      }
    };

    const rpcAfterPing = async (method) => {
      await pingUntilResponse();
      return rpc(method);
    };

    const getAccount = () => rpcAfterPing("getAccount");
    const getBsvBalance = () => rpcAfterPing("getBsvBalance");
    const getSensibleFtBalance = () => rpcAfterPing("getSensibleFtBalance");
    const getAddress = () => rpcAfterPing("getAddress");
    const logout = () => rpcAfterPing("logout");
    const destroy = function () {
      iframe.parentChild.removeChild(iframe);
    };

    return {
      getAccount,
      getAddress,
      getBsvBalance,
      getSensibleFtBalance,
      destroy,
      logout,
    };
  };

  let backIframe = _createBackIframe();

  const requestAccount = async function () {
    // 授权成功 resolve 账户信息
    // 授权失败 reject 错误信息
    // 账户信息, 资产余额 变更时，调用 outEmitter
    // 获取当前页面 title, avatar
    const siteMeta = await getSiteMetadata();
    return openPopupAndRequest("requestAccount", siteMeta);
  };
  const transferBsv = function ({ receivers }) {
    // 交易成功 resolve  获取资产余额 是否变更
    // 交易失败 reject
    return openPopupAndRequest("transferBsv", {
      receivers,
    });
  };
  const transferSensibleFt = function ({ receivers, codehash, genesis }) {
    // 交易成功 resolve  获取资产余额 是否变更
    // 交易失败 reject
    return openPopupAndRequest("transferSensibleFt", {
      receivers,
      codehash,
      genesis,
    });
  };
  const transferAll = function (datas) {
    return openPopupAndRequest("transferAll", {
      datas
    })
  }

  return {
    requestAccount,
    exitAccount: backIframe.logout,
    transferBsv,
    transferSensibleFt,
    transferAll,
    getAccount: backIframe.getAccount,
    getAddress: backIframe.getAddress,
    getBsvBalance: backIframe.getBsvBalance,
    getSensibleFtBalance: backIframe.getSensibleFtBalance,
    on: outEmitter.on,
  };
}

export default {
  // bsv: Bsv(),
  Bsv,
};
