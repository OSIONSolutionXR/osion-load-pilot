/**
 * LoadPilot Database Schema - JavaScript
 * Idempotent schema initialization for Neon Postgres
 */

import { sql, sqlUnpooled } from './db.js';

const SCHEMA_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROJECTS
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

CREATE INDEX IF NOT EXISTS idx_projects_legacy ON projects(legacy_twin_id) WHERE legacy_twin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC);

-- 2. MEASURES
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

CREATE INDEX IF NOT EXISTS idx_measures_project ON measures(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_measures_status ON measures(status);

-- 3. PROCESS_STEPS
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

CREATE INDEX IF NOT EXISTS idx_steps_project ON process_steps(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_steps_order ON process_steps(project_id, step_order);

-- 4. PROJECT_EVENTS
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

CREATE INDEX IF NOT EXISTS idx_events_project ON project_events(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON project_events(event_type);

-- 5. PENDING_ACTIONS
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

CREATE INDEX IF NOT EXISTS idx_pending_project ON pending_actions(project_id, status) WHERE status = 'pending';

-- 6. OPENCLAW_JOBS
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

CREATE INDEX IF NOT EXISTS idx_jobs_project ON openclaw_jobs(project_id, created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at') THEN
        CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_measures_updated_at') THEN
        CREATE TRIGGER update_measures_updated_at BEFORE UPDATE ON measures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_steps_updated_at') THEN
        CREATE TRIGGER update_steps_updated_at BEFORE UPDATE ON process_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
`;

export async function ensureDatabaseSchema() {
  const client = sqlUnpooled || sql;
  
  if (!client) {
    return { 
      success: false, 
      error: 'Database not configured. DATABASE_URL is missing.' 
    };
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
    console.error('[Schema] Failed:', message);
    return { success: false, error: message };
  }
}

export async function isSchemaInitialized() {
  if (!sql) return false;
  
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'projects'
      ) as exists
    `;
    return result[0]?.exists === true;
  } catch {
    return false;
  }
}
