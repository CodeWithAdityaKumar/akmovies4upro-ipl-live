"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeMatches: 0,
    upcomingMatches: 0,
    totalTeams: 0,
    totalViewers: 0
  });
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to safely fetch data from API
  const safeApiFetch = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      return null;
    }
  };

  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data in parallel from our new PostgreSQL API endpoints
      const [liveMatches, upcomingMatches, dashboardStats] = await Promise.all([
        safeApiFetch('/api/matches/live'),
        safeApiFetch('/api/matches/upcoming'),
        safeApiFetch('/api/stats')
      ]);
      
      // If any of the API calls failed, use mock data
      if (!liveMatches || !upcomingMatches || !dashboardStats) {
        console.error('Database connection failed, using mock data');
        
        // Use mock data from localStorage
        const mockMatches = JSON.parse(localStorage.getItem('mockMatches') || '[]');
        
        // Filter live and upcoming matches
        const mockLiveMatches = mockMatches.filter(match => match.status === 'live')
          .map(match => ({
            id: match.id,
            match_date: match.date,
            venue: match.venue,
            status: match.status,
            status_text: 'LIVE',
            team1_score: match.team1.score,
            team2_score: match.team2.score,
            team1: { name: match.team1.name, short_name: match.team1.short },
            team2: { name: match.team2.name, short_name: match.team2.short },
            viewer_count: match.viewers || Math.floor(Math.random() * 100000)
          }));
          
        const mockUpcomingMatches = mockMatches.filter(match => match.status === 'scheduled')
          .map(match => ({
            id: match.id,
            match_date: match.date,
            venue: match.venue,
            status: match.status,
            team1: { name: match.team1.name, short_name: match.team1.short },
            team2: { name: match.team2.name, short_name: match.team2.short }
          }));
          
        setLiveMatches(mockLiveMatches);
        setUpcomingMatches(mockUpcomingMatches);
        
        // Update stats with mock data
        setStats({
          activeMatches: mockLiveMatches.length,
          upcomingMatches: mockUpcomingMatches.length,
          totalTeams: 10, // 10 IPL teams
          totalViewers: mockLiveMatches.reduce((total, match) => total + (match.viewer_count || 0), 0)
        });
      } else {
        // Use real data from PostgreSQL API
        setLiveMatches(liveMatches);
        setUpcomingMatches(upcomingMatches);
        setStats(dashboardStats);
      }
      
      setError(null);
    } catch (supabaseError) {
      console.error('Supabase connection failed, using mock data:', supabaseError);
      
      // Use mock data from localStorage
      const mockMatches = JSON.parse(localStorage.getItem('mockMatches') || '[]');
      
      // Filter live and upcoming matches
      const mockLiveMatches = mockMatches.filter(match => match.status === 'live')
        .map(match => ({
          id: match.id,
          match_date: match.date,
          venue: match.venue,
          status: match.status,
          status_text: 'LIVE',
          team1_score: match.team1.score,
          team2_score: match.team2.score,
          team1: { name: match.team1.name, short_name: match.team1.short },
          team2: { name: match.team2.name, short_name: match.team2.short },
          viewer_count: match.viewers || Math.floor(Math.random() * 100000)
        }));
        
      const mockUpcomingMatches = mockMatches.filter(match => match.status === 'scheduled')
        .map(match => ({
          id: match.id,
          match_date: match.date,
          venue: match.venue,
          status: match.status,
          team1: { name: match.team1.name, short_name: match.team1.short },
          team2: { name: match.team2.name, short_name: match.team2.short }
        }));
        
      setLiveMatches(mockLiveMatches);
      setUpcomingMatches(mockUpcomingMatches);
      
      // Update stats with mock data
      setStats({
        activeMatches: mockLiveMatches.length,
        upcomingMatches: mockUpcomingMatches.length,
        totalTeams: 10, // 10 IPL teams
        totalViewers: mockLiveMatches.reduce((total, match) => total + (match.viewer_count || 0), 0)
      });
      
      setError(null);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Initial fetch of dashboard data
    fetchDashboardData();
    
    // Set up a polling interval to refresh data every 30 seconds
    const pollingInterval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30 seconds
    
    return () => {
      // Clean up interval on component unmount
      clearInterval(pollingInterval);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Matches" 
          value={stats.activeMatches}
          icon="🏏"
          color="bg-green-600"
        />
        <StatCard 
          title="Upcoming Matches" 
          value={stats.upcomingMatches}
          icon="📅"
          color="bg-blue-600"
        />
        <StatCard 
          title="Teams" 
          value={stats.totalTeams}
          icon="👥"
          color="bg-purple-600"
        />
        <StatCard 
          title="Live Viewers" 
          value={formatNumber(stats.totalViewers)}
          icon="👁️"
          color="bg-red-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/admin/matches/add"
            className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg flex items-center justify-between transition-transform hover:scale-105"
          >
            <div>
              <span className="font-medium">Add New Match</span>
              <p className="text-xs text-blue-200 mt-1">Create a new scheduled match</p>
            </div>
            <span className="text-2xl">➕</span>
          </Link>
          <Link 
            href="/admin/streams/manage"
            className="bg-green-600 hover:bg-green-700 p-4 rounded-lg flex items-center justify-between transition-transform hover:scale-105"
          >
            <div>
              <span className="font-medium">Manage Live Streams</span>
              <p className="text-xs text-green-200 mt-1">Start or modify live broadcasts</p>
            </div>
            <span className="text-2xl">📺</span>
          </Link>
          <button 
            onClick={() => {
              // Refresh dashboard data
              fetchDashboardData();
              alert('Dashboard refreshed!');
            }}
            className="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg flex items-center justify-between transition-transform hover:scale-105"
          >
            <div>
              <span className="font-medium">Refresh Dashboard</span>
              <p className="text-xs text-purple-200 mt-1">Update all stats and data</p>
            </div>
            <span className="text-2xl">🔄</span>
          </button>
        </div>
      </div>

      {/* Current Live Matches */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Current Live Matches</h2>
          {loading && (
            <div className="animate-pulse">
              <div className="h-4 w-24 bg-gray-600 rounded"></div>
            </div>
          )}
        </div>
        
        {error && (
          <div className="p-4 mb-4 text-sm text-red-400 bg-gray-700 rounded-lg">
            {error}
          </div>
        )}
        
        {!loading && !error && liveMatches.length === 0 && (
          <div className="p-4 text-gray-400 text-sm bg-gray-700 rounded-lg">
            No live matches at the moment.
          </div>
        )}
        
        {!loading && !error && liveMatches.length > 0 && (
          <div className="divide-y divide-gray-700">
            {liveMatches.map(match => (
              <LiveMatchItem 
                key={match.id}
                team1={match.team1?.name || 'TBD'} 
                team2={match.team2?.name || 'TBD'}
                score1={match.team1_score || '--'} 
                score2={match.team2_score || '--'}
                viewers={formatNumber(match.viewer_count || 0)}
                status={match.status_text || 'LIVE'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Matches */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upcoming Matches</h2>
          {loading && (
            <div className="animate-pulse">
              <div className="h-4 w-24 bg-gray-600 rounded"></div>
            </div>
          )}
        </div>
        
        {error && (
          <div className="p-4 mb-4 text-sm text-red-400 bg-gray-700 rounded-lg">
            {error}
          </div>
        )}
        
        {!loading && !error && upcomingMatches.length === 0 && (
          <div className="p-4 text-gray-400 text-sm bg-gray-700 rounded-lg">
            No upcoming matches scheduled.
          </div>
        )}
        
        {!loading && !error && upcomingMatches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingMatches.map(match => (
              <UpcomingMatchItem 
                key={match.id}
                team1={match.team1?.name || 'TBD'} 
                team2={match.team2?.name || 'TBD'}
                dateTime={formatMatchDateTime(match.match_date)}
                venue={match.venue || 'TBD'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ title, value, icon, color }) {
  return (
    <div className={`${color} rounded-lg p-6 flex items-center justify-between`}>
      <div>
        <h3 className="text-gray-200 text-sm font-medium">{title}</h3>
        <p className="text-white text-2xl font-bold">{value}</p>
      </div>
      <div className="text-4xl opacity-80">{icon}</div>
    </div>
  );
}

function LiveMatchItem({ team1, team2, score1, score2, viewers, status }) {
  // Pulse animation for LIVE status indicator
  const [pulse, setPulse] = useState(true);
  
  // Toggle pulse animation every second
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => !prev);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="py-4 flex flex-wrap md:flex-nowrap justify-between items-center hover:bg-gray-700 rounded-lg transition-colors px-2">
      <div className="w-full md:w-auto mb-2 md:mb-0">
        <div className="flex items-center">
          <span className={`${pulse ? 'text-red-500' : 'text-red-700'} font-bold mr-2 transition-colors`}>
            <span className="inline-block h-2 w-2 mr-1 rounded-full bg-red-500 animate-pulse"></span>
            {status}
          </span>
          <h3 className="font-bold">{team1} vs {team2}</h3>
        </div>
        <div className="text-sm text-gray-400">
          {score1} • {score2}
        </div>
      </div>
      <div className="flex space-x-2">
        <span className="bg-gray-700 text-sm px-3 py-1 rounded flex items-center">
          <span className="mr-1">👁️</span> {viewers}
        </span>
        <Link 
          href={`/admin/streams/edit?match=${team1}-vs-${team2}`}
          className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-1 rounded transition-colors"
        >
          Edit Stream
        </Link>
        <Link 
          href={`/live?match=${team1.toLowerCase().replace(/ /g, '-')}-vs-${team2.toLowerCase().replace(/ /g, '-')}`}
          className="bg-green-600 hover:bg-green-700 text-sm px-3 py-1 rounded transition-colors"
          target="_blank"
        >
          Watch
        </Link>
      </div>
    </div>
  );
}

function UpcomingMatchItem({ team1, team2, dateTime, venue }) {
  // Convert string date to Date object
  const date = new Date(dateTime);
  
  // Calculate time remaining until match
  const [timeRemaining, setTimeRemaining] = useState('');
  
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const diffMs = date - now;
      
      if (diffMs <= 0) {
        setTimeRemaining('Starting soon');
        return;
      }
      
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffDays > 0) {
        setTimeRemaining(`${diffDays}d ${diffHours}h ${diffMinutes}m`);
      } else if (diffHours > 0) {
        setTimeRemaining(`${diffHours}h ${diffMinutes}m`);
      } else {
        setTimeRemaining(`${diffMinutes}m`);
      }
    };
    
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [date]);
  
  return (
    <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
      <h3 className="font-bold">{team1} vs {team2}</h3>
      <div className="text-sm text-gray-300 mt-1">{venue}</div>
      <div className="text-sm text-gray-400 mt-1">
        {date.toLocaleDateString()} • {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </div>
      <div className="mt-2 bg-gray-800 py-1 px-2 rounded inline-block">
        <span className="text-xs text-yellow-400">⏱️ {timeRemaining}</span>
      </div>
      <div className="mt-3 flex justify-end space-x-2">
        <button 
          onClick={() => {
            // Create a calendar event URL
            const title = `IPL Match: ${team1} vs ${team2}`;
            const details = `IPL 2025 match between ${team1} and ${team2} at ${venue}`;
            const startTime = date.toISOString();
            const endTime = new Date(date.getTime() + 4 * 60 * 60 * 1000).toISOString(); // Assuming 4 hours duration
            
            const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(venue)}&dates=${startTime.replace(/[-:]/g, '').replace(/\.\d+/, '')}/${endTime.replace(/[-:]/g, '').replace(/\.\d+/, '')}`;
            
            window.open(googleCalendarUrl, '_blank');
          }}
          className="bg-green-600 hover:bg-green-700 text-sm px-2 py-1 rounded transition-colors"
        >
          Add to Calendar
        </button>
        <Link 
          href={`/admin/matches/edit?match=${team1}-vs-${team2}`}
          className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-1 rounded transition-colors"
        >
          Configure
        </Link>
      </div>
    </div>
  );
}

// Helper function to format numbers
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Format match datetime from ISO string
function formatMatchDateTime(dateTimeStr) {
  if (!dateTimeStr) return 'TBD';
  
  const matchDate = new Date(dateTimeStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Check if match is today or tomorrow
  if (matchDate.toDateString() === today.toDateString()) {
    return `Today, ${matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (matchDate.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return `${matchDate.toLocaleDateString([], { day: 'numeric', month: 'short' })}, ${matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
}
