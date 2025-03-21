import { NextResponse } from 'next/server';
import db from '@/utils/db';
import crypto from 'crypto';

// POST /api/auth/login - Admin login endpoint
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' }, 
        { status: 400 }
      );
    }

    // Sign in with PostgreSQL DB
    // In a real implementation, you should use proper password hashing like bcrypt
    // This is a simplified version for demonstration purposes
    const passwordHash = crypto
      .createHash('sha256')
      .update(body.password)
      .digest('hex');
      
    const loginQuery = `
      SELECT id, email, role 
      FROM admin_users 
      WHERE email = $1 AND password_hash = $2
    `;
    
    const { rows, error } = await db.query(loginQuery, [body.email, passwordHash]);
    
    if (error || rows.length === 0) {
      console.error('Login error:', error || 'Invalid credentials');
      return NextResponse.json(
        { error: 'Invalid credentials' }, 
        { status: 401 }
      );
    }
    
    const user = rows[0];

    // Check if user has admin role
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized access' }, 
        { status: 403 }
      );
    }
    
    // Create a session token (in a real app, use JWT or another secure method)
    const sessionToken = crypto
      .randomBytes(64)
      .toString('hex');
    
    // Store session in database
    const sessionInsertQuery = `
      INSERT INTO admin_sessions (user_id, token, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '24 hours')
      RETURNING id, token, expires_at
    `;
    
    const { rows: sessionRows, error: sessionError } = await db.query(
      sessionInsertQuery, 
      [user.id, sessionToken]
    );
    
    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' }, 
        { status: 500 }
      );
    }
    
    const session = sessionRows[0];

    // Return user and session data
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      session: {
        token: session.token,
        expires_at: session.expires_at
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
