/**
 * Vercel Serverless Function - List Active Servers
 * GET /api/servers - Returns list of registered PCs
 */

// Simple in-memory store (resets on redeploy)
let registeredServers = {};
const SERVER_TIMEOUT = 30000; // 30 seconds

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Clean up expired servers
    const now = Date.now();
    Object.keys(registeredServers).forEach(id => {
      if (now - registeredServers[id].lastSeen > SERVER_TIMEOUT) {
        delete registeredServers[id];
      }
    });

    // Return active servers
    const servers = Object.values(registeredServers).map(server => ({
      deviceID: server.deviceID,
      ip: server.ip,
      port: server.port,
      url: `http://${server.ip}:${server.port}`
    }));

    return res.status(200).json({ servers });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
