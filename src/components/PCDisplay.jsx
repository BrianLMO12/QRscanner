import React, { useState, useEffect, useRef } from 'react';
import { getDeviceID } from '../utils/deviceDetection.js';
import { WebSocketServer } from '../utils/websocket.js';
import { initCamera, stopCamera, scanFrame, formatBarcodeData } from '../utils/scannerUtils.js';

function PCDisplay({ setError }) {
  const [mode, setMode] = useState('setup'); // setup, phone, usb, display
  const [scanData, setScanData] = useState([]);
  const [connectedDevices, setConnectedDevices] = useState(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [cameraMode, setCameraMode] = useState(null); // 'phone' or 'usb'

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const wsServerRef = useRef(null);

  const deviceID = getDeviceID();

  useEffect(() => {
    console.log('PC Display Ready');
    console.log('Device ID:', deviceID);

    // Initialize WebSocket server for phone discovery
    wsServerRef.current = new WebSocketServer();
    wsServerRef.current.start();

    return () => {
      if (wsServerRef.current) {
        wsServerRef.current.stop();
      }
      if (streamRef.current) {
        stopCamera(streamRef.current);
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  function selectMode(selectedMode) {
    setMode(selectedMode);
    setScanData([]);
    setConnectedDevices(new Set());
  }

  function startPhoneMode() {
    setCameraMode('phone');
    setMode('display');
    console.log('Waiting for phone connections on ws://localhost:8765');
    setError(null);
  }

  async function startUSBMode() {
    try {
      setCameraMode('usb');
      setMode('display');
      setError(null);

      // Wait for React to render the video element
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if video element exists
      if (!videoRef.current) {
        setError('Video element not found. Page may not have loaded properly.');
        setMode('usb');
        return;
      }

      // Initialize camera for desktop with better error handling
      let stream;
      try {
        stream = await initCamera(videoRef.current, true);
      } catch (cameraError) {
        console.error('Camera error details:', cameraError);
        const errorMsg = cameraError.name === 'NotAllowedError'
          ? 'Camera permission denied. Please check your browser permissions.'
          : cameraError.name === 'NotFoundError'
            ? 'No camera found. Please connect a USB camera.'
            : cameraError.message || 'Unknown camera error';

        setError(errorMsg);
        setMode('usb');
        return;
      }

      streamRef.current = stream;
      setIsScanning(true);

      // Start scanning - use refs to avoid stale closure
      const scanningRef = { active: true };

      scanIntervalRef.current = setInterval(async () => {
        if (!scanningRef.active || !videoRef.current || !canvasRef.current) {
          return;
        }

        try {
          const result = await scanFrame(videoRef.current, canvasRef.current);

          if (result && result.value) {
            const data = formatBarcodeData(result);

            setScanData(prev => [{
              deviceID: 'USB Camera',
              barcode: data,
              timestamp: Date.now(),
              id: Date.now() + Math.random()
            }, ...prev]);
          }
        } catch (scanError) {
          console.error('Scan error:', scanError);
        }
      }, 100);

      // Store the scanning ref for cleanup
      streamRef.current._scanningRef = scanningRef;

    } catch (error) {
      console.error('Startup error:', error);
      setError('Failed to start USB scanner: ' + error.message);
      setMode('usb');
      setIsScanning(false);
    }
  }

  function stopScanning() {
    setIsScanning(false);

    // Mark scanning as inactive
    if (streamRef.current && streamRef.current._scanningRef) {
      streamRef.current._scanningRef.active = false;
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      stopCamera(streamRef.current);
      streamRef.current = null;
    }

    setMode('setup');
    setCameraMode(null);
  }

  function clearData() {
    setScanData([]);
  }

  function exportAsCSV() {
    const headers = ['Device ID', 'Barcode Value', 'Type', 'Timestamp'];
    const rows = scanData.map(item => [
      item.deviceID || 'Unknown',
      item.barcode?.value || item.value || '',
      item.barcode?.type || item.type || 'UNKNOWN',
      item.barcode?.formattedTime || new Date(item.timestamp).toLocaleString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scans-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  if (mode === 'setup') {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#000',
        color: '#fff',
        gap: '20px',
        padding: '20px'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '40px' }}>
          Select Scanner Mode
        </h1>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          width: '100%',
          maxWidth: '400px'
        }}>
          <button
            onClick={() => selectMode('phone')}
            className="btn-primary"
            style={{
              padding: '20px',
              fontSize: '1.2rem',
              width: '100%'
            }}
          >
            Phone Scanner
          </button>

          <button
            onClick={() => selectMode('usb')}
            className="btn-primary"
            style={{
              padding: '20px',
              fontSize: '1.2rem',
              width: '100%'
            }}
          >
            USB Camera
          </button>
        </div>

        <p style={{
          marginTop: '40px',
          fontSize: '0.9rem',
          color: '#999',
          textAlign: 'center'
        }}>
          PC ID: {deviceID}
        </p>
      </div>
    );
  }

  if (mode === 'phone') {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#000',
        color: '#fff',
        gap: '20px',
        padding: '20px'
      }}>
        <h2 style={{ fontSize: '1.8rem' }}>Phone Scanner Connection</h2>

        <div style={{
          background: '#222',
          padding: '30px',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <p style={{ marginBottom: '15px' }}>Connection Details:</p>
          <code style={{
            display: 'block',
            background: '#111',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '0.9rem',
            overflowX: 'auto'
          }}>
            ws://localhost:8765
          </code>
          <p style={{ fontSize: '0.9rem', color: '#999', marginBottom: '15px' }}>
            IP: 192.168.x.x (your local IP)
          </p>
          <p style={{ fontSize: '0.85rem', color: '#666' }}>
            Make sure phone is on the same WiFi network
          </p>
        </div>

        <button
          onClick={startPhoneMode}
          className="btn-primary"
          style={{
            padding: '15px 40px',
            fontSize: '1.1rem'
          }}
        >
          Start Listening
        </button>

        <button
          onClick={() => setMode('setup')}
          className="btn-secondary"
          style={{
            padding: '12px 30px',
            fontSize: '1rem'
          }}
        >
          Back
        </button>
      </div>
    );
  }

  if (mode === 'usb') {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#000',
        color: '#fff',
        gap: '20px',
        padding: '20px'
      }}>
        <h2 style={{ fontSize: '1.8rem' }}>USB Camera Scanner</h2>

        <div style={{
          background: '#222',
          padding: '30px',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <p style={{ marginBottom: '15px' }}>
            Initializing USB camera
          </p>
          <p style={{ fontSize: '0.9rem', color: '#999' }}>
            Make sure camera is connected and accessible
          </p>
        </div>

        <button
          onClick={startUSBMode}
          className="btn-primary"
          style={{
            padding: '15px 40px',
            fontSize: '1.1rem'
          }}
        >
          Start USB Scanner
        </button>

        <button
          onClick={() => setMode('setup')}
          className="btn-secondary"
          style={{
            padding: '12px 30px',
            fontSize: '1rem'
          }}
        >
          Back
        </button>
      </div>
    );
  }

  // Display mode
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#000',
      color: '#fff'
    }}>
      {/* Header */}
      <div style={{
        padding: '15px 20px',
        borderBottom: '1px solid #222',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '1.3rem', margin: 0 }}>
          {cameraMode === 'usb' ? 'USB Scanner' : 'Scan Data'}
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={exportAsCSV}
            disabled={scanData.length === 0}
            className="btn-secondary"
            style={{
              padding: '8px 16px',
              fontSize: '0.9rem'
            }}
          >
            Export CSV
          </button>
          <button
            onClick={clearData}
            disabled={scanData.length === 0}
            className="btn-danger"
            style={{
              padding: '8px 16px',
              fontSize: '0.9rem'
            }}
          >
            Clear
          </button>
          <button
            onClick={stopScanning}
            className="btn-secondary"
            style={{
              padding: '8px 16px',
              fontSize: '0.9rem'
            }}
          >
            Stop
          </button>
        </div>
      </div>

      {/* Camera View for USB Mode */}
      {cameraMode === 'usb' && (
        <div style={{
          padding: '15px 20px',
          borderBottom: '1px solid #222',
          textAlign: 'center'
        }}>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              maxHeight: '300px',
              objectFit: 'cover',
              borderRadius: '8px',
              background: '#111'
            }}
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}

      {/* Data Display */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px'
      }}>
        {scanData.length === 0 ? (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            textAlign: 'center'
          }}>
            <p>Waiting for scans...</p>
          </div>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{
                borderBottom: '2px solid #444'
              }}>
                <th style={{
                  padding: '12px 8px',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  Device ID
                </th>
                <th style={{
                  padding: '12px 8px',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  Barcode Value
                </th>
                <th style={{
                  padding: '12px 8px',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  Type
                </th>
                <th style={{
                  padding: '12px 8px',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {scanData.map(item => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid #222',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#111'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{
                    padding: '10px 8px',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    color: '#0f0'
                  }}>
                    {item.deviceID || 'N/A'}
                  </td>
                  <td style={{
                    padding: '10px 8px',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}>
                    {item.barcode?.value || item.value || ''}
                  </td>
                  <td style={{
                    padding: '10px 8px',
                    fontSize: '0.85rem',
                    textAlign: 'center'
                  }}>
                    {item.barcode?.type || item.type || 'UNKNOWN'}
                  </td>
                  <td style={{
                    padding: '10px 8px',
                    fontSize: '0.85rem',
                    color: '#999'
                  }}>
                    {item.barcode?.formattedTime || new Date(item.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats */}
      <div style={{
        padding: '15px 20px',
        borderTop: '1px solid #222',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.9rem',
        color: '#999'
      }}>
        <span>Total Scans: {scanData.length}</span>
        <span>Connected Devices: {connectedDevices.size}</span>
      </div>
    </div>
  );
}

export default PCDisplay;
