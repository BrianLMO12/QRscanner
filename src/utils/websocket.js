/**
 * WebSocket Management
 * Handles PC server creation and phone client connection
 */

import { getDeviceID } from './deviceDetection.js';

export class WebSocketServer {
  constructor() {
    this.server = null;
    this.clients = new Set();
    this.port = 8765;
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  broadcast(data) {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  async start() {
    // Note: For a real implementation, this would require a backend server
    // For now, this is a placeholder that indicates the PC is ready to receive connections
    console.log('WebSocket Server ready on ws://localhost:8765');
    this.emit('started', { port: this.port });
    return true;
  }

  getLocalIP() {
    // Get local IP from window location or fallback
    // In production, this would use the actual server IP
    return window.location.hostname || 'localhost';
  }
}

export class WebSocketClient {
  constructor() {
    this.ws = null;
    this.url = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 2000;
    this.listeners = {};
    this.deviceID = getDeviceID();
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  async connect(url) {
    return new Promise((resolve, reject) => {
      try {
        this.url = url;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('Connected to server');
          this.reconnectAttempts = 0;
          this.emit('connected', { deviceID: this.deviceID });

          // Send device info on connection
          this.send({
            type: 'DEVICE_INFO',
            deviceID: this.deviceID,
            timestamp: Date.now()
          });

          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit('message', data);
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from server');
          this.emit('disconnected', {});
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    console.warn('WebSocket not connected');
    return false;
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      setTimeout(() => {
        if (this.url) {
          this.connect(this.url).catch(err => {
            console.error('Reconnect failed:', err);
          });
        }
      }, this.reconnectDelay);

      this.emit('reconnecting', { attempt: this.reconnectAttempts });
    } else {
      this.emit('connection_lost', {});
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * Auto-discovery of WebSocket servers on the same WiFi network
 * This is a simplified implementation that scans common local IPs
 */
export async function discoverServers(port = 8765, timeout = 2000) {
  const servers = [];

  // Get local network prefix (assumes common local ranges)
  const localIP = window.location.hostname;

  // Only attempt discovery if on local network
  if (!localIP.includes('localhost') && !localIP.includes('127.0.0.1')) {
    const parts = localIP.split('.').slice(0, 3);
    const subnet = parts.join('.');

    // Scan common IPs in the subnet (just a few for quick discovery)
    const ipsToCheck = [];
    for (let i = 1; i <= Math.min(50, 255); i++) {
      ipsToCheck.push(`${subnet}.${i}`);
    }

    // Try to connect to each IP
    await Promise.allSettled(
      ipsToCheck.map(ip =>
        Promise.race([
          new Promise((resolve) => {
            const ws = new WebSocket(`ws://${ip}:${port}`);
            ws.onopen = () => {
              ws.close();
              resolve({ ip, port, url: `ws://${ip}:${port}` });
            };
            ws.onerror = () => resolve(null);
          }),
          new Promise(resolve => setTimeout(() => resolve(null), timeout))
        ])
      )
    ).then(results => {
      results.forEach(result => {
        if (result.value) {
          servers.push(result.value);
        }
      });
    });
  }

  return servers;
}
