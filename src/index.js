import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import * as actions from "./state/action";

const isIframe = window === window.top;

if (isIframe) {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById("root")
  );
} else {
  actions.runIframeTask();
}

// delete account when page/iframe exit
(function () {
  const obu = window.onbeforeunload;
  window.onbeforeunload = function (event) {
    const isPopup = !!window.opener;
    if (!isPopup) {
      actions.saveAccount(null);
    }
    return obu(event);
  };
})();

// alert(window === window.top);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
