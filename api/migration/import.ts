/**
 * LoadPilot Migration API
 * Import localStorage Twins into Neon Postgres
 * 
 * POST /api/migration/import-localstorage
 * 
 * Body: {
 *   twins: StoredProjectTwinV2[],
 *   exportedAt?: string
 * }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, query } from '../_lib/db.js';
import { ensureDatabaseSchema } from '../_lib/schema.js';

// Enable CORS
const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

// Type definitions matching localStorage structure
interface LocalStorageTwin {
  id: string;
  schemaVersion: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  originalInput: string;
  latestInput?: string;
  analysis?: any;
  processSteps?: any[];
  measures?: any[];
  activityLog?: any[];
  contextQuestions?: any[];
  progress?: any;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  if (!Array.isArray(twins) || twins.length === 0) {
    return res.status(400).json({
      error: 'Invalid request body',
      details: 'Expected { twins: StoredProjectTwinV2[] }'
    });
  }

  // Initialize schema first
  const schemaResult = await ensureDatabaseSchema();
  if (!schemaResult.success) {
    console.warn('[Migration] Schema initialization warning:', schemaResult.error);
  }

  const report = {
    totalTwins: twins.length,
    projectsImported: 0,
    measuresImported: 0,
    stepsImported: 0,
    eventsImported: 0,
    errors: [] as string[],
    warnings: [] as string[],
    projectMappings: [] as { legacyId: string; newId: string; title: string }[]
  };

  try {
    // Process each twin
    for (const twin of twins) {
      try {
        await importTwin(twin, report);
      } catch (error) {
        const errorMsg = `Failed to import twin "${twin.title || twin.id}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        report.errors.push(errorMsg);
        console.error('[Migration]', errorMsg);
      }
    }

    // Return detailed report
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
      note: 'localStorage data was NOT deleted. Mark migration as completed in frontend after verification.'
    });

  } catch (error) {
    console.error('[Migration] Fatal error:', error);
    return res.status(500).json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      partialReport: report
    });
  }
}

/**
 * Import a single twin with all related data
 */
