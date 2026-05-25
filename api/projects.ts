/**
 * LoadPilot Projects API
 * 
 * Routes:
 * - GET /api/projects - List all projects
 * - GET /api/projects?id=:id - Get single project
 * - POST /api/projects - Create new project
 * - GET /api/projects/:id/context-pack - Get complete context
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, query } from './_lib/db.js';
import { ensureDatabaseSchema } from './_lib/schema.js';

// Enable CORS
const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

// Ensure schema before operations
const withSchema = async (handler: () => Promise<void>) => {
  const schemaResult = await ensureDatabaseSchema();
  if (!schemaResult.success) {
    console.error('[API] Schema initialization failed:', schemaResult.error);
  }
  await handler();
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const pathMatch = req.url?.match(/\/projects\/([^\/]+)/);
  const projectId = pathMatch ? pathMatch[1] : null;

  try {
    await withSchema(async () => {
      // GET /api/projects - List all projects
      if (req.method === 'GET' && !projectId) {
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
        res.status(200).json({ projects });
        return;
      }

      // GET /api/projects/:id - Get single project
      if (req.method === 'GET' && projectId) {
        // Check if this is a context-pack request
        if (req.url?.includes('/context-pack')) {
          await getContextPack(projectId, res);
          return;
        }

        const projects = await query(`
          SELECT * FROM projects
          WHERE id = $1 AND deleted_at IS NULL
        `, [projectId]);

        if (projects.length === 0) {
          res.status(404).json({ error: 'Project not found' });
          return;
        }

        res.status(200).json({ project: projects[0] });
        return;
      }

      // POST /api/projects - Create new project
      if (req.method === 'POST') {
        const { title, description, original_input, analysis } = req.body || {};

        if (!title || !original_input) {
          res.status(400).json({ 
            error: 'Missing required fields',
            required: ['title', 'original_input']
          });
          return;
        }

        // Insert project
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

        // Log project_created event
        await query(`
          INSERT INTO project_events (
            project_id,
            event_type,
            actor,
            description,
            new_version
          ) VALUES ($1, 'project_created', 'user', $2, 1)
        `, [project.id, `Project "${title}" created`]);

        res.status(201).json({ project });
        return;
      }

      // Method not allowed
      res.setHeader('Allow', 'GET, POST, OPTIONS');
      res.status(405).json({ error: 'Method not allowed' });

    });

  } catch (error) {
    console.error('[API] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: 'Internal server error', details: message });
  }
}

/**
 * Build and return Project Context Pack
 * Dynamically assembled from database tables
 */
async function getContextPack(projectId: string, res: VercelResponse) {
  if (!sql) {
    res.status(500).json({ error: 'Database not configured' });
    return;
  }

  try {
    const projects = await query(`
      SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL
    `, [projectId]);

    const project = projects[0];

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Parallel queries for performance
    const [measures, steps, events] = await Promise.all([
      query(`SELECT * FROM measures WHERE project_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`, [projectId]),
      query(`SELECT * FROM process_steps WHERE project_id = $1 AND deleted_at IS NULL ORDER BY step_order`, [projectId]),
      query(`SELECT * FROM project_events WHERE project_id = $1 ORDER BY created_at DESC LIMIT 50`, [projectId])
    ]);

    const contextPack = {
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        originalInput: project.original_input,
        status: project.status,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      },

      projectState: project.state || {
        version: 1,
        currentPhase: 'created',
        percent: 10
      },

      projectMemory: project.memory_markdown || ``,

      analysis: project.analysis || null,

      measures: measures.map((m: any) => ({
        id: m.id,
        legacyId: m.legacy_measure_id,
        title: m.title,
        description: m.description,
        status: m.status,
        priority: m.priority,
        dueDate: m.due_date,
        owner: m.owner,
        source: m.source,
        createdAt: m.created_at,
        completedAt: m.completed_at
      })),

      processSteps: steps.map((s: any) => ({
        id: s.id,
        legacyId: s.legacy_step_id,
        title: s.title,
        description: s.description,
        status: s.status,
        order: s.step_order,
        dependsOn: s.depends_on || [],
        linkedMeasureIds: s.linked_measure_ids || [],
        blockerReason: s.blocker_reason
      })),

      events: events.map((e: any) => ({
        id: e.id,
        type: e.event_type,
        actor: e.actor,
        description: e.description,
        payload: e.payload,
        previousVersion: e.previous_version,
        newVersion: e.new_version,
        createdAt: e.created_at
      })),

      currentVersion: project.state_version || 1,

      rebuildFlags: {
        processPath: steps.length === 0,
        memory: !project.memory_markdown,
        measures: measures.length === 0
      },

      source: 'loadpilot-backend'
    };

    res.status(200).json(contextPack);

  } catch (error) {
    console.error('[ContextPack] Error building context pack:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ 
      error: 'Failed to build project context pack', 
      details: message 
    });
  }
}
