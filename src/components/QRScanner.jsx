import React, { useRef, useState, useEffect } from 'react';
import { QrCode, Play, Square, Loader } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';

const QRScanner = ({ onScan, onError }) => {
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const codeReaderRef = useRef(null);
  const streamsRef = useRef([]);
  const animationFrameRef = useRef(null);

  // Initialize code reader
  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setIsLoading(true);
      setIsScanning(true);

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      streamsRef.current.push(stream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          decodeQR();
        };
      }
    } catch (error) {
      setHasPermission(false);
      setIsScanning(false);
      if (error.name === 'NotAllowedError') {
        onError('Camera permission denied. Please enable camera access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        onError('No camera found on this device.');
      } else {
        onError('Failed to access camera: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const decodeQR = () => {
    if (!videoRef.current || !isScanning || !codeReaderRef.current) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      context.drawImage(videoRef.current, 0, 0);

      try {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const result = codeReaderRef.current.decodeFromImageData(
          imageData,
          canvas.width,
          canvas.height
        );

        if (result) {
          setIsScanning(false);
          stopScanning();
          onScan(result.text);
          return;
        }
      } catch (error) {
        // Continue scanning, no QR code found in this frame
      }
    }

    if (isScanning) {
      animationFrameRef.current = requestAnimationFrame(decodeQR);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    streamsRef.current.forEach((stream) => {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    });
    streamsRef.current = [];

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleStopClick = () => {
    stopScanning();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 px-6 py-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <QrCode className="w-8 h-8" />
            <h1 className="text-3xl font-bold">QR Code Scanner</h1>
          </div>
          <p className="text-gray-300 text-sm">
            {isScanning
              ? 'Point your camera at a QR code...'
              : 'Click the button below to start scanning'}
          </p>
        </div>

        {/* Video Container */}
        <div className="relative bg-black">
          {isScanning ? (
            <>
              <video
                ref={videoRef}
                className="w-full aspect-video object-cover"
                playsInline
              />
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-white rounded-lg shadow-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white" />
                </div>
              </div>
              {/* Loading indicator in corner */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                <Loader className="w-4 h-4 text-white animate-spin" />
                <span className="text-white text-sm">Scanning...</span>
              </div>
            </>
          ) : (
            <div className="w-full aspect-video flex items-center justify-center text-gray-400">
              <div className="text-center">
                <QrCode className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>Camera is inactive</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex gap-3">
            {!isScanning ? (
              <button
                onClick={startScanning}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Camera
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleStopClick}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                <Square className="w-5 h-5" />
                Stop Camera
              </button>
            )}
          </div>

          {hasPermission === false && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Camera Permission Required:</strong> This app needs camera access to scan QR codes. Please enable it in your browser settings.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default QRScanner;
