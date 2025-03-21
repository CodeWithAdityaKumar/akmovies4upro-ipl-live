import { NextResponse } from 'next/server';
import db from '@/utils/db';

export async function GET() {
  try {
    // Fetch live matches with team information
    const { rows } = await db.query(`
      SELECT 
        m.id,
        m.match_date,
        m.status,
        m.venue,
        m.team1_id,
        m.team2_id,
        m.team1_score,
        m.team1_overs,
        m.team2_score,
        m.team2_overs,
        m.result,
        t1.name as team1_name,
        t1.short_name as team1_short_name,
        t2.name as team2_name,
        t2.short_name as team2_short_name
      FROM matches m
      JOIN teams t1 ON m.team1_id = t1.id
      JOIN teams t2 ON m.team2_id = t2.id
      WHERE m.status = 'live'
      ORDER BY m.match_date DESC
    `);

    // Format the response to match the expected structure
    const formattedMatches = rows.map(match => ({
      id: match.id,
      match_date: match.match_date,
      status: match.status,
      // Use status as status_text since that column doesn't exist
      status_text: match.status === 'live' ? 'Live' : match.status,
      venue: match.venue,
      team1_id: match.team1_id,
      team2_id: match.team2_id,
      team1_score: match.team1_score,
      team1_overs: match.team1_overs,
      team2_score: match.team2_score,
      team2_overs: match.team2_overs,
      result: match.result,
      team1: {
        id: match.team1_id,
        name: match.team1_name,
        short_name: match.team1_short_name
      },
      team2: {
        id: match.team2_id,
        name: match.team2_name,
        short_name: match.team2_short_name
      },
      viewer_count: 0 // Will be populated in a separate request
    }));

    // Get viewers for each match
    if (formattedMatches.length > 0) {
      for (const match of formattedMatches) {
        try {
          // Get the latest stream for this match
          const streamResult = await db.query(`
            SELECT id FROM streams
            WHERE match_id = $1 AND status = 'live'
            ORDER BY start_time DESC
            LIMIT 1
          `, [match.id]);

          if (streamResult.rows.length > 0) {
            // Get the viewer count for this stream
            const analyticsResult = await db.query(`
              SELECT viewer_count FROM stream_analytics
              WHERE stream_id = $1
              ORDER BY timestamp DESC
              LIMIT 1
            `, [streamResult.rows[0].id]);

            if (analyticsResult.rows.length > 0) {
              match.viewer_count = analyticsResult.rows[0].viewer_count;
            }
          }
        } catch (error) {
          console.error(`Error fetching viewer data for match ${match.id}:`, error);
          // Continue with next match even if we couldn't get viewer data for this one
        }
      }
    }

    return NextResponse.json(formattedMatches);
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch live matches', 
        details: error.message,
        code: error.code,
        hint: error.hint || 'Check database schema to ensure all columns exist'
      },
      { status: 500 }
    );
  }
}
