/**
 * Vercel Serverless Function - Register PC Server
 * POST /api/register - Register a PC with its local IP
 */

let registeredServers = {};

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

  if (req.method === 'POST') {
    const { deviceID, ip, port = 8765 } = req.body;

    if (!deviceID || !ip) {
      return res.status(400).json({ error: 'Missing deviceID or ip' });
    }

    // Register the server with timestamp
    registeredServers[deviceID] = {
      deviceID,
      ip,
      port,
      lastSeen: Date.now()
    };

    console.log('Server registered:', deviceID, ip);

    return res.status(200).json({
      success: true,
      message: `Server ${deviceID} registered at ${ip}:${port}`
    });
  }

  if (req.method === 'DELETE') {
    const { deviceID } = req.body;

    if (deviceID && registeredServers[deviceID]) {
      delete registeredServers[deviceID];
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Server not found' });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
