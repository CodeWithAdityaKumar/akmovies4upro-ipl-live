/**
 * Utility functions for processing cricket match data
 */

/**
 * Format match details from API response
 * @param {Object} matchData - Raw match data from API
 * @returns {Object} Formatted match data
 */
export const formatMatchData = (matchData) => {
  if (!matchData || !matchData.data) {
    return null;
  }

  const { data } = matchData;
  
  return {
    title: data.title || '',
    status: data.status || '',
    scores: data.scores || {},
    matchDetails: data.matchDetails || {},
    playerOfTheMatch: data.playerOfTheMatch || '',
    teams: {
      team1: formatTeamData(data.matchDetails?.squads?.team1),
      team2: formatTeamData(data.matchDetails?.squads?.team2),
    },
    // Get the most recent 5 commentary entries
    recentCommentary: Array.isArray(data.commentary) 
      ? data.commentary.slice(0, 5).map(c => ({
          over: c.over,
          text: c.text
        }))
      : []
  };
};

/**
 * Format team data with necessary information
 * @param {Object} team - Team data from API
 * @returns {Object} Formatted team data
 */
const formatTeamData = (team) => {
  if (!team) return null;
  
  return {
    name: team.name || '',
    playingXI: team.playingXI || [],
    captain: team.playingXI?.find(player => player.isCaptain) || null,
    // Get key players for display (first 4 players)
    keyPlayers: team.playingXI?.slice(0, 4) || []
  };
};

/**
 * Get match ID from a URL or match slug
 * @param {string} matchSlug - Match slug or URL
 * @returns {string} Extracted match ID
 */
export const extractMatchId = (matchSlug) => {
  if (!matchSlug) return '';
  
  // If it's a full URL, extract the last segment
  if (matchSlug.includes('/')) {
    return matchSlug.split('/').pop();
  }
  
  return matchSlug;
};

/**
 * Get team color based on team name
 * @param {string} teamName - Team name or abbreviation
 * @returns {string} CSS color code
 */
export const getTeamColor = (teamName) => {
  if (!teamName) return '#666666';
  
  const teamColors = {
    'RCB': '#EE0000',
    'Royal Challengers Bengaluru': '#EE0000',
    'CSK': '#FFFF00',
    'Chennai Super Kings': '#FFFF00',
    'MI': '#004BA0',
    'Mumbai Indians': '#004BA0',
    'KKR': '#3A225D',
    'Kolkata Knight Riders': '#3A225D',
    'DC': '#0078BC',
    'Delhi Capitals': '#0078BC',
    'SRH': '#FF822A',
    'Sunrisers Hyderabad': '#FF822A',
    'PBKS': '#ED1B24',
    'Punjab Kings': '#ED1B24',
    'RR': '#254AA5',
    'Rajasthan Royals': '#254AA5',
    'GT': '#1D2951',
    'Gujarat Titans': '#1D2951',
    'LSG': '#A72056',
    'Lucknow Super Giants': '#A72056',
  };
  
  return teamColors[teamName] || '#666666';
};
