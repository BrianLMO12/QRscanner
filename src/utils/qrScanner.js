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

    this.scanner = new Html5QrcodeScanner(
      elementId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0
      },
      false
    );

    this.scanner.render(onScanSuccess, onScanError);
    this.isScanning = true;
  }

  stopScan() {
    if (this.scanner) {
      this.scanner.clear();
      this.isScanning = false;
      this.scanner = null;
    }
  }

  isActive() {
    return this.isScanning;
  }
}
