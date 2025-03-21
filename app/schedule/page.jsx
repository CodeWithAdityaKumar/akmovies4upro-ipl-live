"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";

const SchedulePage = () => {
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [teams, setTeams] = useState([]);

  // Fetch matches from API
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/matches?limit=100');
        if (!response.ok) throw new Error('Failed to fetch matches');
        
        const data = await response.json();
        // Check if we have data.matches or if the response is already an array of matches
        const matchesData = Array.isArray(data) ? data : (data.matches || []);
        
        setMatches(matchesData);
        setFilteredMatches(matchesData);
        
        // Extract unique teams for the filter dropdown
        const uniqueTeams = new Set();
        if (matchesData && matchesData.length > 0) {
          matchesData.forEach(match => {
            if (match.team1?.name) uniqueTeams.add(match.team1.name);
            if (match.team2?.name) uniqueTeams.add(match.team2.name);
          });
        }
        setTeams(Array.from(uniqueTeams));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching matches:', error);
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  // Apply filters when filter or selectedTeam changes
  useEffect(() => {
    if (matches.length === 0) return;
    
    let filtered = [...matches];
    
    // Filter by match status
    if (filter === 'upcoming') {
      filtered = filtered.filter(match => 
        match.status === 'UPCOMING' || match.status === 'SCHEDULED'
      );
    } else if (filter === 'results') {
      filtered = filtered.filter(match => 
        match.status === 'COMPLETED'
      );
    }
    
    // Filter by selected team
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(match => 
        (match.team1?.name === selectedTeam) || (match.team2?.name === selectedTeam)
      );
    }
    
    setFilteredMatches(filtered);
  }, [filter, selectedTeam, matches]);

  // Group matches by week
  const groupMatchesByWeek = () => {
    if (filteredMatches.length === 0) return [];
    
    // Sort matches by date
    const sortedMatches = [...filteredMatches].sort((a, b) => {
      const dateA = new Date(a.match_date || a.date);
      const dateB = new Date(b.match_date || b.date);
      return dateA - dateB;
    });
    
    // Group by week
    const weeks = {};
    sortedMatches.forEach(match => {
      const matchDate = new Date(match.match_date || match.date);
      const weekNum = getWeekNumber(matchDate);
      const weekId = `Week ${weekNum}`;
      
      if (!weeks[weekId]) {
        weeks[weekId] = { week: weekId, matches: [] };
      }
      
      weeks[weekId].matches.push(match);
    });
    
    return Object.values(weeks);
  };
  
  // Helper function to get week number
  const getWeekNumber = (date) => {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const pastDays = (date - firstDay) / 86400000;
    return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
  };
  
  // Process API data into weekly format
  const scheduleData = groupMatchesByWeek();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">IPL 2025 Schedule</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Complete schedule of all Indian Premier League matches for the 2025 season
          </p>
        </div>

        {/* Calendar Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-10">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                  All Matches
                </button>
                <button 
                  onClick={() => setFilter('upcoming')}
                  className={`px-4 py-2 rounded-md ${filter === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                  Upcoming
                </button>
                <button 
                  onClick={() => setFilter('results')}
                  className={`px-4 py-2 rounded-md ${filter === 'results' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                  Results
                </button>
              </div>
              <div className="w-full sm:w-auto">
                <select 
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Teams</option>
                  {teams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Schedule Sections */}
        <div className="space-y-12">
          {scheduleData.map((weekData, weekIndex) => (
            <div key={weekIndex}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {weekData.week}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {weekData.matches.map((match) => (
                  <div
                    key={match.id}
                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 transition-all duration-300 ${match.status === 'LIVE' ? 'border-2 border-red-500' : ''}`}
                  >
                    {/* Match Date and Status */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        {/* Format date as dd/mm/yyyy */}
                        {(() => {
                          const matchDate = new Date(match.match_date || match.date);
                          const day = matchDate.getDate().toString().padStart(2, '0');
                          const month = (matchDate.getMonth() + 1).toString().padStart(2, '0');
                          const year = matchDate.getFullYear();
                          const time = matchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                          return (
                            <span className="text-gray-600 dark:text-gray-400">{`${day}/${month}/${year}, ${time}`}</span>
                          );
                        })()}
                      </div>
                      <div>
                        {match.status === 'LIVE' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                            <span className="relative h-2.5 w-2.5 rounded-full bg-red-600 mr-1.5 animate-pulse"></span>
                            LIVE
                          </span>
                        )}
                        {match.status === 'COMPLETED' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                            COMPLETED
                          </span>
                        )}
                        {(match.status === 'UPCOMING' || match.status === 'SCHEDULED') && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                            UPCOMING
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Teams */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center overflow-hidden">
                          {/* Team 1 Logo */}
                          {match.team1?.logo_url ? (
                            <img src={match.team1.logo_url} alt={match.team1.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-blue-900 flex items-center justify-center">
                              <span className="text-white font-bold">{match.team1?.short_name || (match.team1 && match.team1.short)}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{match.team1?.short_name || (match.team1 && match.team1.short) || match.team1?.name || match.team1_name}</h3>
                          {match.status === 'LIVE' || match.status === 'COMPLETED' ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {match.team1_score || (match.team1 && match.team1.score)} 
                              {match.team1_overs || (match.team1 && match.team1.overs) ? `(${match.team1_overs || (match.team1 && match.team1.overs)} ov)` : ''}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="font-bold text-xl text-gray-500 dark:text-gray-400">vs</div>

                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{match.team2?.short_name || (match.team2 && match.team2.short) || match.team2?.name || match.team2_name}</h3>
                          {match.status === 'LIVE' || match.status === 'COMPLETED' ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {match.team2_score || (match.team2 && match.team2.score)}
                              {match.team2_overs || (match.team2 && match.team2.overs) ? `(${match.team2_overs || (match.team2 && match.team2.overs)} ov)` : ''}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center overflow-hidden">
                          {/* Team 2 Logo */}
                          {match.team2?.logo_url ? (
                            <img src={match.team2.logo_url} alt={match.team2.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-yellow-800 flex items-center justify-center">
                              <span className="text-white font-bold">{match.team2?.short_name || (match.team2 && match.team2.short)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Match Result (if completed) */}
                    {match.result && (
                      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{match.result}</p>
                      </div>
                    )}

                    {/* Venue */}
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Venue:</span> {match.venue}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6">
                      {match.status === 'LIVE' ? (
                        <Link
                          href={`/watch/${match.id}`}
                          className="block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg text-center transition-colors duration-200"
                        >
                          Watch LIVE
                        </Link>
                      ) : match.status === 'COMPLETED' ? (
                        <Link
                          href={`/match/${match.id}`}
                          className="block w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-lg text-center transition-colors duration-200"
                        >
                          View Highlights
                        </Link>
                      ) : (
                        <button
                          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-center transition-colors duration-200"
                          onClick={() => alert(`Set reminder for ${match.team1?.short_name || (match.team1 && match.team1.short) || match.team1?.name || match.team1_name} vs ${match.team2?.short_name || (match.team2 && match.team2.short) || match.team2?.name || match.team2_name}`)}
                        >
                          Set Reminder
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default SchedulePage;