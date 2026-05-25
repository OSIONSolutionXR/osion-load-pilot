/**
 * LoadPilot Database Client - JavaScript
 * Neon Postgres - Serverless Connection
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_URL_UNPOOLED = process.env.DATABASE_URL_UNPOOLED;

if (!DATABASE_URL) {
  console.error('[DB] ERROR: DATABASE_URL is not set');
}

export const sql = DATABASE_URL ? neon(DATABASE_URL) : null;
export const sqlUnpooled = DATABASE_URL_UNPOOLED ? neon(DATABASE_URL_UNPOOLED) : null;

export async function query(queryStr, values) {
  if (!sql) {
    throw new Error('Database not configured. DATABASE_URL is missing.');
  }
  
  let finalQuery = queryStr;
  if (values && values.length > 0) {
    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      let escaped;
      
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
  
  return sql([finalQuery], []);
}

export async function checkConnection() {
  if (!sql) {
    return { connected: false, error: 'DATABASE_URL not configured' };
  }
  
  try {
    await sql`SELECT NOW() as now`;
    return { connected: true };
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
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
