"use client";

import { useState, useEffect } from 'react';
import { formatMatchData, getTeamColor } from '../../utils/cricketUtils';

// Updated to receive matchData directly from parent instead of fetching independently
const LiveScores = ({ matchData: propMatchData, className }) => {
  const [expanded, setExpanded] = useState(false);
  // Use formatted data from props
  const [formattedData, setFormattedData] = useState(null);
  
  // Process incoming match data prop when it changes
  useEffect(() => {
    if (propMatchData) {
      // Ensure data compatibility before formatting
      const dataToFormat = {
        ...propMatchData,
        // Handle both scores and score for better compatibility
        scores: propMatchData.scores || propMatchData.score || {}
      };
      
      // Format the data received from props
      const formatted = formatMatchData(dataToFormat);
      setFormattedData(formatted);
    }
  }, [propMatchData]);
  
  // Loading state derived from props
  const loading = !propMatchData;
  // Get error state from props if available
  const error = propMatchData?.error || null;

  if (loading) {
    return (
      <div className={`bg-gray-900 rounded-lg p-3 animate-pulse ${className}`}>
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-full"></div>
      </div>
    );
  }

  if (error || !propMatchData) {
    return (
      <div className={`bg-gray-900 rounded-lg p-3 text-gray-400 text-sm ${className}`}>
        {error || "No match data available"}
      </div>
    );
  }

  // Use the formattedData state which updates only when props change
  if (!formattedData) return null;
  
  const { title, status, scores, teams, recentCommentary, playerOfTheMatch } = formattedData;
  
  // Extract team names for display
  const team1Name = Object.keys(scores)[0] || teams?.team1?.name || '';
  const team2Name = Object.keys(scores)[1] || teams?.team2?.name || '';
  
  // Get team scores
  const team1Score = scores[team1Name] || '';
  const team2Score = scores[team2Name] || '';

  return (
    <div className={`bg-gray-900 bg-opacity-90 rounded-lg overflow-hidden ${className}`}>
      {/* Match header */}
      <div className="bg-gray-800 p-3">
        <h3 className="text-white text-sm font-medium truncate">{title}</h3>
        <p className="text-gray-300 text-xs mt-1">{status}</p>
      </div>
      
      {/* Score section */}
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: getTeamColor(team1Name) }}
            ></div>
            <span className="text-white font-medium">{team1Name}</span>
          </div>
          <span className="text-white font-bold">{team1Score}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: getTeamColor(team2Name) }}
            ></div>
            <span className="text-white font-medium">{team2Name}</span>
          </div>
          <span className="text-white font-bold">{team2Score}</span>
        </div>

        {playerOfTheMatch && (
          <div className="mt-2 text-yellow-400 text-xs">{playerOfTheMatch}</div>
        )}
      </div>
      
      {/* Expandable commentary section */}
      {recentCommentary && recentCommentary.length > 0 && (
        <div className="border-t border-gray-800">
          <button 
            className="w-full text-left p-3 text-gray-300 text-xs flex justify-between items-center"
            onClick={() => setExpanded(!expanded)}
          >
            <span className="font-medium">Recent Commentary</span>
            <svg 
              className={`w-4 h-4 transition-transform ${expanded ? 'transform rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expanded && (
            <div className="p-3 pt-0 space-y-2">
              {recentCommentary.map((comment, index) => (
                <div key={index} className="text-gray-300 text-xs">
                  {comment.over && <span className="text-gray-400">{comment.over} | </span>}
                  {comment.text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveScores;
