/**
 * LoadPilot Projects API - CommonJS
 * GET /api/projects - List all projects
 * POST /api/projects - Create new project
 */

const { sql, query } = require('../_lib/db.js');
const { ensureDatabaseSchema } = require('../_lib/schema.js');

const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

module.exports = async function handler(req, res) {
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

  try {
    const schemaResult = await ensureDatabaseSchema();
    if (!schemaResult.success) {
      console.error('[API] Schema failed:', schemaResult.error);
    }

    // GET /api/projects - List all projects
    if (req.method === 'GET') {
      const projects = await query(`
        SELECT 
          id,
          legacy_twin_id,
          title,
          description,
          status,
          state_version,
          created_at,
          updated_at
        FROM projects
        WHERE deleted_at IS NULL
        ORDER BY updated_at DESC
      `);
      return res.status(200).json({ projects });
    }

    // POST /api/projects - Create new project
    if (req.method === 'POST') {
      const { title, description, original_input, analysis } = req.body || {};

      if (!title || !original_input) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['title', 'original_input']
        });
      }

      const projects = await query(`
        INSERT INTO projects (
          title,
          description,
          original_input,
          status,
          state,
          state_version,
          analysis
        ) VALUES (
          $1, $2, $3, 'active', $4, 1, $5
        )
        RETURNING *
      `, [
        title,
        description || '',
        original_input,
        JSON.stringify({
          version: 1,
          currentPhase: 'created',
          percent: 10,
          level: 1
        }),
        analysis ? JSON.stringify(analysis) : null
      ]);

      const project = projects[0];

      await query(`
        INSERT INTO project_events (
          project_id,
          event_type,
          actor,
          description,
          new_version
        ) VALUES ($1, 'project_created', 'user', $2, 1)
      `, [project.id, `Project "${title}" created`]);

      return res.status(201).json({ project });
    }

    // Method not allowed
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('[API] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
};
