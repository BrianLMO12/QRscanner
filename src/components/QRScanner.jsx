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
  const isScanningRef = useRef(false);

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
      isScanningRef.current = true;

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
      isScanningRef.current = false;
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

  const decodeQR = async () => {
    if (!videoRef.current || !isScanningRef.current || !codeReaderRef.current) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      context.drawImage(videoRef.current, 0, 0);

      try {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const result = await codeReaderRef.current.decodeFromImageData(
          imageData,
          canvas.width,
          canvas.height
        );

        if (result) {
          isScanningRef.current = false;
          setIsScanning(false);
          stopScanning();
          onScan(result.text);
          return;
        }
      } catch (error) {
        // Continue scanning, no QR code found in this frame
      }
    }

    if (isScanningRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => decodeQR());
    }
  };

  const stopScanning = () => {
    isScanningRef.current = false;
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
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 px-4 md:px-6 py-4 md:py-6 text-white">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <QrCode className="w-6 md:w-8 h-6 md:h-8" />
            <h1 className="text-xl md:text-3xl font-bold">QR Code Scanner</h1>
          </div>
          <p className="text-gray-300 text-xs md:text-sm">
            {isScanning
              ? 'Point your camera at a QR code...'
              : 'Click the button below to start scanning'}
          </p>
        </div>

        {/* Video Container */}
        <div className="relative bg-black w-full">
          {isScanning ? (
            <>
              <video
                ref={videoRef}
                className="w-full max-h-[75vh] md:max-h-[80vh] object-cover"
                playsInline
              />
              {/* Scanning overlay - Responsive */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white rounded-lg shadow-lg"
                  style={{
                    width: 'min(85vw, 85vh)',
                    height: 'min(85vw, 85vh)',
                  }}
                >
                  <div className="absolute top-0 left-0 w-4 md:w-8 h-4 md:h-8 border-t-2 border-l-2 border-white" />
                  <div className="absolute top-0 right-0 w-4 md:w-8 h-4 md:h-8 border-t-2 border-r-2 border-white" />
                  <div className="absolute bottom-0 left-0 w-4 md:w-8 h-4 md:h-8 border-b-2 border-l-2 border-white" />
                  <div className="absolute bottom-0 right-0 w-4 md:w-8 h-4 md:h-8 border-b-2 border-r-2 border-white" />
                </div>
              </div>
              {/* Loading indicator in corner - Responsive */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black bg-opacity-50 px-3 md:px-4 py-2 rounded-lg">
                <Loader className="w-3 md:w-4 h-3 md:h-4 text-white animate-spin" />
                <span className="text-white text-xs md:text-sm">Scanning...</span>
              </div>
            </>
          ) : (
            <div className="w-full min-h-[50vh] md:min-h-[60vh] flex items-center justify-center text-gray-400">
              <div className="text-center px-4">
                <QrCode className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-3 opacity-50" />
                <p className="text-sm md:text-base">Camera is inactive</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 md:px-6 py-3 md:py-4">
          <div className="flex gap-3">
            {!isScanning ? (
              <button
                onClick={startScanning}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-3 bg-gray-900 text-white font-semibold text-sm md:text-base rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 md:w-5 h-4 md:h-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 md:w-5 h-4 md:h-5" />
                    Start Camera
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleStopClick}
                className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-3 bg-red-600 text-white font-semibold text-sm md:text-base rounded-lg hover:bg-red-700 transition-colors"
              >
                <Square className="w-4 md:w-5 h-4 md:h-5" />
                Stop Camera
              </button>
            )}
          </div>

          {hasPermission === false && (
            <div className="mt-3 md:mt-4 p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs md:text-sm text-red-800">
                <strong>Camera Permission Required:</strong> This app needs camera access to scan QR codes. Please enable it in your browser settings.
              </p>
            </div>
          )}

          <div className="mt-3 md:mt-4 p-2 md:p-3 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Tip:</strong> Ensure good lighting and hold the camera steady. QR codes work best when fully visible within the frame.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
