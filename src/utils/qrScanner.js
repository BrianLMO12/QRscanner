/**
 * QR Code Scanner for Phone
 * Uses phone camera to scan QR codes (especially the PC connection QR)
 */

import { Html5QrcodeScanner } from 'html5-qrcode';

export class QRCodeScanner {
  constructor() {
    this.scanner = null;
    this.isScanning = false;
  }

  async requestCameraPermission() {
    try {
      // Explicitly request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      
      // Stop the stream - we just needed to trigger permission
      stream.getTracks().forEach(track => track.stop());
      console.log('Camera permission granted');
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera permission denied. Please enable camera access in browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No camera found on this device.');
      } else {
        throw new Error(`Camera error: ${error.message}`);
      }
    }
  }

  startScan(elementId, onScanSuccess, onScanError) {
    if (this.isScanning) return;

    try {
      console.log('Initializing QR scanner...');
      
      this.scanner = new Html5QrcodeScanner(
        elementId,
        {
          fps: 15,
          qrbox: { width: 280, height: 280 },
          rememberLastUsedCamera: true,
          aspectRatio: 1.0,
          disableFlip: false,
          showTorchButtonIfSupported: true,
          videoConstraints: {
            facingMode: { ideal: 'environment' }
          }
        },
        false
      );

      // Render the scanner
      const onSuccess = (decodedText, decodedResult) => {
        console.log('QR code decoded:', decodedText);
        onScanSuccess(decodedText);
      };

      const onError = (error) => {
        // Suppress noise - this is called often during scanning
        // Only log actual errors
        if (error && !error.includes('NotFoundException')) {
          console.debug('Scanning attempt:', error);
        }
      };

      this.scanner.render(onSuccess, onError);
      this.isScanning = true;
      console.log('QR scanner started');
    } catch (error) {
      console.error('QR Scanner init error:', error);
      if (onScanError) {
        onScanError(error);
      }
    }
  }

  stopScan() {
    if (this.scanner && this.isScanning) {
      try {
        this.scanner.clear();
        console.log('QR scanner stopped');
      } catch (e) {
        console.warn('Error clearing scanner:', e);
      }
      this.isScanning = false;
      this.scanner = null;
    }
  }

  isActive() {
    return this.isScanning;
  }
}
