import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET /api/teams - Get all teams
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || 100;

    // Query teams from PostgreSQL
    const queryText = `
      SELECT id, name, short_name, logo_url, created_at, updated_at
      FROM teams
      ORDER BY name
      LIMIT $1
    `;
    
    const { rows, error } = await db.query(queryText, [limit]);

    if (error) {
      console.error('Error fetching teams:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/teams - Create a new team (admin only)
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.short_name) {
      return NextResponse.json(
        { error: 'Team name and short name are required' }, 
        { status: 400 }
      );
    }

    // Insert new team into PostgreSQL
    const insertQuery = `
      INSERT INTO teams (name, short_name, logo_url)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const insertValues = [
      body.name,
      body.short_name,
      body.logo_url || null
    ];
    
    const { rows, error } = await db.query(insertQuery, insertValues);

    if (error) {
      console.error('Error creating team:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/teams/:id - Update a team (admin only)
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' }, 
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate that at least one field is provided
    if (!body.name && !body.short_name && !body.logo_url) {
      return NextResponse.json(
        { error: 'At least one field to update is required' }, 
        { status: 400 }
      );
    }

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const queryParams = [];
    let paramCounter = 1;
    
    if (body.name) {
      updateFields.push(`name = $${paramCounter++}`);
      queryParams.push(body.name);
    }
    
    if (body.short_name) {
      updateFields.push(`short_name = $${paramCounter++}`);
      queryParams.push(body.short_name);
    }
    
    if (body.logo_url !== undefined) {
      updateFields.push(`logo_url = $${paramCounter++}`);
      queryParams.push(body.logo_url);
    }
    
    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`);
    
    // Add id as the last parameter
    queryParams.push(id);
    
    const updateQuery = `
      UPDATE teams
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `;
    
    const { rows, error } = await db.query(updateQuery, queryParams);

    if (error) {
      console.error('Error updating team:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/teams/:id - Delete a team (admin only)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' }, 
        { status: 400 }
      );
    }

    // Check if team is referenced in matches
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM matches
      WHERE team1_id = $1 OR team2_id = $1
    `;
    
    const { rows: checkRows, error: checkError } = await db.query(checkQuery, [id]);

    if (checkError) {
      console.error('Error checking team references:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    // If team is referenced in matches, don't allow deletion
    if (checkRows[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete team that is referenced in matches' }, 
        { status: 409 }
      );
    }

    // Delete the team
    const deleteQuery = `
      DELETE FROM teams
      WHERE id = $1
      RETURNING *
    `;
    
    const { rows, error } = await db.query(deleteQuery, [id]);

    if (error) {
      console.error('Error deleting team:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
