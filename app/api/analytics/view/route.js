import { NextResponse } from 'next/server';
import db from '@/utils/db';

// POST /api/analytics/view - Record a stream view
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.stream_id) {
      return NextResponse.json({ error: 'Stream ID is required' }, { status: 400 });
    }

    // Get current analytics from PostgreSQL
    const fetchQuery = `
      SELECT * FROM stream_analytics
      WHERE stream_id = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    
    const { rows: currentDataRows, error: fetchError } = await db.query(fetchQuery, [body.stream_id]);
    const currentData = currentDataRows.length > 0 ? currentDataRows[0] : null;

    // Calculate new viewer count
    const newViewerCount = currentData ? currentData.viewer_count + 1 : 1;
    const newPeakViewers = currentData ? Math.max(currentData.peak_viewers, newViewerCount) : newViewerCount;

    // Upsert new analytics record using PostgreSQL
    // With PostgreSQL, we'll use INSERT ... ON CONFLICT
    const upsertQuery = `
      INSERT INTO stream_analytics (
        stream_id, viewer_count, peak_viewers, timestamp
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (stream_id) DO UPDATE SET
        viewer_count = $2,
        peak_viewers = $3,
        timestamp = $4
      RETURNING *
    `;
    
    const upsertValues = [
      body.stream_id,
      newViewerCount,
      newPeakViewers,
      new Date().toISOString()
    ];
    
    const { rows, error } = await db.query(upsertQuery, upsertValues);

    if (error) {
      console.error('Error recording view:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, viewer_count: newViewerCount }, { status: 200 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
