/**
 * Minimal test endpoint - no DB, no secrets
 * Tests if Vercel API routing works at all
 */

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    status: 'ok',
    message: 'API routing works',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    env: process.env.VERCEL_ENV || 'unknown'
  });
};
