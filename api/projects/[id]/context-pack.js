/**
 * LoadPilot Context Pack API - JavaScript
 * GET /api/projects/:id/context-pack
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
      SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL
    `, [projectId]);

    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projects[0];

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
      projectMemory: project.memory_markdown || '',
      analysis: project.analysis || null,
      measures: measures.map(m => ({
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
      processSteps: steps.map(s => ({
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
      events: events.map(e => ({
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

    return res.status(200).json(contextPack);

  } catch (error) {
    console.error('[ContextPack] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: 'Failed to build context pack', details: message });
  }
}
