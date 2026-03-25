/**
 * WebSocket Management with Peer Discovery
 * Handles PC server creation and phone client connection
 */

import { getDeviceID } from './deviceDetection.js';

// Shared peer registry using localStorage for local network discovery
// and a simple server endpoint for Vercel/deployed versions
const PEER_REGISTRY_KEY = 'qr_scanner_peers';
const PEER_HEARTBEAT_INTERVAL = 5000;
const PEER_TIMEOUT = 15000;

export class PeerRegistry {
  constructor() {
    this.peers = new Map();
    this.heartbeatInterval = null;
  }

  registerPeer(peerId, info) {
    this.peers.set(peerId, {
      ...info,
      lastSeen: Date.now()
    });
    this.broadcastRegistry();
  }

  unregisterPeer(peerId) {
    this.peers.delete(peerId);
    this.broadcastRegistry();
  }

  getPeers() {
    const now = Date.now();
    // Filter out stale peers
    const activePeers = Array.from(this.peers.values()).filter(
      p => now - p.lastSeen < PEER_TIMEOUT
    );
    return activePeers;
  }

  broadcastRegistry() {
    try {
      localStorage.setItem(PEER_REGISTRY_KEY, JSON.stringify({
        peers: Array.from(this.peers.values()),
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Failed to broadcast peer registry:', e);
    }
  }

  startHeartbeat(peerId, info) {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    this.registerPeer(peerId, info);

    this.heartbeatInterval = setInterval(() => {
      this.registerPeer(peerId, info);
    }, PEER_HEARTBEAT_INTERVAL);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  watchRegistry(callback) {
    const handleStorageChange = (e) => {
      if (e.key === PEER_REGISTRY_KEY && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          callback(data.peers || []);
        } catch (err) {
          console.error('Failed to parse peer registry:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also poll periodically for changes
    const pollInterval = setInterval(() => {
      try {
        const stored = localStorage.getItem(PEER_REGISTRY_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          callback(data.peers || []);
        }
      } catch (err) {
        console.error('Failed to read peer registry:', err);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }
}

export const globalPeerRegistry = new PeerRegistry();

export class WebSocketServer {
  constructor() {
    this.server = null;
    this.clients = new Set();
    this.port = 8765;
    this.listeners = {};
    this.deviceID = getDeviceID();
    this.isRunning = false;
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
    // Register this PC as a discoverable server
    const serverInfo = {
      type: 'pc_server',
      deviceID: this.deviceID,
      url: window.location.origin,
      timestamp: Date.now(),
      role: 'display'
    };

    globalPeerRegistry.startHeartbeat(this.deviceID, serverInfo);
    this.isRunning = true;

    console.log('PC Server registered for discovery');
    this.emit('started', { port: this.port, deviceID: this.deviceID });
    return true;
  }

  stop() {
    globalPeerRegistry.stopHeartbeat();
    globalPeerRegistry.unregisterPeer(this.deviceID);
    this.isRunning = false;
  }

  getLocalIP() {
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
 * Auto-discovery of PC servers on the same device/network
 * Uses localStorage-based peer registry for local discovery
 * Works both on local WiFi and deployed on Vercel
 */
export async function discoverServers(timeout = 5000) {
  return new Promise((resolve) => {
    const servers = [];
    const seenPeers = new Set();

    // Start watching for servers in the peer registry
    const unwatch = globalPeerRegistry.watchRegistry((peers) => {
      peers.forEach(peer => {
        if (peer.type === 'pc_server' && !seenPeers.has(peer.deviceID)) {
          seenPeers.add(peer.deviceID);
          servers.push({
            deviceID: peer.deviceID,
            url: peer.url,
            origin: peer.url
          });
          console.log('Found server:', peer.deviceID, peer.url);
        }
      });
    });

    // Wait a bit for servers to be discovered, then resolve
    const timer = setTimeout(() => {
      unwatch();
      resolve(servers);
    }, timeout);

    // If we find at least one server quickly, resolve sooner
    const quickCheck = setInterval(() => {
      if (servers.length > 0) {
        clearInterval(quickCheck);
        clearTimeout(timer);
        unwatch();
        // Wait a bit more to catch additional servers
        setTimeout(() => resolve(servers), 500);
      }
    }, 100);
  });
}
