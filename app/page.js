"use client";

import { useState, useEffect } from "react";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MatchCard from "./components/MatchCard";
import Link from "next/link";

console.log('MatchCard imported:', typeof MatchCard);

// Sample fallback data for when API calls fail
const sampleMatches = [
  {
    id: 43,
    match_number: 43,
    team1_id: 3,
    team1_name: "Royal Challengers Bangalore",
    team1_short_name: "RCB",
    team2_id: 7,
    team2_name: "Rajasthan Royals",
    team2_short_name: "RR",
    venue: "M. Chinnaswamy Stadium, Bengaluru",
    match_date: "2025-03-23",
    match_time: "19:30:00",
    status: "upcoming",
    match_date: "2025-03-23",
    match_time: "19:30:00",
    status: "upcoming"
  },
  {
    id: 44,
    match_number: 44,
    team1_id: 5,
    team1_name: "Delhi Capitals",
    team1_short_name: "DC",
    team2_id: 4,
    team2_name: "Kolkata Knight Riders",
    team2_short_name: "KKR",
    venue: "Arun Jaitley Stadium, Delhi",
    match_date: "2025-03-24",
    match_time: "15:30:00",
    status: "upcoming"
  },
  {
    id: 45,
    match_number: 45,
    team1_id: 9,
    team1_name: "Gujarat Titans",
    team1_short_name: "GT",
    team2_id: 10,
    team2_name: "Lucknow Super Giants",
    team2_short_name: "LSG",
    venue: "Narendra Modi Stadium, Ahmedabad",
    match_date: "2025-03-24",
    match_time: "19:30:00",
    status: "upcoming"
  },
  {
    id: 42,
    match_number: 42,
    team1_id: 2,
    team1_name: "Mumbai Indians",
    team1_short_name: "MI",
    team2_id: 1,
    team2_name: "Chennai Super Kings",
    team2_short_name: "CSK",
    venue: "Wankhede Stadium, Mumbai",
    match_date: "2025-03-22",
    match_time: "19:30:00",
    status: "live"
  }
];

