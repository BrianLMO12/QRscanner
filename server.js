#!/usr/bin/env node
/**
 * Simple WebSocket Server for QR Scanner PC
 * Run this on your local machine to enable phone connections
 * 
 * Usage: node server.js
 */

import WebSocket from 'ws';
import http from 'http';
import os from 'os';

const PORT = 8765;

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
  res.end('QR Scanner WebSocket Server\n');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Track connected clients
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);

      // Broadcast to all clients
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (e) {
      console.error('Error processing message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'WELCOME',
    message: 'Connected to QR Scanner Server',
    clientCount: clients.size,
    timestamp: Date.now()
  }));
});

// Get local IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  QR Scanner WebSocket Server listening on port ${PORT}\n`);
  console.log(`  Local IP: ${localIP}`);
  console.log(`  WebSocket URL: ws://${localIP}:${PORT}`);
  console.log(`  Connection URL: http://${localIP}:${PORT}\n`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.close();
  process.exit(0);
});