async function importTwin(twin: LocalStorageTwin, report: any) {
  // Build project state from twin
  const state = {
    version: 1,
    currentPhase: twin.progress?.stage || 'created',
    percent: twin.progress?.percent || 10,
    level: twin.progress?.level || 1,
    lastProgressReason: twin.progress?.lastProgressReason || 'Imported from localStorage'
  };

  // Generate memory markdown
  const memoryMarkdown = generateMemoryMarkdown(twin);

  // Insert project
  const projects = await query(`
    INSERT INTO projects (
      legacy_twin_id,
      title,
      description,
      original_input,
      status,
      state,
      state_version,
      memory_markdown,
      analysis,
      created_at,
      updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
    )
    RETURNING id
  `, [
    twin.id,
    twin.title || 'Untitled Project',
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
  report.projectMappings.push({
    legacyId: twin.id,
    newId: projectId,
    title: twin.title || 'Untitled Project'
  });

  // Import measures
  if (twin.measures && Array.isArray(twin.measures)) {
    for (const measure of twin.measures) {
      try {
        await query(`
          INSERT INTO measures (
            project_id,
            legacy_measure_id,
            title,
            description,
            status,
            priority,
            due_date,
            owner,
            value_score,
            notes,
            source,
            created_at,
            completed_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          )
        `, [
          projectId,
          measure.id,
          measure.title || 'Untitled Measure',
          measure.description || '',
          measure.status || 'open',
          measure.priority || 'medium',
          measure.dueDate,
          measure.owner || null,
          measure.valueScore || null,
          measure.notes || '',
          measure.source || 'imported',
          measure.createdAt || new Date().toISOString(),
          measure.completedAt || null
        ]);
        report.measuresImported++;
      } catch (err) {
        report.warnings.push(`Failed to import measure "${measure.title}": ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }
  }

  // Import process steps
  if (twin.processSteps && Array.isArray(twin.processSteps)) {
    for (const step of twin.processSteps) {
      try {
        await query(`
          INSERT INTO process_steps (
            project_id,
            legacy_step_id,
            title,
            description,
            status,
            step_order,
            depends_on,
            linked_measure_ids,
            blocker_reason,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          )
        `, [
          projectId,
          step.id,
          step.title || 'Untitled Step',
          step.description || '',
          step.status || 'pending',
          step.order || 0,
          JSON.stringify(step.dependsOn || []),
          JSON.stringify(step.linkedMeasureIds || []),
          step.blockerReason || '',
          new Date().toISOString(),
          new Date().toISOString()
        ]);
        report.stepsImported++;
      } catch (err) {
        report.warnings.push(`Failed to import step "${step.title}": ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }
  }

  // Import events from activityLog
  if (twin.activityLog && Array.isArray(twin.activityLog)) {
    for (const log of twin.activityLog) {
      try {
        await query(`
          INSERT INTO project_events (
            project_id,
            event_type,
            actor,
            description,
            payload,
            previous_version,
            new_version,
            created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
          )
        `, [
          projectId,
          log.type || 'unknown',
          log.actor || 'system',
          log.description || '',
          log.details ? JSON.stringify(log.details) : null,
          null,
          1,
          log.timestamp || new Date().toISOString()
        ]);
        report.eventsImported++;
      } catch (err) {
        report.warnings.push(`Failed to import event: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }
  }

  // Add import_completed event
  await query(`
    INSERT INTO project_events (
      project_id,
      event_type,
      actor,
      description,
      new_version,
      created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6
    )
  `, [
    projectId,
    'import_completed',
    'system',
    `Project imported from localStorage (legacy ID: ${twin.id})`,
    1,
    new Date().toISOString()
  ]);
  report.eventsImported++;
}

/**
 * Generate markdown memory from twin data
 */
function generateMemoryMarkdown(twin: LocalStorageTwin): string {
  const lines = [
    `# Projekt: ${twin.title || 'Untitled'}`,
    '',
    `## Beschreibung`,
    twin.description || 'Keine Beschreibung verfügbar',
    '',
    `## Erstellt`,
    new Date(twin.createdAt).toLocaleString('de-DE'),
    '',
  ];

  if (twin.progress) {
    lines.push(
      `## Fortschritt`,
      `- Status: ${twin.progress.stage || 'unknown'}`,
      `- Prozent: ${twin.progress.percent || 0}%`,
      `- Level: ${twin.progress.level || 1}`,
      ''
    );
  }

  if (twin.measures && twin.measures.length > 0) {
    lines.push(`## Maßnahmen (${twin.measures.length})`);
    const byStatus = {
      open: twin.measures.filter((m: any) => m.status === 'open'),
      done: twin.measures.filter((m: any) => m.status === 'done'),
      other: twin.measures.filter((m: any) => !['open', 'done'].includes(m.status))
    };
    
    if (byStatus.open.length > 0) {
      lines.push(`### Offen (${byStatus.open.length})`);
      byStatus.open.forEach((m: any) => lines.push(`- ${m.title}`));
    }
    if (byStatus.done.length > 0) {
      lines.push(`### Erledigt (${byStatus.done.length})`);
      byStatus.done.forEach((m: any) => lines.push(`- [x] ${m.title}`));
    }
    lines.push('');
  }

  if (twin.processSteps && twin.processSteps.length > 0) {
    lines.push(
      `## Prozessschritte (${twin.processSteps.length})`,
      ...twin.processSteps.map((s: any) => `- ${s.title} [${s.status}]`),
      ''
    );
  }

  if (twin.contextQuestions && twin.contextQuestions.length > 0) {
    const open = twin.contextQuestions.filter((q: any) => q.status === 'open');
    if (open.length > 0) {
      lines.push(
        `## Offene Fragen (${open.length})`,
        ...open.map((q: any) => `- ${q.label}: ${q.question}`),
        ''
      );
    }
  }

  lines.push(
    `---`,
    `*Importiert aus localStorage*`,
    `*Legacy ID: ${twin.id}*`
  );

  return lines.join('\n');
}
