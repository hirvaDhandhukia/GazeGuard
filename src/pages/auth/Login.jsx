import React, { useEffect, useState } from 'react';
import { SignIn, SignUp, useAuth, useUser } from '@clerk/chrome-extension';

const Login = () => {
  // clerk auth state
  const { isSignedIn, isLoaded } = useAuth();
  const { user, _ } = useUser();

  // state to toggle between Sign In and Sign Up views
  const [showSignUp, setShowSignUp] = useState(false);

  const CURR_URL = chrome.runtime.getURL('/pages/auth/auth.html');

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        height: 100% !important;
        background: #A1C2BD !important;
      }
      #root, #app {
        height: 100% !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // persist clerk userid on localstorage once login is detected
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      chrome.storage.local.set({ clerkUserId: user.id }, () => {
        console.info("[GG] Clerk user stored:", user.id);
      });
    }
  }, [isLoaded, isSignedIn, user]);

  // post login redirect to calibration page
  useEffect(() => {
    // is clerk loaded?
    if (isLoaded && isSignedIn) {
      const calibrationUrl = chrome.runtime.getURL('/pages/calibration/calibration.html');
      window.location.href = calibrationUrl;
    }
  }, [isSignedIn, isLoaded]);

  // temporary loader before redirect
  if (!isLoaded) {
    return <div style={{ color: 'white' }}>Loading...</div>;
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#A1C2BD',
      overflow: 'hidden',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {!showSignUp ? (
          <>
            <SignIn withSignUp={false} forceRedirectUrl={CURR_URL} routing="hash" />
            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                Don't have an account?{' '}
              </span>
              <button
                onClick={() => setShowSignUp(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a8dadc',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  padding: 0
                }}
              >
                Create one
              </button>
            </div>
          </>
        ) : (
          <>
            <SignUp forceRedirectUrl={CURR_URL} routing="hash" />
            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                Already have an account?{' '}
              </span>
              <button
                onClick={() => setShowSignUp(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a8dadc',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  padding: 0
                }}
              >
                Sign in
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
