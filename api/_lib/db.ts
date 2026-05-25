/**
 * LoadPilot Database Client
 * Neon Postgres - Serverless Connection
 * 
 * Environment: DATABASE_URL (pooled), DATABASE_URL_UNPOOLED (migrations)
 */

import { neon } from '@neondatabase/serverless';

// Ensure we have the database URL
const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_URL_UNPOOLED = process.env.DATABASE_URL_UNPOOLED;

if (!DATABASE_URL) {
  console.error('[DB] ERROR: DATABASE_URL is not set in environment variables');
}

// Serverless SQL client (for API routes)
export const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

// Unpooled client for migrations/schema operations
export const sqlUnpooled = DATABASE_URL_UNPOOLED ? neon(DATABASE_URL_UNPOOLED) : null;

// Query helper that constructs proper template literals
export async function query<T = any>(queryStr: string, values?: any[]): Promise<T[]> {
  if (!sql) {
    throw new Error('Database not configured. DATABASE_URL is missing.');
  }
  
  // For parameterized queries, replace placeholders with escaped values
  let finalQuery = queryStr;
  if (values && values.length > 0) {
    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      let escaped: string;
      
      if (val === null || val === undefined) {
        escaped = 'NULL';
      } else if (typeof val === 'string') {
        escaped = `'${val.replace(/'/g, "''")}'`;
      } else if (typeof val === 'object') {
        escaped = `'${JSON.stringify(val).replace(/'/g, "''")}'`;
      } else {
        escaped = String(val);
      }
      
      finalQuery = finalQuery.replace(`$${i + 1}`, escaped);
    }
  }
  
  // Use template literal syntax
  return sql([finalQuery] as unknown as TemplateStringsArray, ...[]);
}

// Connection check
export async function checkConnection(): Promise<{ connected: boolean; error?: string }> {
  if (!sql) {
    return { connected: false, error: 'DATABASE_URL not configured' };
  }
  
  try {
    const result = await sql`SELECT NOW() as now`;
    return { connected: true };
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

// Check if schema is initialized
export async function isSchemaInitialized(): Promise<boolean> {
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
