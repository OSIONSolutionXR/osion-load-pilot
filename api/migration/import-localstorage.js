/**
 * LoadPilot Migration API - JavaScript
 * POST /api/migration/import-localstorage
 */

import { sql, query } from '../_lib/db.js';
import { ensureDatabaseSchema } from '../_lib/schema.js';

const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

function generateMemoryMarkdown(twin) {
  const lines = [
    `# Projekt: ${twin.title || 'Untitled'}`,
    '',
    `## Beschreibung`,
    twin.description || 'Keine Beschreibung',
    '',
    `## Erstellt`,
    new Date(twin.createdAt).toLocaleString('de-DE'),
    '',
  ];

  if (twin.measures?.length > 0) {
    lines.push(`## Maßnahmen (${twin.measures.length})`);
    twin.measures.forEach(m => lines.push(`- ${m.title} [${m.status}]`));
    lines.push('');
  }

  lines.push('---', `*Importiert aus localStorage*`, `*Legacy ID: ${twin.id}*`);
  return lines.join('\n');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!sql) {
    return res.status(500).json({ 
      error: 'Database not configured',
      details: 'DATABASE_URL environment variable is missing'
    });
  }

  const { twins, exportedAt } = req.body || {};

  if (!Array.isArray(twins)) {
    return res.status(400).json({
      error: 'Invalid request body',
      details: 'Expected { twins: Array }'
    });
  }

  await ensureDatabaseSchema();

  const report = {
    totalTwins: twins.length,
    projectsImported: 0,
    measuresImported: 0,
    stepsImported: 0,
    eventsImported: 0,
    errors: [],
    warnings: [],
    projectMappings: []
  };

  try {
    for (const twin of twins) {
      try {
        const state = {
          version: 1,
          currentPhase: twin.progress?.stage || 'created',
          percent: twin.progress?.percent || 10,
          level: twin.progress?.level || 1
        };

        const memoryMarkdown = generateMemoryMarkdown(twin);

        const projects = await query(`
          INSERT INTO projects (
            legacy_twin_id, title, description, original_input,
            status, state, state_version, memory_markdown, analysis,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id
        `, [
          twin.id,
          twin.title || 'Untitled',
          twin.description || '',
          twin.originalInput || '',
          twin.analysis?.project?.status || 'active',
          JSON.stringify(state),
          1,
          memoryMarkdown,
          twin.analysis ? JSON.stringify(twin.analysis) : null,
          twin.createdAt || new Date().toISOString(),
          twin.updatedAt || new Date().toISOString()
        ]);

        const projectId = projects[0].id;
        report.projectsImported++;
        report.projectMappings.push({ legacyId: twin.id, newId: projectId, title: twin.title });

        // Import measures
        if (twin.measures?.length) {
          for (const m of twin.measures) {
            try {
              await query(`
                INSERT INTO measures (
                  project_id, legacy_measure_id, title, description,
                  status, priority, due_date, owner, source, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              `, [
                projectId, m.id, m.title || 'Untitled', m.description || '',
                m.status || 'open', m.priority || 'medium', m.dueDate,
                m.owner || null, m.source || 'imported', m.createdAt || new Date().toISOString()
              ]);
              report.measuresImported++;
            } catch (err) {
              report.warnings.push(`Measure failed: ${err.message}`);
            }
          }
        }

        // Import events
        await query(`
          INSERT INTO project_events (project_id, event_type, actor, description, new_version, created_at)
          VALUES ($1, 'import_completed', 'system', $2, 1, $3)
        `, [projectId, `Imported from ${twin.id}`, new Date().toISOString()]);
        report.eventsImported++;

      } catch (err) {
        report.errors.push(`Twin ${twin.id} failed: ${err.message}`);
      }
    }

    return res.status(200).json({
      success: report.errors.length === 0,
      summary: {
        projectsImported: report.projectsImported,
        measuresImported: report.measuresImported,
        stepsImported: report.stepsImported,
        eventsImported: report.eventsImported,
        totalProcessed: report.totalTwins
      },
      details: report,
      exportedAt: exportedAt || new Date().toISOString(),
      importedAt: new Date().toISOString(),
      note: 'localStorage data was NOT deleted'
    });

  } catch (error) {
    console.error('[Migration] Fatal:', error);
    return res.status(500).json({
      error: 'Migration failed',
      details: error.message,
      partialReport: report
    });
  }
}
