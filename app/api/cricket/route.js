import { NextResponse } from 'next/server';

/**
 * GET handler for fetching cricket match data
 * @param {Request} request - The incoming request object
 * @returns {Promise<NextResponse>} - The response with match data
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');
  
  if (!matchId) {
    return NextResponse.json(
      { success: false, error: 'Match ID is required' },
      { status: 400 }
    );
  }

  try {
    // The base URL would typically come from environment variables
    const baseUrl = process.env.CRICKET_API_URL || 'http://localhost:5000/api/cricbuzz';
    const response = await fetch(`${baseUrl}/matchData/${matchId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch cricket data: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching cricket match data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
