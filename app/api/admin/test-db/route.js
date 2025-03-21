import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET /api/admin/test-db - Test database connection
export async function GET() {
  try {
    // Test database connection
    const { rows } = await db.query('SELECT NOW() as time');
    
    // Log the connection information
    const { connectionString } = db.pool.options;
    
    // Mask password in the connection string for security
    const maskedConnection = connectionString?.replace(
      /\/\/([^:]+):([^@]+)@/,
      '//$1:****@'
    );
    
    // Get PostgreSQL version
    const versionResult = await db.query('SELECT version()');
    const version = versionResult.rows[0].version;
    
    // Check if uuid-ossp extension is enabled
    const extensionResult = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
      ) as enabled
    `);
    const uuidExtensionEnabled = extensionResult.rows[0].enabled;
    
    // Check if tables exist
    const tableChecks = await Promise.all([
      db.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'teams'
        ) as exists
      `),
      db.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'matches'
        ) as exists
      `),
      db.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'streams'
        ) as exists
      `),
      db.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'stream_analytics'
        ) as exists
      `)
    ]);
    
    return NextResponse.json({
      status: 'success',
      connection: {
        time: rows[0].time,
        connectionString: maskedConnection,
        postgresVersion: version
      },
      uuidExtension: {
        enabled: uuidExtensionEnabled
      },
      tables: {
        teams: tableChecks[0].rows[0].exists,
        matches: tableChecks[1].rows[0].exists,
        streams: tableChecks[2].rows[0].exists,
        stream_analytics: tableChecks[3].rows[0].exists
      }
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Database connection failed', 
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
