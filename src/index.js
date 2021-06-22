import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import * as actions from "./state/action";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

const isIframe = window === window.top;

Sentry.init({
  dsn: "https://d223c2a1d1bf44b6a657051ac9a99b16@o877284.ingest.sentry.io/5827823",
  integrations: [new Integrations.BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

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
    return obu && obu(event);
  };
})();

// alert(window === window.top);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
