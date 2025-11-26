(function() {
  const WEBGAZER_PATH = 'webgazer/webgazer.js'; // dist path 
  const BOOTSTRAP_PATH = 'page-webgazer-bootstrap.js';  // dist path (emit/copy to dist/content/) 
  const TFJS_PATH = 'tf/tf.min.js';
  const TF_WASM_PATH = 'tf/tf-backend-wasm.min.js';

  const WEBGAZER_URL = chrome.runtime.getURL(WEBGAZER_PATH);
  const BOOTSTRAP_URL = chrome.runtime.getURL(BOOTSTRAP_PATH);
  const TFJS_URL = chrome.runtime.getURL(TFJS_PATH);
  const TF_WASM_URL = chrome.runtime.getURL(TF_WASM_PATH);

  // diagnostics 
  console.log('[GG] content.js loaded');
  console.log('[GG] webgazer url:', WEBGAZER_URL);
  console.log('[GG] bootstrap url:', BOOTSTRAP_URL);
  console.log('[GG] tf core url:', TFJS_URL);
  console.log('[GG] tf wasm url:', TF_WASM_URL);
  try {
    fetch(WEBGAZER_URL)
      .then(r => console.log('[GG] webgazer fetch status', r.status))
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
        console.log('[GG] WebGazer ready');
        break;
      case 'WEBGAZER_MISSING':
        console.warn('[GG] WebGazer missing after injection');
        break;
      case 'WEBGAZER_ERROR':
        console.error('[GG] WebGazer error:', msg.error);
        break;
      case 'GAZE': {
        const el = document.elementFromPoint(msg.x, msg.y);
        // TODO: phishing analysis with el, msg.x, msg.y
        console.log('[GG] gaze', msg.x, msg.y, el);
        break;
      }
      default:
        // ignore unknown messages 
        break;
    }
  });

  // floating bubble for maping eye
  const ensureBubble = () => {
    if (document.getElementById('gazeguard-bubble')) return;
    const bubble = document.createElement('div');
    bubble.id = 'gazeguard-bubble';
    Object.assign(bubble.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '28px',
      zIndex: '2147483647',
      border: '2px solid rgba(255,255,255,0.9)',
      boxShadow: '0 4px 12px rgba(255,0,0,0.35)',
      cursor: 'pointer',
      userSelect: 'none'
    });
    bubble.textContent = '!';
    bubble.title = 'Gazeguard';
    bubble.addEventListener('click', () => {
      alert('Gazeguard\n\nIf calibrationComplete is true, WebGazer will start in this tab.\nCheck the console for [GG] logs.');
    });
    (document.body || document.documentElement).appendChild(bubble);
  };

  // initialization flow 
  const startEyeTracking = async () => {
    try {
      console.log('[GG] Injecting webgazer:', WEBGAZER_URL);
      const r1 = await injectWebgazerScript();
      console.log('[GG] webgazer injection result:', r1);

      console.log('[GG] Injecting bootstrap (CSP-safe external) with TF URLs:', BOOTSTRAP_URL);
      const r2 = await injectScriptWithAttrs('gg-webgazer-bootstrap', BOOTSTRAP_URL, {
        tfjs: TFJS_URL,
        tfwasm: TF_WASM_URL
      });
      console.log('[GG] bootstrap injection result:', r2);

      // from here, page-webgazer-bootstrap.js runs in PAGE world and posts messages back
    } catch (e) {
      console.error('[GG] injection failed', e);
    }
  };

  const init = () => {
    ensureBubble();

    // Gate by calibration status
    chrome.storage.local.get('calibrationComplete', ({ calibrationComplete }) => {
      if (calibrationComplete) {
        console.log('[GG] Calibration detected, initializing eye tracking');
        startEyeTracking();
      } else {
        console.log('[GG] Calibration not complete; waiting for signal');
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
        console.log('[GG] Calibration completion signal received; starting eye tracking');
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
      console.log('[GG] Storage indicates calibration complete; starting eye tracking');
      startEyeTracking();
    }
  });
})();