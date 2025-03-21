const { Pool } = require('pg');

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://neondb_owner:npg_bPR9awDF7BJn@ep-blue-field-a1bg96jj-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Helper function to run SQL queries
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return { rows: result.rows, rowCount: result.rowCount };
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
}

// Get a single database client from the pool
// Use this for transactions
async function getClient() {
  const client = await pool.connect();
  const release = client.release;
  
  // Override client release to log duration
  client.release = () => {
    release.call(client);
    console.log('Client released');
  };
  
  return client;
}

module.exports = {
  query,
  getClient,
  pool
};
