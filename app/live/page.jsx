"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import LivePlayer from "../components/LivePlayer";
import LiveScores from "../components/LiveScores";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";

const LivePage = () => {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Current match ID for RCB vs CSK match
  const matchId = "live-cricket-scores/89661/pbks-vs-dc-2nd-match-indian-premier-league-2024";
  const stream_url = "https://cdn.jwplayer.com/manifests/pZxWPRg4.m3u8"; // Sample HLS stream URL

  // Always declare all hooks at the top level
  // Memoized values for scores that are only computed when data is available
  const scoreDisplay = useMemo(() => {
    if (!matchData?.data) return null;
    
    const data = matchData.data;
    // Handle both score and scores fields for backwards compatibility
    const scores = data?.scores || data?.score || {};
    const team1Name = Object.keys(scores)[0] || "";
    const team2Name = Object.keys(scores)[1] || "";
    const team1Score = scores[team1Name] || "";
    const team2Score = scores[team2Name] || "";
    
    return (
      <>
        <div className="text-center">
          <div className="h-20 w-20 mx-auto mb-2 rounded-full flex items-center justify-center"
               style={{ backgroundColor: team1Name === 'RCB' ? '#EE0000' : '#FFFF00' }}>
            <span className="font-bold text-xl text-white">{team1Name}</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {team1Score}
          </div>
        </div>
        
        <div className="text-center">
          <span className="inline-block px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-800 dark:text-gray-200 font-bold text-lg">
            vs
          </span>
        </div>
        
        <div className="text-center">
          <div className="h-20 w-20 mx-auto mb-2 rounded-full flex items-center justify-center"
               style={{ backgroundColor: team2Name === 'CSK' ? '#FFFF00' : '#EE0000' }}>
            <span className="font-bold text-xl text-white">{team2Name}</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {team2Score}
          </div>
        </div>
      </>
    );
  }, [matchData]);

  // Memoized commentary - only re-renders when matchData changes
  const commentarySection = useMemo(() => {
    if (!matchData?.data?.commentary || !Array.isArray(matchData.data.commentary) || matchData.data.commentary.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          No commentary available at the moment
        </div>
      );
    }
    
    return matchData.data.commentary.slice(0, 10).map((comment, idx) => (
      <div key={`comment-${comment.text.substring(0, 20)}-${idx}`} className="flex">
        <div className="mr-4 flex-shrink-0">
          <span className="inline-flex items-center justify-center h-8 w-14 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium">
            {comment.over}
          </span>
        </div>
        <div className="flex-1 text-gray-800 dark:text-gray-300">
          {comment.text}
        </div>
      </div>
    ));
  }, [matchData]);
  
  // Memoize the fetch function to prevent recreation on each render

  // Track consecutive failures for backoff strategy
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  const fetchMatchData = useCallback(async (isBackgroundUpdate = false) => {
    try {
      // Only show loading for initial load, not background updates
      if (!isBackgroundUpdate && !matchData) {
        setLoading(true);
      }
      
      // Set up a timeout for the fetch to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
      
      // Use cache: 'no-store' to ensure we get fresh data each time
      const response = await fetch(`/api/cricket?matchId=${matchId}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      // Clear the timeout as we've received a response
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cricket data: ${response.status}`);
      }

      const newData = await response.json();
      
      // Reset consecutive failures on success
      if (consecutiveFailures > 0) {
        setConsecutiveFailures(0);
      }
      
      // For initial load, set the complete data
      if (!matchData) {
        setMatchData(newData);
      } else {
        // For subsequent updates, only update specific fields (score, over, commentary)
        setMatchData(prevData => {
          // If previous data is null, use the new data directly
          if (!prevData) return newData;
          
          // Create a deep copy of the previous data to avoid unwanted side effects
          const updatedData = JSON.parse(JSON.stringify(prevData));
          
          // Only update the dynamic parts (score/scores, over, commentary) from the nested data structure
          // Handle both data.score and data.scores for backwards compatibility
          if (newData.data?.score) {
            updatedData.data.score = newData.data.score;
          } else if (newData.data?.scores) {
            updatedData.data.scores = newData.data.scores;
          }
          
          if (newData.data?.status) {
            updatedData.data.status = newData.data.status;
          }
          
          if (newData.data?.over) {
            updatedData.data.over = newData.data.over;
          }
          
          if (newData.data?.commentary) {
            updatedData.data.commentary = newData.data.commentary;
          }
          
          // Return the selectively updated data
          return updatedData;
        });
      }
      
      setError(null);
      return true; // Indicate success
    } catch (err) {
      console.error('Error fetching match data:', err);
      
      // Only set error state for non-background updates
      // This ensures the UI doesn't show error states during background refreshes
      if (!isBackgroundUpdate) {
        setError('Could not load match data');
      }
      
      // Increment consecutive failures for backoff strategy
      setConsecutiveFailures(prev => prev + 1);
      return false; // Indicate failure
    } finally {
      // Only update loading state for non-background updates
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    }
  }, [matchData, matchId, consecutiveFailures]);

  useEffect(() => {
    // Initial fetch
    fetchMatchData(false);
    
    // Dynamic interval based on consecutive failures (backoff strategy)
    const getRefreshInterval = () => {
      // Start with 30 seconds, but back off if consecutive failures occur
      // 30s → 60s → 90s → 120s (max)
      const baseInterval = 30000;
      const maxInterval = 120000;
      const backoffFactor = Math.min(3, consecutiveFailures); // Cap at 3x backoff
      
      return Math.min(maxInterval, baseInterval * (backoffFactor + 1));
    };
    
    // Set up polling with dynamic interval for silent background updates
    const intervalId = setInterval(() => {
      // Pass true to indicate this is a background update
      fetchMatchData(true)
        .catch(err => console.error('Background refresh error:', err))
        .finally(() => {
          // Properly adjust interval based on current failure state
          const newInterval = getRefreshInterval();
          
          // The 'interval' property isn't directly available on the intervalId
          // We need to recreate the interval with the new timing regardless
          clearInterval(intervalId);
          const newIntervalId = setInterval(() => {
            fetchMatchData(true)
              .catch(err => console.error('Background refresh error:', err));
          }, newInterval);
        });
    }, getRefreshInterval());
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchMatchData, consecutiveFailures]);


  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Match</h1>
            <p className="text-gray-600 dark:text-gray-400">Loading match data...</p>
          </div>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !matchData) {
    return (
      <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Match</h1>
            <p className="text-red-500 dark:text-red-400">{error || "No match data available"}</p>
          </div>
        </div>
      </main>
    );
  }

  // Extract necessary data from matchData - but only if it exists
  const data = matchData?.data;
  const title = data?.title || "";
  const status = data?.status || "";
  const matchDetails = data?.matchDetails || {};
  
  // Extract venue and date
  const venue = matchDetails?.venue || "";
  const date = matchDetails?.date || "";
  
  // Handle both score and scores fields for backwards compatibility
  const scores = data?.scores || data?.score || {};
  
  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Match</h1>
          <p className="text-gray-600 dark:text-gray-400">
            IPL 2024 • {matchDetails?.Match || ""}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <LivePlayer matchId={matchId} streamUrl={stream_url} />
              
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-0">
                    {title}
                  </h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    <span className="h-2 w-2 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
                    LIVE
                  </span>
                </div>
                
                <div className="flex justify-center items-center space-x-8 my-6">
                  {scoreDisplay}
                </div>
                
                <div className="text-center p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-800 dark:text-blue-200 font-medium">
                  {status}
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                  <button className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700">
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Match Details
                  </button>
                </div>
              </div>
            </div>
            
            {/* Live Commentary */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Commentary</h3>
              </div>
              <div className="p-6 h-80 overflow-y-auto">
                <div className="space-y-4">
                  {commentarySection}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sidebar Content */}
          <div className="lg:col-span-1 space-y-8">
            {/* Live Cricket Scores */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Cricket Score</h3>
              </div>
              <div className="p-4">
                {/* Pass match data directly to LiveScores component instead of having it fetch independently */}
                <LiveScores matchData={matchData?.data} className="w-full" />
              </div>
            </div>
            {/* Match Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Match Info</h3>
              </div>
              <div className="p-6">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Match</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">{matchDetails.Match || ""}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Venue</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">{venue}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">{date}</dd>
                  </div>
                  {data.playerOfTheMatch && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Player of the Match</dt>
                      <dd className="mt-1 text-gray-900 dark:text-white">{data.playerOfTheMatch}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Umpires</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">Kumar Dharmasena, Chris Gaffaney</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Match Referee</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">Javagal Srinath</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {/* Live Chat - Preview only */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Chat</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  2.3K Online
                </span>
              </div>
              <div className="p-6">
                <div className="h-72 flex flex-col">
                  <div className="flex-1 overflow-y-auto mb-4">
                    <div className="space-y-3">
                      {[
                        { user: "cricket_fan123", message: "What a match! CSK vs MI is always a thriller!" },
                        { user: "blue_army", message: "Mumbai Indians are the best team in IPL history 🏆" },
                        { user: "csk_whistle", message: "Dhoni still showing why he's the best captain 💛" },
                        { user: "ipl_lover", message: "That last six was massive!" },
                        { user: "cricket_expert", message: "Mumbai's middle order is looking strong this year" },
                        { user: "sports_geek", message: "CSK's bowling has been pretty average today" }
                      ].map((chat, idx) => (
                        <div key={idx} className="flex">
                          <div className="mr-3 flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <span className="font-bold text-xs text-blue-800 dark:text-blue-200">{chat.user.substring(0, 2).toUpperCase()}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900 dark:text-white">{chat.user}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{chat.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    />
                    <button className="absolute right-2 top-2 text-blue-600 dark:text-blue-400">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Please be respectful in the chat. Any inappropriate messages will be removed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
};

export default LivePage;
