"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, live, upcoming, completed

  // Fetch match data from our API endpoints
  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      
      try {
        // Fetch all matches from our API with a higher limit to get all the uploaded matches
        const response = await fetch('/api/matches?limit=100');
        
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        
        const matchesData = await response.json();
        
        if (matchesData && matchesData.length > 0) {
          // We have real data from the API
          console.log('Loaded', matchesData.length, 'matches from the database');
          setMatches(matchesData.map(match => ({
            ...match,
            // Make sure status field exists with proper value
            status: match.status || 'upcoming'
          })));
        } else {
          // No matches in database, use demo data for demonstration
          console.log('No matches found in database, using demo data');
          
          // Get any mock matches from localStorage for development
          const mockMatches = JSON.parse(localStorage.getItem('mockMatches') || '[]');
          
          // Demo data to show if no matches exist
          const demoMatches = [
          {
            id: '42',
            team1: {
              name: 'Mumbai Indians',
              short: 'MI',
              score: '167/5',
              overs: '18.2'
            },
            team2: {
              name: 'Chennai Super Kings',
              short: 'CSK',
              score: '143/8',
              overs: '20.0'
            },
            date: '2025-03-21T19:30:00',
            venue: 'Wankhede Stadium, Mumbai',
            status: 'live',
            streamUrl: 'https://res.cloudinary.com/dy1mqjddr/video/upload/sp_hd/v1741989910/cgds8tkp8cc0eu8gijpl.m3u8',
            viewers: 1200000
          },
          {
            id: '43',
            team1: {
              name: 'Delhi Capitals',
              short: 'DC',
              score: '156/3',
              overs: '16.0'
            },
            team2: {
              name: 'Rajasthan Royals',
              short: 'RR',
              score: '',
              overs: ''
            },
            date: '2025-03-21T15:30:00',
            venue: 'Arun Jaitley Stadium, Delhi',
            status: 'live',
            streamUrl: 'https://res.cloudinary.com/dy1mqjddr/video/upload/sp_hd/v1741989910/dcvsrr-stream.m3u8',
            viewers: 850000
          },
          {
            id: '44',
            team1: {
              name: 'Kolkata Knight Riders',
              short: 'KKR',
              score: '',
              overs: ''
            },
            team2: {
              name: 'Punjab Kings',
              short: 'PBKS',
              score: '',
              overs: ''
            },
            date: '2025-03-22T19:30:00',
            venue: 'Eden Gardens, Kolkata',
            status: 'upcoming',
            streamUrl: '',
            viewers: 0
          },
          {
            id: '45',
            team1: {
              name: 'Royal Challengers Bangalore',
              short: 'RCB',
              score: '',
              overs: ''
            },
            team2: {
              name: 'Sunrisers Hyderabad',
              short: 'SRH',
              score: '',
              overs: ''
            },
            date: '2025-03-23T15:30:00',
            venue: 'M. Chinnaswamy Stadium, Bengaluru',
            status: 'upcoming',
            streamUrl: '',
            viewers: 0
          },
          {
            id: '41',
            team1: {
              name: 'Gujarat Titans',
              short: 'GT',
              score: '183/6',
              overs: '20.0'
            },
            team2: {
              name: 'Lucknow Super Giants',
              short: 'LSG',
              score: '182/8',
              overs: '20.0'
            },
            date: '2025-03-20T19:30:00',
            venue: 'Narendra Modi Stadium, Ahmedabad',
            status: 'completed',
            result: 'Gujarat Titans won by 1 run',
            highlights: 'https://res.cloudinary.com/dy1mqjddr/video/upload/v1741989910/highlights-gt-lsg.mp4',
            viewers: 950000
          }
        ];
        
        // Combine any mock matches with demo data
        const allMatches = [...mockMatches, ...demoMatches];
        
        // Update matches state
        setMatches(allMatches);
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
        
        // Fallback to an empty array if all else fails
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMatches();
  }, []);

  // Filter matches based on selected filter
  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    if (filter === 'live') return match.status === 'live';
    if (filter === 'upcoming') return match.status === 'upcoming';
    if (filter === 'completed') return match.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Matches</h1>
        <Link 
          href="/admin/matches/add"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Add New Match
        </Link>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 bg-gray-800 p-2 rounded-lg">
        <FilterButton 
          label="All" 
          active={filter === 'all'} 
          onClick={() => setFilter('all')}
        />
        <FilterButton 
          label="Live" 
          active={filter === 'live'} 
          onClick={() => setFilter('live')}
        />
        <FilterButton 
          label="Upcoming" 
          active={filter === 'upcoming'} 
          onClick={() => setFilter('upcoming')}
        />
        <FilterButton 
          label="Completed" 
          active={filter === 'completed'} 
          onClick={() => setFilter('completed')}
        />
      </div>

      {/* Matches List */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-400">Loading matches...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">No matches found for the selected filter.</p>
            </div>
          ) : (
            filteredMatches.map(match => (
              <MatchCard 
                key={match.id} 
                match={match} 
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function FilterButton({ label, active, onClick }) {
  return (
    <button
      className={`px-4 py-2 rounded ${
        active 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function MatchCard({ match }) {
  // Handle both match.date and match.match_date formats
  const matchDate = new Date(match.match_date || match.date);
  
  // Format date as dd/mm/yyyy as requested
  const day = matchDate.getDate().toString().padStart(2, '0');
  const month = (matchDate.getMonth() + 1).toString().padStart(2, '0');
  const year = matchDate.getFullYear();
  const time = matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  // Create formatted date string
  const dateDisplay = `${day}/${month}/${year}, ${time}`;

  // Extract team data from the API response structure
  const team1 = {
    name: match.team1?.name || match.team1_name,
    short: match.team1?.short_name || (match.team1 && match.team1.short) || '',
    score: match.team1_score || (match.team1 && match.team1.score) || '',
    overs: match.team1_overs || (match.team1 && match.team1.overs) || '',
    logo_url: match.team1?.logo_url || (match.team1 && match.team1.logo) || ''
  };

  const team2 = {
    name: match.team2?.name || match.team2_name,
    short: match.team2?.short_name || (match.team2 && match.team2.short) || '',
    score: match.team2_score || (match.team2 && match.team2.score) || '',
    overs: match.team2_overs || (match.team2 && match.team2.overs) || '',
    logo_url: match.team2?.logo_url || (match.team2 && match.team2.logo) || ''
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            {match.status === 'live' && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full mr-2">
                LIVE
              </span>
            )}
            {match.status === 'upcoming' && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full mr-2">
                UPCOMING
              </span>
            )}
            <span className="text-gray-400 text-sm">{dateDisplay}</span>
          </div>
          <div className="text-gray-400 text-sm">{match.venue}</div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mr-2 overflow-hidden">
                {team1.logo_url ? (
                  <img src={team1.logo_url} alt={team1.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-900 flex items-center justify-center">
                    <span className="font-bold">{team1.short}</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-white">{team1.name}</h3>
                {team1.score && (
                  <p className="text-white text-sm">{team1.score} ({team1.overs} ov)</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mx-4 text-gray-500">VS</div>
          
          <div className="flex-1 text-right">
            <div className="flex items-center justify-end">
              <div>
                <h3 className="font-bold text-white">{team2.name}</h3>
                {team2.score && (
                  <p className="text-white text-sm">{team2.score} ({team2.overs} ov)</p>
                )}
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center ml-2 overflow-hidden">
                {team2.logo_url ? (
                  <img src={team2.logo_url} alt={team2.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-yellow-900 flex items-center justify-center">
                    <span className="font-bold">{team2.short}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {match.status === 'completed' && match.result && (
          <div className="mt-3 text-center text-sm font-medium text-gray-300">
            {match.result}
          </div>
        )}
      </div>
      
      <div className="bg-gray-700 px-4 py-3 flex flex-wrap gap-2 justify-between items-center">
        <div>
          {match.status === 'live' && (
            <span className="text-sm text-gray-300">
              <span className="text-green-400">●</span> {formatNumber(match.viewers || 0)} viewers
            </span>
          )}
          {match.status === 'completed' && match.highlights_url && (
            <Link
              href={`/match/${match.id}/highlights`}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Watch Highlights
            </Link>
          )}
        </div>
        
        <div className="flex gap-2">
          <Link
            href={`/admin/matches/edit/${match.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          >
            Edit
          </Link>
          
          {match.status === 'live' && (
            <Link
              href={`/admin/streams/manage?match=${match.id}`}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
            >
              Manage Stream
            </Link>
          )}
          
          {match.status === 'upcoming' && (
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
              onClick={() => alert('This would set up the stream for this match')}
            >
              Set Up Stream
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to format numbers
function formatNumber(num) {
  // Handle undefined, null or non-numeric values
  if (num === undefined || num === null) {
    return '0';
  }
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
