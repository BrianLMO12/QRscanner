/**
 * Barcode Scanning Utility
 * Handles QR codes and various barcode formats
 */

import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import QrCode from 'jsqr';

/**
 * Initialize camera stream for scanning
 */
export async function initCamera(videoElement, isDesktop = false) {
  try {
    // Ensure video element is ready
    if (!videoElement) {
      throw new Error('Video element not found');
    }

    // Different constraints for desktop vs mobile
    const constraints = {
      video: isDesktop
        ? {
          // Desktop/USB camera - no facingMode preference
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
        : {
          // Mobile phone - prefer rear camera
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Set up video element
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.playsInline = true;

    // Play the video
    await videoElement.play().catch(err => console.warn('Video play warning:', err));

    return stream;
  } catch (error) {
    console.error('Camera access failed:', error);
    throw error;
  }
}

/**
 * Stop camera stream
 */
export function stopCamera(stream) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}

/**
 * Decode barcode from canvas
 * Uses html5-qrcode library for QR code detection
 */
export async function decodeFromCanvas(canvas) {
  try {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Decode QR code from image data
    const result = await decodeQRFromImageData(imageData);

    if (result) {
      return {
        type: 'QR',
        value: result,
        timestamp: Date.now()
      };
    }

    return null;
  } catch (error) {
    // Silent fail - QR codes aren't always visible in every frame
    return null;
  }
}

/**
 * Decode QR code from image data using jsQR
 */
async function decodeQRFromImageData(imageData) {
  try {
    // Use jsQR to decode from ImageData
    const code = QrCode(imageData.data, imageData.width, imageData.height);
    if (code) {
      return code.data;
    }

    return null;
  } catch (error) {
    // No QR code found in this frame, that's ok
    return null;
  }
}

/**
 * Scan frame from video element
 */
export async function scanFrame(videoElement, canvas) {
  try {
    if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
      canvas.height = videoElement.videoHeight;
      canvas.width = videoElement.videoWidth;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      return await decodeFromCanvas(canvas);
    }
    return null;
  } catch (error) {
    console.error('Scan error:', error);
    return null;
  }
}

/**
 * Format barcode data for display
 */
export function formatBarcodeData(barcode) {
  return {
    type: barcode.type || 'UNKNOWN',
    value: barcode.value || '',
    timestamp: barcode.timestamp || Date.now(),
    formattedTime: new Date(barcode.timestamp || Date.now()).toLocaleTimeString()
  };
}

/**
 * Validate barcode format
 */
export function validateBarcode(value, type) {
  switch (type.toUpperCase()) {
    case 'QR':
      return value && value.length > 0;
    case 'EAN':
    case 'UPC':
      return /^\d{12,13}$/.test(value);
    case 'CODE128':
      return /^[!-~]{1,}$/.test(value);
    case 'CODE39':
      return /^[0-9A-Z\-\.\ \$\/\+\%]*$/.test(value);
    case 'CODE93':
      return /^[0-9A-Z\-\.\ \$\/\+\%]*$/.test(value);
    case 'ITF':
      return /^\d{14}$/.test(value);
    default:
      return value && value.length > 0;
  }
}

/**
 * Parse barcode value - may contain structured data
 */
export function parseBarcodeValue(value, type) {
  const parsed = {
    raw: value,
    type: type
  };

  // Try to detect if it's JSON
  if (value.startsWith('{') && value.endsWith('}')) {
    try {
      parsed.data = JSON.parse(value);
      parsed.isJSON = true;
    } catch (e) {
      parsed.isJSON = false;
    }
  }

  // Try to detect if it's URL
  if (value.includes('://')) {
    parsed.isURL = true;
    try {
      const url = new URL(value);
      parsed.domain = url.hostname;
    } catch (e) {
      // Invalid URL
    }
  }

  return parsed;
}
