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

  startScan(elementId, onScanSuccess, onScanError) {
    if (this.isScanning) return;

    try {
      this.scanner = new Html5QrcodeScanner(
        elementId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          aspectRatio: 1.0,
          disableFlip: false
        },
        false
      );

      // Correct API: render takes success and error callbacks
      this.scanner.render(
        (decodedText, decodedResult) => {
          console.log('QR decoded:', decodedText);
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Called continuously while scanning - silent
          // console.debug('QR scan:', errorMessage);
        }
      );

      this.isScanning = true;
    } catch (error) {
      console.error('QR Scanner init error:', error);
      if (onScanError) onScanError(error);
    }
  }

  stopScan() {
    if (this.scanner && this.isScanning) {
      try {
        this.scanner.clear();
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
