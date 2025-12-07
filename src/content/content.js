import { analyze } from "./detector/phishing-detector.js";
import { updateBubbleEyeDirection, showBubbleState } from "./bubble/bubble.js";

(function() {
  const WEBGAZER_PATH = 'webgazer/webgazer.js'; // dist path (no leading slash)
  const BOOTSTRAP_PATH = 'page-webgazer-bootstrap.js';  // dist path (emit/copy to dist/content/) 
  const TFJS_PATH = 'tf/tf.min.js';
  const TF_WASM_PATH = 'tf/tf-backend-wasm.min.js';

  const WEBGAZER_URL = chrome.runtime.getURL(WEBGAZER_PATH);
  const BOOTSTRAP_URL = chrome.runtime.getURL(BOOTSTRAP_PATH);
  const TFJS_URL = chrome.runtime.getURL(TFJS_PATH);
  const TF_WASM_URL = chrome.runtime.getURL(TF_WASM_PATH);

  // diagnostics 
  console.info('[GG] content.js loaded');
  console.info('[GG] webgazer url:', WEBGAZER_URL);
  console.info('[GG] bootstrap url:', BOOTSTRAP_URL);
  console.info('[GG] tf core url:', TFJS_URL);
  console.info('[GG] tf wasm url:', TF_WASM_URL);
  try {
    fetch(WEBGAZER_URL)
      .then(r => console.info('[GG] webgazer fetch status', r.status))
      .catch(e => console.warn('[GG] webgazer fetch error', e));
  } catch (e) {
    console.warn('[GG] fetch preflight error', e);
  }

  // helpers 
  const injectScriptSrc = (id, srcUrl) => new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve('exists');
      return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.src = srcUrl;
    s.async = true;
    s.onload = () => resolve('loaded');
    s.onerror = (e) => reject(e);
    (document.head || document.documentElement || document.body).appendChild(s);
  });

  // inject a script and attach data-* attributes 
  const injectScriptWithAttrs = (id, srcUrl, attrs = {}) => new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve('exists');
      return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.src = srcUrl;
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(`data-${k}`, v));
    s.async = true;
    s.onload = () => resolve('loaded');
    s.onerror = (e) => reject(e);
    (document.head || document.documentElement || document.body).appendChild(s);
  });

  const injectWebgazerScript = () => injectScriptSrc('gg-webgazer-script', WEBGAZER_URL);

  //  message bridge from PAGE -> content script 
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const msg = event.data;
    if (!msg || msg.source !== 'gazeguard') return;

    switch (msg.type) {
      case 'WEBGAZER_READY':
        console.info('[GG] WebGazer ready');
        break;
      case 'WEBGAZER_MISSING':
        console.warn('[GG] WebGazer missing after injection');
        break;
      case 'WEBGAZER_ERROR':
        console.error('[GG] WebGazer error:', msg.error);
        break;
      case 'GAZE': {
        const el = document.elementFromPoint(msg.x, msg.y);
        
        // bubble: eye movement callback
        updateBubbleEyeDirection(msg.x, msg.y);

        if(analyze){
            // here: phishing analysis with el, msg.x, msg.y
            console.info('[GG] gaze', msg.x, msg.y, el);

            return analyze(el)
            .catch((resp)=>{
              if(resp?.err){
                console.error("[GG] gaze - error analyzing phishing text", resp?.err);
              }
              else{
                // no actual error by classifier, just a debounce time or throttle to call LLM since it is expensive operation to call analyze frequently
                console.info("[GG] Dropping this error and waiting for next call to analyze", resp);
              }
              return Promise.resolve(undefined);
            }).then((resp)=>{
              const analysis = resp?.risk;
              const message = resp?.msg;
              if(analysis && analysis !== "benign"){
                console.warn("[GG] gaze - suspicious or risky text detected =>", el.textContent);
                showBubbleState("ABNORMAL", message);
              }
              // return Promise.resolve(resp);
            }).catch((err)=>{
              console.error("[GG] gaze - error resolving analysis script", err);
            });
        }
        break;
      }
      default:
        // ignore unknown messages 
        break;
    }
  });


  // initialization flow 
  const startEyeTracking = async () => {
    try {
      console.info('[GG] Injecting webgazer:', WEBGAZER_URL);
      const r1 = await injectWebgazerScript();
      console.info('[GG] webgazer injection result:', r1);
      console.info('[GG] Injecting bootstrap (CSP-safe external) with TF URLs:', BOOTSTRAP_URL);
      const r2 = await injectScriptWithAttrs('gg-webgazer-bootstrap', BOOTSTRAP_URL, {
        tfjs: TFJS_URL,
        tfwasm: TF_WASM_URL
      });
      console.info('[GG] bootstrap injection result:', r2);
      // from here, page-webgazer-bootstrap.js runs in PAGE world and posts messages back
    } catch (e) {
      console.error('[GG] injection failed', e);
    }
  };

  const init = () => {
    showBubbleState('NORMAL');

    // Gate by calibration status
    chrome.storage.local.get('calibrationComplete', ({ calibrationComplete }) => {
      if (calibrationComplete) {
        console.info('[GG] Calibration detected, initializing eye tracking');
        startEyeTracking();
      } else {
        console.info('[GG] Calibration not complete; waiting for signal');
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // react to calibration completion broadcast
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message && message.type === 'CALIBRATION_COMPLETED') {
        console.info('[GG] Calibration completion signal received; starting eye tracking');
        startEyeTracking();
        sendResponse && sendResponse({ ok: true });
        return; // avoid returning true (prevent async-channel warning)
      }
    } catch (e) {
      sendResponse && sendResponse({ ok: false, error: String(e) });
    }
    // do not return true unless calling sendResponse asynchronously later.
  });

  // react to storage changes (state calibration complete as 'true' on local storage of chrome )
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.calibrationComplete && changes.calibrationComplete.newValue) {
      console.info('[GG] Storage indicates calibration complete; starting eye tracking');
      startEyeTracking();
    }
  });
})();