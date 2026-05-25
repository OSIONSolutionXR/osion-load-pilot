/**
 * LoadPilot Project Context Pack API
 * 
 * GET /api/projects/[id]/context-pack
 * 
 * Dynamically builds a complete project context from database tables.
 * This is a READ-ONLY export for KI-Chat and OpenClaw consumption.
 * 
 * IMPORTANT: Context Pack is NOT the source of truth.
 * The database tables (projects, measures, process_steps, events) are the truth.
 * This endpoint merely assembles a current snapshot.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../../_lib/db.js';
import { ensureDatabaseSchema } from '../../_lib/schema.js';

// Enable CORS
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

  // Ensure schema exists
  await ensureDatabaseSchema();

  try {
    // Parallel queries for performance
    const [
      projectResult,
      measuresResult,
      stepsResult,
      eventsResult
    ] = await Promise.all([
      sql`SELECT * FROM projects WHERE id = ${id} AND deleted_at IS NULL`,
      sql`SELECT * FROM measures WHERE project_id = ${id} AND deleted_at IS NULL ORDER BY created_at DESC`,
      sql`SELECT * FROM process_steps WHERE project_id = ${id} AND deleted_at IS NULL ORDER BY step_order`,
      sql`SELECT * FROM project_events WHERE project_id = ${id} ORDER BY created_at DESC LIMIT 50`
    ]);

    const project = projectResult[0];

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Build Context Pack
    const contextPack = {
      // Core project info
      project: {
        id: project.id,
        legacyTwinId: project.legacy_twin_id,
        title: project.title,
        description: project.description,
        originalInput: project.original_input,
        status: project.status,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      },

      // Project state (JSONB from database)
      projectState: project.state || {
        version: 1,
        currentPhase: 'created',
        percent: 10,
        level: 1
      },

      // Human-readable project memory
      projectMemory: project.memory_markdown || '',

      // AI analysis data
      analysis: project.analysis || null,

      // Measures
      measures: measuresResult.map(m => ({
        id: m.id,
        legacyId: m.legacy_measure_id,
        title: m.title,
        description: m.description,
        status: m.status,
        priority: m.priority,
        dueDate: m.due_date,
        owner: m.owner,
        valueScore: m.value_score,
        notes: m.notes,
        source: m.source,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
        completedAt: m.completed_at
      })),

      // Process steps
      processSteps: stepsResult.map(s => ({
        id: s.id,
        legacyId: s.legacy_step_id,
        title: s.title,
        description: s.description,
        status: s.status,
        order: s.step_order,
        dependsOn: s.depends_on || [],
        linkedMeasureIds: s.linked_measure_ids || [],
        blockerReason: s.blocker_reason,
        createdAt: s.created_at,
        updatedAt: s.updated_at
      })),

      // Recent events
      events: eventsResult.map(e => ({
        id: e.id,
        type: e.event_type,
        actor: e.actor,
        description: e.description,
        payload: e.payload,
        previousVersion: e.previous_version,
        newVersion: e.new_version,
        createdAt: e.created_at
      })),

      // Current version for conflict detection
      currentVersion: project.state_version || 1,

      // Flags indicating what needs rebuilding
      rebuildFlags: {
        processPath: stepsResult.length === 0 && measuresResult.length > 0,
        memory: !project.memory_markdown,
        measures: measuresResult.length === 0 && project.analysis?.actions?.length > 0
      },

      // Metadata
      source: 'loadpilot-backend',
      generatedAt: new Date().toISOString()
    };

    return res.status(200).json(contextPack);

  } catch (error) {
    console.error('[ContextPack] Error building context pack:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ 
      error: 'Failed to build project context pack', 
      details: message 
    });
  }
}
