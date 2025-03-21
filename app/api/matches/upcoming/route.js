import { NextResponse } from 'next/server';
import db from '@/utils/db';

export async function GET() {
  try {
    // Fetch upcoming matches with team information
    const { rows } = await db.query(`
      SELECT 
        m.id,
        m.match_date,
        m.status,
        m.venue,
        m.team1_id,
        m.team2_id,
        t1.name as team1_name,
        t1.short_name as team1_short_name,
        t2.name as team2_name,
        t2.short_name as team2_short_name
      FROM matches m
      JOIN teams t1 ON m.team1_id = t1.id
      JOIN teams t2 ON m.team2_id = t2.id
      WHERE m.status = 'scheduled'
      ORDER BY m.match_date ASC
      LIMIT 6
    `);

    // Format the response to match the expected structure
    const formattedMatches = rows.map(match => ({
      id: match.id,
      match_date: match.match_date,
      status: match.status,
      venue: match.venue,
      team1_id: match.team1_id,
      team2_id: match.team2_id,
      team1: {
        id: match.team1_id,
        name: match.team1_name,
        short_name: match.team1_short_name
      },
      team2: {
        id: match.team2_id,
        name: match.team2_name,
        short_name: match.team2_short_name
      }
    }));

    return NextResponse.json(formattedMatches);
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch upcoming matches',
        details: error.message,
        code: error.code,
        hint: error.hint || 'Check database schema to ensure all columns exist'
      },
      { status: 500 }
    );
  }
}
