(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["bsvWebWallet"] = factory();
	else
		root["bsvWebWallet"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = function createEmitter () {
  var handlers = {}

  function on (type, handler) {
    handlers[type] = handlers[type] || []
    handlers[type].push(handler)
    return function dispose () {
      removeHandler(type, handler, true)
    }
  }

  function off (type, handler, once) {
    if (handler) {
      removeHandler(type, handler)
    } else {
      if (type) {
        handlers[type] = []
      } else {
        handlers = {}
      }
    }
  }

  function removeHandler (type, handler, removeOnlyOne) {
    for (var i = 0; handlers[type] && i < handlers[type].length; i++) {
      if (handlers[type][i] === handler) {
        handlers[type].splice(i, 1)
        if (removeOnlyOne) return
        i--
      }
    }
  }

  function emit (type) {
    var i
    for (i = 0; handlers[type] && i < handlers[type].length; i++) {
      handlers[type][i].apply(handlers[type][i], arguments)
    }
    for (i = 0; handlers['*'] && i < handlers['*'].length; i++) {
      handlers['*'][i].apply(handlers['*'][i], arguments)
    }
  }

  return { on: on, off: off, emit: emit }
}


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var createEmitter = __webpack_require__(0)

module.exports = function create (targetWindow, origin) {
  var emitter = createEmitter()
  var emit = emitter.emit

  window.addEventListener('message', receivePostMessage, false)

  emitter.emit = function emitPostMessage (type, data) {
    targetWindow.postMessage({ type: type, data: data }, origin || '*')
  }

  emitter.dispose = function dispose () {
    emitter.off()
    window.removeEventListener('message', receivePostMessage)
  }

  function receivePostMessage (event) {
    emit(event.data.type, event.data.data, event.origin, event.source)
  }

  return emitter
}


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXTERNAL MODULE: ./node_modules/post-msg/index.js
var post_msg = __webpack_require__(1);
var post_msg_default = /*#__PURE__*/__webpack_require__.n(post_msg);

// EXTERNAL MODULE: ./node_modules/on-emit/index.js
var on_emit = __webpack_require__(0);
var on_emit_default = /*#__PURE__*/__webpack_require__.n(on_emit);

// CONCATENATED MODULE: ./src/lib/dom.js
/**
 * Gets site metadata and returns it
 *
 */
async function getSiteMetadata() {
  return {
    name: getSiteName(window),
    icon: await getSiteIcon(window),
  };
}

/**
 * Extracts a name for the site from the DOM
 */
function getSiteName(windowObject) {
  const { document } = windowObject;

  const siteName = document.querySelector(
    'head > meta[property="og:site_name"]'
  );
  if (siteName) {
    return siteName.content;
  }

  const metaTitle = document.querySelector('head > meta[name="title"]');
  if (metaTitle) {
    return metaTitle.content;
  }

  if (document.title && document.title.length > 0) {
    return document.title;
  }

  return window.location.hostname;
}

/**
 * Extracts an icon for the site from the DOM
 * @returns an icon URL
 */
async function getSiteIcon(windowObject) {
  const { document } = windowObject;

  const icons = document.querySelectorAll('head > link[rel~="icon"]');
  for (const icon of icons) {
    if (icon && (await imgExists(icon.href))) {
      return icon.href;
    }
  }

  return null;
}

/**
 * Returns whether the given image URL exists
 * @param url - the url of the image
 * @returns Whether the image exists.
 */
function imgExists(url) {
  return new Promise((resolve, reject) => {
    try {
      const img = document.createElement("img");
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}

// CONCATENATED MODULE: ./public-api.js
// request_account

// transfer_bsv

// transfer_sensible_ft

// on: account





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

  const outEmitter = on_emit_default()();

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
    const postMsg = post_msg_default()(targetWindow, "*");
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
    const postMsg = post_msg_default()(targetWindow, "*");
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

    const getAccount = () => rpc("getAccount");
    const getBsvBalance = () => rpc("getBsvBalance");
    const getSensibleFtBalance = () => rpc("getSensibleFtBalance");
    const getAddress = () => rpc("getAddress");
    const logout = () => rpc("logout");
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

  return {
    requestAccount,
    exitAccount: backIframe.logout,
    transferBsv,
    transferSensibleFt,
    getAccount: backIframe.getAccount,
    getAddress: backIframe.getAddress,
    getBsvBalance: backIframe.getBsvBalance,
    getSensibleFtBalance: backIframe.getSensibleFtBalance,
    on: outEmitter.on,
  };
}

/* harmony default export */ var public_api = __webpack_exports__["default"] = ({
  // bsv: Bsv(),
  Bsv,
});


/***/ })
/******/ ]);
});