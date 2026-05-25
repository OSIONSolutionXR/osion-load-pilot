/**
 * LoadPilot Single Project API - JavaScript
 * GET /api/projects/:id - Get single project
 */

import { sql, query } from '../../_lib/db.js';
import { ensureDatabaseSchema } from '../../_lib/schema.js';

const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!sql) {
    return res.status(500).json({ 
      error: 'Database not configured',
      details: 'DATABASE_URL environment variable is missing'
    });
  }

  const projectId = req.query.id;

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID required' });
  }

  try {
    await ensureDatabaseSchema();

    const projects = await query(`
      SELECT * FROM projects
      WHERE id = $1 AND deleted_at IS NULL
    `, [projectId]);

    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.status(200).json({ project: projects[0] });

  } catch (error) {
    console.error('[API] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