const sampleTeams = [
  { id: 1, name: "Chennai Super Kings", short_name: "CSK", logo_url: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/CSK/logos/Roundbig/CSKroundbig.png" },
  { id: 2, name: "Mumbai Indians", short_name: "MI", logo_url: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/MI/logos/Roundbig/MIroundbig.png" },
  { id: 3, name: "Royal Challengers Bangalore", short_name: "RCB", logo_url: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RCB/logos/Roundbig/RCBroundbig.png" },
  { id: 4, name: "Kolkata Knight Riders", short_name: "KKR", logo_url: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/KKR/logos/Roundbig/KKRroundbig.png" },
  { id: 5, name: "Delhi Capitals", short_name: "DC", logo_url: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/DC/logos/Roundbig/DCroundbig.png" },
  { id: 6, name: "Punjab Kings", short_name: "PBKS", logo_url: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/PBKS/logos/Roundbig/PBKSroundbig.png" },
  { id: 7, name: "Rajasthan Royals", short_name: "RR", logo_url: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RR/logos/Roundbig/RRroundbig.png" },
  { id: 8, name: "Sunrisers Hyderabad", short_name: "SRH", logo_url: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/SRH/logos/Roundbig/SRHroundbig.png" },
  { id: 9, name: "Gujarat Titans", short_name: "GT", logo_url: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/GT/logos/Roundbig/GTroundbig.png" },
  { id: 10, name: "Lucknow Super Giants", short_name: "LSG", logo_url: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/LSG/logos/Roundbig/LSGroundbig.png" }
];

// Team color mappings for styling
const teamColors = {
  CSK: "bg-yellow-500",
  MI: "bg-blue-600",
  RCB: "bg-red-600",
  KKR: "bg-purple-700",
  DC: "bg-blue-500",
  RR: "bg-pink-500",
  SRH: "bg-orange-500",
  PBKS: "bg-red-600",
  GT: "bg-blue-800",
  LSG: "bg-teal-500"
};

export default function Home() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [matchesError, setMatchesError] = useState(null);
  const [teamsError, setTeamsError] = useState(null);
  
  // Format date to human-readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString; // Return original if parsing fails
    }
  };
  
  // Format time to 12-hour format
  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const hourNum = parseInt(hours, 10);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const formattedHours = hourNum % 12 || 12;
      return `${formattedHours}:${minutes} ${ampm} IST`;
    } catch (error) {
      console.error('Error formatting time:', timeString, error);
      return timeString; // Return original if parsing fails
    }
  };
  
  // Fetch upcoming matches
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoadingMatches(true);
        console.log('Fetching matches data...');
        
        // The status parameter should be 'live,upcoming' without spaces
        // Using separate calls to handle multiple statuses
        const response = await fetch('/api/matches?limit=4&status=live');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API response error:', response.status, errorData);
          throw new Error(`Failed to fetch matches: ${response.status} ${errorData.error || ''}`);
        }
        
        const liveData = await response.json();
        console.log('Live matches fetched:', liveData);
        
        // Get upcoming matches
        const upcomingResponse = await fetch('/api/matches?limit=4&status=upcoming');
        
        if (!upcomingResponse.ok) {
          const errorData = await upcomingResponse.json().catch(() => ({}));
          console.error('API response error for upcoming matches:', upcomingResponse.status, errorData);
          throw new Error(`Failed to fetch upcoming matches: ${upcomingResponse.status} ${errorData.error || ''}`);
        }
        
        const upcomingData = await upcomingResponse.json();
        console.log('Upcoming matches fetched:', upcomingData);
        
        // Combine live and upcoming matches (prioritizing live matches)
        const combinedMatches = [...liveData, ...upcomingData].slice(0, 4);
        console.log('Combined matches:', combinedMatches);
        
        if (combinedMatches.length > 0) {
          setMatches(combinedMatches);
          console.log('Matches set successfully:', combinedMatches.length, 'matches');
        } else {
          console.warn('No matches returned from API, using sample data');
          setMatches(sampleMatches);
          setMatchesError('No matches found in the database. Using sample data instead.');
        }
        setIsLoadingMatches(false);
      } catch (error) {
        console.error('Error fetching matches:', error);
        // Use sample data as fallback
        console.log('Using sample matches data as fallback due to error');
        setMatches(sampleMatches);
        setIsLoadingMatches(false);
        setMatchesError(`Note: Using sample data. API error: ${error.message}`);
      }
    };

    fetchMatches();
  }, []);
  
  // Fetch teams data
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoadingTeams(true);
        const response = await fetch('/api/teams');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API response error:', response.status, errorData);
          throw new Error(`Failed to fetch teams: ${response.status} ${errorData.error || ''}`);
        }
        
        const data = await response.json();
        console.log('Teams fetched successfully:', data.length, 'teams');
        setTeams(data);
        setIsLoadingTeams(false);
      } catch (error) {
        console.error('Error fetching teams:', error);
        // Use sample data as fallback
        console.log('Using sample teams data as fallback');
        setTeams(sampleTeams);
        setIsLoadingTeams(false);
        setTeamsError(`Note: Using sample data. API error: ${error.message}`);
      }
    };

    fetchTeams();
  }, []);
  
  return (
    <main className="min-h-screen bg-white dark:bg-gray-800">
      <Navbar />
      <Hero />
      
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Upcoming Matches</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Don't miss any action from IPL 2025. Check the schedule and watch live!
            </p>
          </div>
          
          {/* Loading State for Matches */}
          {isLoadingMatches && (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {/* Error State for Matches */}
          {matchesError && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8" role="alert">
              <p>{matchesError}</p>
            </div>
          )}
          
          {/* Matches Grid */}
          {!isLoadingMatches && (
            <>
              {matches && matches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {matches.map((match, index) => {
                    console.log('Rendering match card:', match);
                    console.log('Raw match data structure:', match);

                    // Extract team data properly ensuring we process the data correctly
                    // regardless of whether it's in a nested format or flattened format
                    let team1Data, team2Data;
                    
                    if (match.team1 && typeof match.team1 === 'object') {
                      // Nested team format
                      team1Data = {
                        name: match.team1.name,
                        short: match.team1.short_name,
                        logo: match.team1.logo_url
                      };
                    } else {
                      // Flattened format
                      team1Data = {
                        name: match.team1_name,
                        short: match.team1_short_name,
                        logo: match.team1_logo
                      };
                    }
                    
                    if (match.team2 && typeof match.team2 === 'object') {
                      // Nested team format
                      team2Data = {
                        name: match.team2.name,
                        short: match.team2.short_name,
                        logo: match.team2.logo_url
                      };
                    } else {
                      // Flattened format
                      team2Data = {
                        name: match.team2_name,
                        short: match.team2_short_name,
                        logo: match.team2_logo
                      };
                    }
                    
                    console.log('Extracted team data:', { team1Data, team2Data });
                    
                    // Create a proper match card object with all required data
                    const matchData = {
                      id: match.id || `match-${index}`,
                      matchNumber: match.match_number || index + 1,
                      team1: team1Data,
                      team2: team2Data,
                      venue: match.venue || 'TBD',
                      date: match.match_date ? formatDate(match.match_date) : (match.date || 'TBD'),
                      time: match.match_time ? formatTime(match.match_time) : (match.time || 'TBD'),
                      isLive: match.status === 'live'
                    };
                    console.log('Processed match data:', matchData);
                    return (
                      <div key={matchData.id} className="match-card-container">
                        <MatchCard 
                          matchNumber={matchData.matchNumber}
                          team1={{
                            name: matchData.team1.name,
                            short: matchData.team1.short,
                            logo: matchData.team1.logo
                          }}
                          team2={{
                            name: matchData.team2.name,
                            short: matchData.team2.short,
                            logo: matchData.team2.logo
                          }}
                          venue={matchData.venue}
                          date={matchData.date}
                          time={matchData.time}
                          isLive={matchData.isLive}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-300">No upcoming matches found.</p>
                </div>
              )}
            </>
          )}
          
          <div className="text-center mt-12">
            <Link 
              href="/schedule" 
              className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              View Full Schedule
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
      
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">IPL 2025 Teams</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              10 teams competing for the IPL trophy
            </p>
          </div>
          
          {/* Loading State for Teams */}
          {isLoadingTeams && (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {/* Error State for Teams */}
          {teamsError && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8" role="alert">
              <p>{teamsError}</p>
            </div>
          )}
          
          {/* Teams Grid */}
          {!isLoadingTeams && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {teams.map((team) => (
                <Link href={`/team/${team.id}`} key={team.id} className="block">
                  <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:shadow-lg transition-shadow duration-300">
                    {team.logo_url ? (
                      <img 
                        src={team.logo_url} 
                        alt={team.name} 
                        className="h-16 w-16 mx-auto mb-3 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`h-16 w-16 mx-auto mb-3 ${teamColors[team.short_name] || 'bg-blue-900'} rounded-full flex items-center justify-center`}>
                        <span className="font-bold text-lg text-white">{team.short_name}</span>
                      </div>
                    )}
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{team.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      

      
      <Footer />
    </main>
  );
}
