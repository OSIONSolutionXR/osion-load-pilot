/**
 * LoadPilot Database Client - CommonJS
 */

const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_URL_UNPOOLED = process.env.DATABASE_URL_UNPOOLED;

if (!DATABASE_URL) {
  console.error('[DB] ERROR: DATABASE_URL is not set');
}

const sql = DATABASE_URL ? neon(DATABASE_URL) : null;
const sqlUnpooled = DATABASE_URL_UNPOOLED ? neon(DATABASE_URL_UNPOOLED) : null;

async function query(queryStr, values) {
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

module.exports = { sql, sqlUnpooled, query };
