import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET /api/analytics/stream - Get stream analytics 
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const streamId = searchParams.get('stream_id');
    
    if (!streamId) {
      return NextResponse.json({ error: 'Stream ID is required' }, { status: 400 });
    }

    // Query PostgreSQL for the latest analytics record
    const queryText = `
      SELECT * FROM stream_analytics
      WHERE stream_id = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    
    const { rows, error } = await db.query(queryText, [streamId]);

    if (error) {
      console.error('Error fetching stream analytics:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no data, return default values
    if (rows.length === 0) {
      return NextResponse.json({ 
        stream_id: streamId,
        viewer_count: 0,
        peak_viewers: 0,
        average_watch_time: 0,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/analytics/stream - Update stream analytics
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

    // Calculate new values
    const newViewerCount = body.viewer_count !== undefined ? body.viewer_count : 
      (currentData ? currentData.viewer_count + 1 : 1);
    
    const newPeakViewers = currentData ? 
      Math.max(currentData.peak_viewers, newViewerCount) : 
      newViewerCount;

    // Insert new analytics record using PostgreSQL
    const insertQuery = `
      INSERT INTO stream_analytics (
        stream_id, viewer_count, peak_viewers, average_watch_time, timestamp
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const insertValues = [
      body.stream_id,
      newViewerCount,
      newPeakViewers,
      body.average_watch_time || (currentData ? currentData.average_watch_time : 0),
      new Date().toISOString()
    ];
    
    const { rows, error } = await db.query(insertQuery, insertValues);

    if (error) {
      console.error('Error updating stream analytics:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
