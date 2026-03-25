/**
 * Detect local IP address using WebRTC
 * This works in browsers without requiring server calls
 */

export async function getLocalIP() {
  return new Promise((resolve) => {
    const pc = new RTCPeerConnection({ iceServers: [] });

    pc.createDataChannel('');
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(err => {
        console.warn('Failed to get local IP:', err);
        resolve(null);
      });

    pc.onicecandidate = (ice) => {
      if (!ice || !ice.candidate) return;

      const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
      const ipAddress = ipRegex.exec(ice.candidate.candidate)[1];

      // Filter out non-local IPs
      if (ipAddress && !ipAddress.startsWith('127.') && !ipAddress.startsWith('0.')) {
        resolve(ipAddress);
        pc.close();
      }
    };

    // Timeout after 3 seconds
    setTimeout(() => {
      pc.close();
      resolve(null);
    }, 3000);
  });
}

export function getServerURL(localIP, port = 8765) {
  if (!localIP) {
    return `http://localhost:${port}`;
  }
  return `http://${localIP}:${port}`;
}
