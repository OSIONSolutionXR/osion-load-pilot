/**
 * Health check endpoint for Sprint 1 verification
 */

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sprint: 1,
    environment: process.env.VERCEL_ENV || 'unknown',
    hasDatabaseUrl: !!process.env.DATABASE_URL
  });
}
