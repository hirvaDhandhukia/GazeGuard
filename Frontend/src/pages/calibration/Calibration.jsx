import React, { useEffect, useState } from 'react';
import { UserButton, useUser } from '@clerk/chrome-extension';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';

// calibration points on screen width and height
const points = [
  { left: '30%', top: '10%' }, { left: '50%', top: '10%' }, { left: '90%', top: '10%' },
  { left: '10%', top: '50%' }, { left: '50%', top: '50%' }, { left: '90%', top: '50%' },
  { left: '10%', top: '90%' }, { left: '50%', top: '90%' }, { left: '90%', top: '90%' }
];

const Calibration = () => {
  const { user, isLoaded } = useUser();

  // current calibration point index
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState(null);
  
  // webgazer state
  const [webgazerReady, setWebgazerReady] = useState(false);
  
  
  useEffect(()=>{
    if(user && process.env.BACKEND_URL && process.env.USERS_ENDPOINT){
      console.info("[GG] logged in user is ", user);
      const email = user?.emailAddresses?.length && user.emailAddresses[0].emailAddress;
      chrome.runtime.sendMessage({ type: "fetchLocalhost", 
        url: `${process.env.BACKEND_URL}${process.env.USERS_ENDPOINT}`, 
        body: {
          id: user.id,
          email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        method: 'POST'
      }, (response) => {
        if (response.success) {
          console.info("[GG] Data from localhost:", response.data);
        } else {
          console.error("[GG] Error fetching from localhost:", response.error);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    const initWebGazer = async () => {
      try {
        console.info('1. Setting up TensorFlow backend...');
        tf.env().set('WEBGL_PACK', false);
        tf.env().set('WEBGL_FORCE_F16_TEXTURES', false);
        // cpu fallback if wasm fails: debug
        try {
          await tf.setBackend('wasm');
          await tf.ready();
          console.info('✓ TensorFlow backend: WASM');
        } catch (err) {
          await tf.setBackend('cpu');
          await tf.ready();
          console.info('✓ TensorFlow backend: CPU');
        }

        if (typeof window.webgazer === "undefined") {
          const script = document.createElement('script');
          script.src = chrome.runtime.getURL('/webgazer/webgazer.js');
          
          // configure WebGazer on script load
          script.onload = () => {
            try {
              console.info('✓ WebGazer loaded');

              // calibration persistence across sessions
              window.saveDataAcrossSessions = true;
              window.webgazer
                .setRegression('ridge')
                .setTracker('TFFacemesh')
                .showVideoPreview(true)
                .showPredictionPoints(true);

                // webgazer begin track
              window.webgazer.begin();
              console.info('!! WebGazer ready');
              setWebgazerReady(true);
            } catch (err) {
              setError('Failed to initialize WebGazer: ' + err.message);
            }
          };
          
          script.onerror = () => setError('Failed to load WebGazer');
          document.body.appendChild(script);
        } else {
          window.webgazer.begin();
          setWebgazerReady(true);
        }
      } catch (err) {
        setError('Error: ' + err.message);
      }
    };

    initWebGazer();

    // cleanup: stop webgazer when leaving page
    return () => {
      if (typeof window.webgazer !== 'undefined') {
        try {
          window.webgazer.end();
        } catch (e) {}
      }
    };
  }, []);

  // eventhandler: a click records the gaze -> screen mapping at that location
  const handlePointClick = () => {
    if (!window.webgazer) {
      setError('WebGazer not initialized');
      return;
    }

    try {
      const { left, top } = points[idx];

      // convert percentage coordinates to pixel coordinates
      const x = window.innerWidth * (Number.parseInt(left) / 100);
      const y = window.innerHeight * (Number.parseInt(top) / 100);
      
      // record calibration data into x, y coordinates
      window.webgazer.recordScreenPosition(x, y, 'click');
      
      // save calibration data and close window
      if (idx < points.length - 1) {
        setIdx(idx + 1);
      } else {
        chrome.storage.local.set({ calibrationComplete: true }, () => {
          chrome.runtime.sendMessage({
            type: 'CALIBRATION_COMPLETE'
          });
          window.alert("Calibration successful, closing this tab!");
          window.close();
        });
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  // if initialization failed
  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f8d7da',
        color: '#721c24',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Error</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: '#721c24',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!webgazerReady) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#A1C2BD',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div>Initializing eye tracking calibration...</div>
          <div style={{ marginTop: '10px', fontSize: '14px', opacity: 0.8 }}>
            Please allow camera access
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* current user button */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 10001 }}>
        <UserButton 
          afterSignOutUrl={chrome.runtime.getURL('/pages/auth/auth.html')}
        />
      </div>

      {/* current user email */}
      {isLoaded && user && (
        <div style={{
          position: 'fixed',
          top: 20,
          left: 20,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '10px 15px',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: 10001
        }}>
          {user.emailAddresses[0]?.emailAddress || user.username}
        </div>
      )}

      {/* calibration points */}
      {points.map((p, i) => (
        i === idx && (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#3399ff',
              opacity: 0.8,
              left: p.left,
              top: p.top,
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(51, 153, 255, 0.6)',
              transition: 'all 0.1s ease',
              border: '2px solid rgba(255, 255, 255, 0.5)'
            }}
            onClick={handlePointClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.2)';
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
              e.currentTarget.style.opacity = '0.8';
            }}
          />
        )
      ))}

      {/* instructions */}
      <div style={{
        position: 'fixed',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '6px',
        fontSize: '14px',
        textAlign: 'center',
        zIndex: 10000
      }}>
        Click the circle to calibrate • Point {idx + 1} of {points.length}
      </div>

      {/* progress bar below page */}
      <div style={{
        position: 'fixed',
        bottom: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '200px',
        height: '4px',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '2px',
        zIndex: 10000
      }}>
        <div
          style={{
            width: `${((idx + 1) / points.length) * 100}%`,
            height: '100%',
            background: '#3399ff',
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }}
        />
      </div>
    </div>
  );
};

export default Calibration;
