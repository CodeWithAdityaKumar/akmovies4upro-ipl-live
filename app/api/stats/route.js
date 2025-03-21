import { NextResponse } from 'next/server';
import db from '@/utils/db';

export async function GET() {
  try {
    // Get stats from the database in parallel
    const [liveMatchesResult, upcomingMatchesResult, teamsResult, viewersResult] = await Promise.all([
      // Count of live matches
      db.query('SELECT COUNT(*) as count FROM matches WHERE status = $1', ['live']),
      
      // Count of upcoming matches
      db.query('SELECT COUNT(*) as count FROM matches WHERE status = $1', ['scheduled']),
      
      // Count of teams
      db.query('SELECT COUNT(*) as count FROM teams'),
      
      // Sum of viewers from recent streams
      db.query(`
        SELECT SUM(viewer_count) as total 
        FROM stream_analytics 
        WHERE timestamp > NOW() - INTERVAL '24 hours'
      `)
    ]);

    // Format the stats response
    const stats = {
      activeMatches: parseInt(liveMatchesResult.rows[0]?.count || 0),
      upcomingMatches: parseInt(upcomingMatchesResult.rows[0]?.count || 0),
      totalTeams: parseInt(teamsResult.rows[0]?.count || 0),
      totalViewers: parseInt(viewersResult.rows[0]?.total || 0)
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch stats',
        details: error.message,
        code: error.code,
        hint: error.hint || 'Check database schema to ensure all columns exist'
      },
      { status: 500 }
    );
  }
}
