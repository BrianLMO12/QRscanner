import React, { useState, useEffect, useRef } from 'react';
import { WebSocketClient, discoverServers } from '../utils/websocket.js';
import { getDeviceID } from '../utils/deviceDetection.js';
import { initCamera, stopCamera, scanFrame, formatBarcodeData } from '../utils/scannerUtils.js';

function PhoneScanner() {
  const [status, setStatus] = useState('idle'); // idle, searching, connected, scanning, error
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected
  const [servers, setServers] = useState([]);
  const [wsClient] = useState(new WebSocketClient());
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const deviceID = getDeviceID();

  // Initialize and search for servers
  useEffect(() => {
    searchForServers();

    // Setup WebSocket listeners
    wsClient.on('connected', handleConnected);
    wsClient.on('disconnected', handleDisconnected);
    wsClient.on('error', handleWSError);

    return () => {
      if (streamRef.current) {
        stopCamera(streamRef.current);
      }
    };
  }, []);

  async function searchForServers() {
    setStatus('searching');
    setConnectionStatus('disconnected');

    try {
      const foundServers = await discoverServers(5000);

      if (foundServers.length > 0) {
        setServers(foundServers);
        setStatus('idle');
      } else {
        setStatus('error');
        setLastScan({
          message: 'No PC servers found. Make sure PC is connected and running on the same WiFi.'
        });
      }
    } catch (error) {
      setStatus('error');
      setLastScan({
        message: 'Search failed: ' + error.message
      });
    }
  }

  async function connectToServer(server) {
    setConnectionStatus('connecting');

    try {
      // Connect directly to the PC's origin (works both locally and on Vercel)
      const serverUrl = server.origin || server.url;
      await wsClient.connect(serverUrl);
      setConnectionStatus('connected');
      setStatus('scanning');
      startScanning();
    } catch (error) {
      setConnectionStatus('disconnected');
      setStatus('error');
      setLastScan({
        message: 'Failed to connect: ' + error.message
      });
    }
  }

  function handleConnected(data) {
    setConnectionStatus('connected');
    console.log('Phone connected to PC:', data);
  }

  function handleDisconnected() {
    setConnectionStatus('disconnected');
    setStatus('idle');
    stopScanning();
  }

  function handleWSError(error) {
    console.error('WebSocket error:', error);
    setLastScan({
      message: 'Connection error occurred'
    });
  }

  async function startScanning() {
    if (isScanning) return;

    try {
      setIsScanning(true);
      const stream = await initCamera(videoRef.current);
      streamRef.current = stream;

      // Start scanning frames
      scanIntervalRef.current = setInterval(async () => {
        if (videoRef.current && canvasRef.current && wsClient.isConnected()) {
          const result = await scanFrame(videoRef.current, canvasRef.current);

          if (result && result.value) {
            const data = formatBarcodeData(result);

            // Send to PC
            wsClient.send({
              type: 'BARCODE_SCAN',
              deviceID: deviceID,
              barcode: data,
              timestamp: Date.now()
            });

            setLastScan(data);
          }
        }
      }, 100); // Scan every 100ms
    } catch (error) {
      setIsScanning(false);
      setStatus('error');
      setLastScan({
        message: 'Camera access denied: ' + error.message
      });
    }
  }

  function stopScanning() {
    setIsScanning(false);

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      stopCamera(streamRef.current);
      streamRef.current = null;
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#0f0'; // Green
      case 'connecting': return '#ff8c00'; // Orange
      case 'disconnected': return '#f00'; // Red
      default: return '#999';
    }
  };

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
        padding: '20px',
        borderBottom: '1px solid #222',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Scanner</h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: getStatusColor(),
            boxShadow: `0 0 10px ${getStatusColor()}`
          }}></div>
          <span style={{ fontSize: '0.9rem' }}>
            {connectionStatus === 'connected' ? 'Connected' :
              connectionStatus === 'connecting' ? 'Connecting...' :
                'Disconnected'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        {status === 'searching' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '20px',
              animation: 'pulse 1s infinite'
            }}>...</div>
            <p>Searching for PC...</p>
          </div>
        )}

        {status === 'idle' && servers.length > 0 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '20px' }}>Found {servers.length} server(s)</p>
            {servers.map((server, idx) => (
              <button
                key={idx}
                onClick={() => connectToServer(server)}
                className="btn-primary"
                style={{
                  width: '80vw',
                  maxWidth: '300px',
                  padding: '15px 20px',
                  marginBottom: '10px',
                  fontSize: '1rem'
                }}
              >
                Connect to {server.ip}
              </button>
            ))}
            <button
              onClick={searchForServers}
              className="btn-secondary"
              style={{
                width: '80vw',
                maxWidth: '300px',
                padding: '15px 20px',
                marginTop: '10px',
                fontSize: '1rem'
              }}
            >
              Refresh Search
            </button>
          </div>
        )}

        {status === 'scanning' && (
          <div style={{
            textAlign: 'center',
            width: '100%'
          }}>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                maxHeight: '60vh',
                objectFit: 'cover',
                borderRadius: '12px',
                marginBottom: '20px'
              }}
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {lastScan && (
              <div style={{
                background: '#222',
                padding: '15px',
                borderRadius: '12px',
                marginBottom: '15px',
                textAlign: 'left'
              }}>
                <p style={{ marginBottom: '5px' }}>Last Scan:</p>
                <code style={{
                  fontSize: '0.8rem',
                  color: '#0f0',
                  wordBreak: 'break-all'
                }}>
                  {lastScan.value}
                </code>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#999',
                  marginTop: '5px'
                }}>
                  {lastScan.formattedTime}
                </p>
              </div>
            )}
            <button
              onClick={stopScanning}
              className="btn-danger"
              style={{
                width: '80vw',
                maxWidth: '300px',
                padding: '15px 20px',
                fontSize: '1rem'
              }}
            >
              Stop Scanning
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '20px',
              color: '#f00'
            }}>ERROR</div>
            <p>{lastScan?.message || 'An error occurred'}</p>
            <button
              onClick={searchForServers}
              className="btn-primary"
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                fontSize: '1rem'
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Device ID */}
      <div style={{
        padding: '10px 20px',
        borderTop: '1px solid #222',
        fontSize: '0.75rem',
        color: '#666',
        textAlign: 'center'
      }}>
        Device ID: {deviceID}
      </div>
    </div>
  );
}

export default PhoneScanner;
