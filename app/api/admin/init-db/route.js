import { NextResponse } from 'next/server';
import db from '@/utils/db';
import fs from 'fs';
import path from 'path';

// Helper function to initialize the database schema
async function initializeDatabase() {
  // First, enable the UUID extension
  await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  console.log('UUID extension enabled');
  
  // Read the schema file
  const schemaPath = path.join(process.cwd(), 'utils', 'database-schema.sql');
  let schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  
  // Remove the UUID extension line as we've already executed it
  schemaSQL = schemaSQL.replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";/g, '');
  
  // Split the schema into individual statements
  const statements = schemaSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
  
  // Execute each statement
  for (const statement of statements) {
    await db.query(statement + ';');
    console.log('Executed:', statement.substring(0, 50) + '...');
  }
  
  return {
    success: true,
    message: 'Database initialized successfully'
  };
}

// GET /api/admin/init-db - Initialize the database schema
export async function GET(request) {
  try {
    const result = await initializeDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/init-db - Initialize the database schema
export async function POST(request) {
  try {
    const result = await initializeDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error.message },
      { status: 500 }
    );
  }
}
