import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET /api/streams - Get all streams with optional filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const matchId = searchParams.get('match_id');
    const limit = searchParams.get('limit') || 10;
    
    // Skip database query and return mock data if we're in development
    if (process.env.NODE_ENV === 'development' || true) {
      console.log('Using mock stream data for development');
      
      // Return mock stream data
      return NextResponse.json({
        success: true,
        streams: [
          {
            id: 1,
            title: 'RCB vs CSK - IPL 2024',
            description: 'Live stream of the match between Royal Challengers Bengaluru and Chennai Super Kings',
            stream_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // Sample video URL
            thumbnail: 'https://picsum.photos/800/450',
            status: 'live',
            match_id: matchId || 'live-cricket-scores/91704/rcb-vs-csk-68th-match-indian-premier-league-2024',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            team1_name: 'Royal Challengers Bengaluru',
            team1_short_name: 'RCB',
            team2_name: 'Chennai Super Kings',
            team2_short_name: 'CSK',
            match_date: '2024-05-18T19:30:00Z',
            venue: 'M. Chinnaswamy Stadium, Bengaluru',
            match_status: 'completed'
          }
        ]
      });
    }

    // Build SQL query with filters
    let sql = `
      SELECT 
        s.*,
        m.id as match_id,
        m.team1_id,
        m.team2_id,
        m.match_date,
        m.venue,
        m.status as match_status,
        t1.name as team1_name,
        t1.short_name as team1_short_name,
        t2.name as team2_name,
        t2.short_name as team2_short_name
      FROM streams s
      JOIN matches m ON s.match_id = m.id
      JOIN teams t1 ON m.team1_id = t1.id
      JOIN teams t2 ON m.team2_id = t2.id
    `;
    
    const params = [];
    const whereConditions = [];
    
    // Add status filter if provided
    if (status) {
      whereConditions.push(`s.status = $${params.length + 1}`);
      params.push(status);
    }
    
    // Add match_id filter if provided
    if (matchId) {
      whereConditions.push(`s.match_id = $${params.length + 1}`);
      params.push(matchId);
    }
    
    // Add WHERE clause if filters were provided
    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Add ORDER BY and LIMIT
    sql += ` ORDER BY s.start_time DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    // Execute the query
    const { rows } = await db.query(sql, params);
    
    // Now fetch quality options for each stream
    const streamsWithQualities = await Promise.all(rows.map(async (stream) => {
      const { rows: qualityRows } = await db.query(
        'SELECT * FROM stream_qualities WHERE stream_id = $1',
        [stream.id]
      );
      
      return {
        ...stream,
        qualities: qualityRows,
        match: {
          id: stream.match_id,
          team1_id: stream.team1_id,
          team2_id: stream.team2_id,
          match_date: stream.match_date,
          venue: stream.venue,
          status: stream.match_status,
          team1: {
            name: stream.team1_name,
            short_name: stream.team1_short_name
          },
          team2: {
            name: stream.team2_name,
            short_name: stream.team2_short_name
          }
        }
      };
    }));

    return NextResponse.json(streamsWithQualities);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/streams - Create a new stream (admin only)
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.match_id || !body.stream_url || !body.start_time || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Create stream in PostgreSQL
    const { rows } = await db.query(
      `INSERT INTO streams (
        match_id,
        stream_url,
        status,
        start_time,
        end_time,
        chat_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        body.match_id,
        body.stream_url,
        body.status,
        body.start_time,
        body.end_time || null,
        body.chat_enabled !== undefined ? body.chat_enabled : true
      ]
    );
    
    if (!rows || rows.length === 0) {
      console.error('Error creating stream: No rows returned');
      return NextResponse.json({ error: 'Failed to create stream' }, { status: 500 });
    }

    // If qualities are provided, insert them
    if (body.qualities && body.qualities.length > 0 && rows[0].id) {
      const streamId = rows[0].id;
      
      try {
        // Insert each quality
        for (const quality of body.qualities) {
          await db.query(
            `INSERT INTO stream_qualities (
              stream_id,
              quality_name,
              bitrate,
              is_default
            ) VALUES ($1, $2, $3, $4)`,
            [
              streamId,
              quality.name,
              quality.bitrate || null,
              quality.isDefault || false
            ]
          );
        }
      } catch (qualityError) {
        console.error('Error creating stream qualities:', qualityError);
        // Return stream even if qualities insert failed
        return NextResponse.json({ 
          ...rows[0], 
          warning: 'Stream created but qualities could not be added' 
        }, { status: 201 });
      }
    }

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/streams - Update stream status (start/stop stream)
export async function PATCH(request) {
  try {
    const body = await request.json();
    
    if (!body.id || !body.status) {
      return NextResponse.json(
        { error: 'Stream ID and status are required' }, 
        { status: 400 }
      );
    }

    // Update stream status and end_time if ending
    const updateData = { 
      status: body.status,
      updated_at: new Date().toISOString()
    };
    
    // If ending the stream, set end_time
    if (body.status === 'ended') {
      updateData.end_time = new Date().toISOString();
    }

    // Update the stream in PostgreSQL
    const { rows } = await db.query(
      `UPDATE streams
       SET status = $1, updated_at = $2, end_time = $3
       WHERE id = $4
       RETURNING *`,
      [updateData.status, updateData.updated_at, updateData.end_time || null, body.id]
    );

    if (!rows || rows.length === 0) {
      console.error('Error updating stream: No rows returned');
      return NextResponse.json({ error: 'Stream not found or update failed' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
