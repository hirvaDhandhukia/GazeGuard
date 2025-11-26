// this page initializes webgazer in the PAGE context using it's own script environment (TFJS backend)
// and i fetch the messages back to the content script 
(function() {
  try {
    // get the <script> tag that injected this bootstrap file
    const selfTag = document.getElementById('gg-webgazer-bootstrap');

    // TFJS core backend attributes
    const tfjsUrl = selfTag?.getAttribute('data-tfjs') || '';
    const tfWasmUrl = selfTag?.getAttribute('data-tfwasm') || '';

    // inject script in page context
    const injectScriptSrc = (id, srcUrl) => new Promise((resolve, reject) => {
      if (!srcUrl || document.getElementById(id)) {
        resolve('exists');
        return;
      }
      const s = document.createElement('script');
      s.id = id;
      s.src = srcUrl;
      s.async = true;
      s.onload = () => resolve('loaded');
      s.onerror = reject;
      // insert into DOM for execution
      (document.head || document.documentElement || document.body).appendChild(s);
    });

    const ensureTFLoaded = async () => {
      if (!window.tf && tfjsUrl) await injectScriptSrc('gg-tf-core', tfjsUrl);
      if (!window.tf && tfWasmUrl) await injectScriptSrc('gg-tf-wasm', tfWasmUrl);
    };

    // configure and initialize TensorFlow backend
    const setTFBackend = async () => {
      if (!(window.tf && window.tf.setBackend)) {
        console.log('[GG] TFJS not present; proceeding with WebGazer defaults');
        return;
      }

      // if your tfjs-backend-wasm version exposes setWasmPaths
      try {
        if (typeof window.tf.setWasmPaths === 'function' && tfWasmUrl) {
          // point to the folder that contains .wasm files
          const folder = tfWasmUrl.replace(/tf-backend-wasm\.min\.js$/, '');
          window.tf.setWasmPaths(folder);
        }
      } catch (e) {
        // ignore
      }

      // quiet some WebGL packer options (no-ops if not applicable) 
      try { window.tf.env().set('WEBGL_PACK', false); } catch(e) {}
      try { window.tf.env().set('WEBGL_FORCE_F16_TEXTURES', false); } catch(e) {}

      try {
        await window.tf.setBackend('wasm');
        await window.tf.ready();
        console.log('[GG] TFJS backend: WASM');
      } catch (err) {
        console.warn('[GG] WASM backend failed, CPU fallback:', err);
        await window.tf.setBackend('cpu');
        await window.tf.ready();
        console.log('[GG] TFJS backend: CPU');
      }
    };

    (async () => {
      if (!window.webgazer) {
        window.postMessage({ source:'gazeguard', type:'WEBGAZER_MISSING' }, '*');
        return;
      }

      // ensure TF is present (using URLs passed in data-attributes)
      await ensureTFLoaded();

      // force TF backend if available
      await setTFBackend();

      // initialize WebGazer with the only available tracker: TFFacemesh
      window.webgazer
        .setRegression('ridge')
        .setTracker('TFFacemesh')   // the build supports only TFFacemesh
        .showVideoPreview(false)
        .showPredictionPoints(false)
        .begin();

      // stream gaze data back to the content script
      window.webgazer.setGazeListener(function(data) {
        if (!data) return;
        window.postMessage({ source:'gazeguard', type:'GAZE', x:data.x, y:data.y, t:Date.now() }, '*');
      });

      window.postMessage({ source:'gazeguard', type:'WEBGAZER_READY' }, '*');
    })();
  } catch (err) {
    window.postMessage({ source:'gazeguard', type:'WEBGAZER_ERROR', error:String(err) }, '*');
  }
})();
