import React, { useState, useEffect } from 'react';
import { isMobileDevice } from './utils/deviceDetection.js';
import PhoneScanner from './components/PhoneScanner.jsx';
import PCDisplay from './components/PCDisplay.jsx';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [deviceType, setDeviceType] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Determine device type on initial load
    const mobile = isMobileDevice();
    setDeviceType(mobile ? 'mobile' : 'desktop');
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000'
      }}>
        <div style={{ color: '#fff', fontSize: '1.2rem' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {deviceType === 'mobile' ? (
        <PhoneScanner />
      ) : (
        <PCDisplay setError={setError} />
      )}

      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#ff0000',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '50px',
          fontSize: '0.9rem',
          zIndex: 1000
        }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              marginLeft: '10px',
              fontSize: '1.2rem'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
