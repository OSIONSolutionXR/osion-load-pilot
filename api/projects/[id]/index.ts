/**
 * LoadPilot Single Project API
 * 
 * GET /api/projects/[id]
 * 
 * Returns a single project by ID
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../../_lib/db.js';
import { ensureDatabaseSchema } from '../../_lib/schema.js';

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!sql) {
    return res.status(500).json({
      error: 'Database not configured',
      details: 'DATABASE_URL environment variable is missing'
    });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  await ensureDatabaseSchema();

  try {
    const [project] = await sql`
      SELECT * FROM projects 
      WHERE id = ${id} AND deleted_at IS NULL
    `;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.status(200).json({ project });

  } catch (error) {
    console.error('[Projects] Error fetching project:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: 'Failed to fetch project', details: message });
  }
}
