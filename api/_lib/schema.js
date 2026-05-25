/**
 * LoadPilot Database Schema - CommonJS
 */

const { sql, sqlUnpooled } = require('./db.js');

const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_twin_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    original_input TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    state JSONB DEFAULT '{}',
    state_version INTEGER DEFAULT 1,
    memory_markdown TEXT,
    analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS measures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    legacy_measure_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'open',
    priority VARCHAR(50) DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    owner VARCHAR(255),
    value_score INTEGER,
    strategic_goal TEXT,
    notes TEXT,
    source VARCHAR(100) DEFAULT 'manual',
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_measure_status CHECK (status IN ('idea', 'open', 'in_progress', 'waiting', 'blocked', 'done', 'discarded')),
    CONSTRAINT valid_measure_priority CHECK (priority IN ('critical', 'high', 'medium', 'low'))
);

CREATE TABLE IF NOT EXISTS process_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    legacy_step_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    step_order INTEGER NOT NULL,
    depends_on JSONB DEFAULT '[]',
    linked_measure_ids JSONB DEFAULT '[]',
    blocker_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_step_status CHECK (status IN ('done', 'active', 'blocked', 'next', 'pending', 'skipped'))
);

CREATE TABLE IF NOT EXISTS project_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    actor VARCHAR(100) NOT NULL,
    description TEXT,
    payload JSONB,
    previous_version INTEGER,
    new_version INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pending_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    title VARCHAR(255),
    description TEXT,
    payload JSONB,
    base_version INTEGER,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_pending_status CHECK (status IN ('pending', 'executing', 'completed', 'failed', 'rejected'))
);

CREATE TABLE IF NOT EXISTS openclaw_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    pending_action_id UUID REFERENCES pending_actions(id),
    job_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    user_input TEXT,
    requested_changes JSONB,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_job_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_projects_legacy ON projects(legacy_twin_id) WHERE legacy_twin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_measures_project ON measures(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_steps_project ON process_steps(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_project ON project_events(project_id, created_at DESC);
`;

async function ensureDatabaseSchema() {
  const client = sqlUnpooled || sql;
  
  if (!client) {
    return { success: false, error: 'Database not configured. DATABASE_URL is missing.' };
  }

  try {
    const statements = SCHEMA_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      try {
        await client([statement], []);
      } catch (err) {
        if (!err.message?.includes('already exists') && !err.message?.includes('duplicate')) {
          console.error('[Schema] Error:', err.message);
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

module.exports = { ensureDatabaseSchema, SCHEMA_SQL };
