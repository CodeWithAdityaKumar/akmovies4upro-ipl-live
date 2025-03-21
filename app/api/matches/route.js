import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET /api/matches - Get all matches with optional filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build the SQL query with joins to get team information
    let sql = `
      SELECT 
        m.*,
        t1.id as team1_id,
        t1.name as team1_name,
        t1.short_name as team1_short_name,
        t1.logo_url as team1_logo,
        t2.id as team2_id,
        t2.name as team2_name,
        t2.short_name as team2_short_name,
        t2.logo_url as team2_logo
      FROM matches m
      JOIN teams t1 ON m.team1_id = t1.id
      JOIN teams t2 ON m.team2_id = t2.id
    `;
    
    const params = [];
    
    // Add WHERE clause for status if provided
    if (status) {
      sql += ' WHERE m.status = $1';
      params.push(status);
    }
    
    // Add ORDER BY and LIMIT
    sql += ' ORDER BY m.match_date ASC';
    sql += ` LIMIT $${params.length + 1}`;
    params.push(limit);
    
    // Execute the query
    const { rows } = await db.query(sql, params);
    
    // Format the response to match the expected structure
    const formattedMatches = rows.map(match => ({
      id: match.id,
      match_date: match.match_date,
      venue: match.venue,
      status: match.status,
      // Create status_text from status since it doesn't exist in DB
      status_text: match.status === 'live' ? 'Live' : 
                  match.status === 'upcoming' ? 'Upcoming' : 
                  match.status === 'completed' ? 'Completed' : match.status,
      result: match.result,
      team1_score: match.team1_score,
      team1_overs: match.team1_overs,
      team2_score: match.team2_score,
      team2_overs: match.team2_overs,
      highlights_url: match.highlights_url,
      thumbnail_url: match.thumbnail_url,
      team1: {
        id: match.team1_id,
        name: match.team1_name,
        short_name: match.team1_short_name,
        logo_url: match.team1_logo
      },
      team2: {
        id: match.team2_id,
        name: match.team2_name,
        short_name: match.team2_short_name,
        logo_url: match.team2_logo
      }
    }));

    return NextResponse.json(formattedMatches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/matches - Create a new match (admin only)
export async function POST(request) {
  try {
    const body = await request.json();
    let team1_id = body.team1_id;
    let team2_id = body.team2_id;
    
    // If short names are provided instead of IDs, look up the team IDs
    if (body.team1_short_name && !team1_id) {
      const { rows: team1Rows } = await db.query(
        'SELECT id FROM teams WHERE short_name = $1',
        [body.team1_short_name]
      );
      if (team1Rows.length === 0) {
        return NextResponse.json(
          { error: `Team with short name ${body.team1_short_name} not found` },
          { status: 404 }
        );
      }
      team1_id = team1Rows[0].id;
    }
    
    if (body.team2_short_name && !team2_id) {
      const { rows: team2Rows } = await db.query(
        'SELECT id FROM teams WHERE short_name = $1',
        [body.team2_short_name]
      );
      if (team2Rows.length === 0) {
        return NextResponse.json(
          { error: `Team with short name ${body.team2_short_name} not found` },
          { status: 404 }
        );
      }
      team2_id = team2Rows[0].id;
    }
    
    // Validate required fields
    if (!team1_id || !team2_id || !body.match_date || !body.venue || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Insert the new match into PostgreSQL
    const { rows } = await db.query(
      `INSERT INTO matches (
        team1_id, 
        team2_id, 
        match_date, 
        venue, 
        status, 
        result, 
        team1_score, 
        team1_overs, 
        team2_score, 
        team2_overs, 
        highlights_url, 
        thumbnail_url, 
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING 
        id, 
        team1_id, 
        team2_id, 
        match_date, 
        venue, 
        status, 
        result, 
        team1_score, 
        team1_overs, 
        team2_score, 
        team2_overs, 
        highlights_url, 
        thumbnail_url
      `,
      [
        team1_id,
        team2_id,
        body.match_date,
        body.venue,
        body.status,
        body.result || null,
        body.team1_score || null,
        body.team1_overs || null,
        body.team2_score || null,
        body.team2_overs || null,
        body.highlights_url || null,
        body.thumbnail_url || null
      ]
    );
    
    // If we need to return the full match with team information
    const newMatch = rows[0];
    
    // Get team information for the new match
    const teamResult = await db.query(
      `SELECT 
        t1.id as team1_id, t1.name as team1_name, t1.short_name as team1_short_name, t1.logo_url as team1_logo,
        t2.id as team2_id, t2.name as team2_name, t2.short_name as team2_short_name, t2.logo_url as team2_logo
      FROM teams t1, teams t2 
      WHERE t1.id = $1 AND t2.id = $2`,
      [newMatch.team1_id, newMatch.team2_id]
    );
    
    const teamInfo = teamResult.rows[0];
    
    // Format the response to include team information
    const matchWithTeams = {
      ...newMatch,
      team1: {
        id: teamInfo.team1_id,
        name: teamInfo.team1_name,
        short_name: teamInfo.team1_short_name,
        logo_url: teamInfo.team1_logo
      },
      team2: {
        id: teamInfo.team2_id,
        name: teamInfo.team2_name,
        short_name: teamInfo.team2_short_name,
        logo_url: teamInfo.team2_logo
      }
    };

    return NextResponse.json(matchWithTeams, { status: 201 });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/matches/:id - Delete a match (admin only)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }
    
    // Delete the match
    await db.query('DELETE FROM matches WHERE id = $1', [id]);
    
    return NextResponse.json({ success: true, message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/matches/:id - Update a match (admin only)
export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }
    
    // Build the update SQL dynamically
    const allowedFields = [
      'team1_id', 'team2_id', 'match_date', 'venue', 'status', 'result',
      'team1_score', 'team1_overs', 'team2_score', 'team2_overs',
      'highlights_url', 'thumbnail_url', 'status_text'
    ];
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    // Add each field that's present in the request body
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }
    
    // Add updated_at timestamp
    updates.push(`updated_at = NOW()`);
    
    // If no fields to update, return error
    if (updates.length === 1) { // Only updated_at
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    
    // Add the ID as the last parameter
    values.push(id);
    
    // Execute the update
    const { rows } = await db.query(
      `UPDATE matches SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    // Get updated match with team information
    const updatedMatch = rows[0];
    
    // Get team information for the updated match
    const teamResult = await db.query(
      `SELECT 
        t1.id as team1_id, t1.name as team1_name, t1.short_name as team1_short_name, t1.logo_url as team1_logo,
        t2.id as team2_id, t2.name as team2_name, t2.short_name as team2_short_name, t2.logo_url as team2_logo
      FROM teams t1, teams t2 
      WHERE t1.id = $1 AND t2.id = $2`,
      [updatedMatch.team1_id, updatedMatch.team2_id]
    );
    
    const teamInfo = teamResult.rows[0];
    
    // Format the response to include team information
    const matchWithTeams = {
      ...updatedMatch,
      team1: {
        id: teamInfo.team1_id,
        name: teamInfo.team1_name,
        short_name: teamInfo.team1_short_name,
        logo_url: teamInfo.team1_logo
      },
      team2: {
        id: teamInfo.team2_id,
        name: teamInfo.team2_name,
        short_name: teamInfo.team2_short_name,
        logo_url: teamInfo.team2_logo
      }
    };
    
    return NextResponse.json(matchWithTeams);
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
