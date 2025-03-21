const axios = require('axios');
const cheerio = require('cheerio');

// Import our modular extractor functions
const {
  extractTitle,
  extractMatchStatus,
  extractSeries,
  extractVenue,
  extractMatchDate,
  extractMatchTime,
  extractMatchDetails,
  extractPlayerOfTheMatch,
  extractRecentOvers
} = require('./cricbuzz/extractors');

const { extractTeamsAndScores } = require('./cricbuzz/teamExtractors');
const { extractDetailedCommentary } = require('./cricbuzz/commentaryExtractor');
const { extractSquadData } = require('./cricbuzz/squadExtractor');

/**
 * Get match data from Cricbuzz
 * @param {*} req - Express request object
 * @param {*} res - Express response object
 */
const getMatchData = async (req, res) => {
  try {
    // Get the match URL from the request parameters
    const matchPath = req.params.matchPath;
    
    if (!matchPath) {
      return res.status(400).json({ 
        success: false, 
        message: 'Match path is required' 
      });
    }

    const url = `https://www.cricbuzz.com/${matchPath}`;
    console.log(`Scraping data from: ${url}`);

    // Fetch the HTML content from the URL
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Parse the HTML using cheerio
    const $ = cheerio.load(response.data);
    
    // Extract match details
    const matchInfo = {
      title: extractTitle($),
      status: extractMatchStatus($),
      scores: {},
      matchDetails: {}
    };

    // Extract teams, venue, series, time, date
    const teams = [];
    const venue = extractVenue($);
    const series = extractSeries($);
    const time = extractMatchTime($);
    const date = extractMatchDate($);
    
    // Extract team names and scores
    extractTeamsAndScores($, matchInfo, response.data, teams);
    
    // Direct extraction of scores from the mini-scorecard
    // This targets the exact format we see in the test.html
    $('.cb-min-tm').each((i, elem) => {
      const text = $(elem).text().trim();
      // Check if the text contains both team name and score (like "CAN 145/8 (15)")
      const scoreMatch = text.match(/^([A-Za-z\s]+)\s+(\d+\/\d+.*)/);
      if (scoreMatch && scoreMatch[1] && scoreMatch[2]) {
        const teamNameShort = scoreMatch[1].trim();
        const teamScore = scoreMatch[2].trim();
        
        // Find the full team name from our teams array that matches this short name
        const fullTeamName = teams.find(team => 
          team.includes(teamNameShort) || 
          teamNameShort.includes(team.substring(0, 3)) || 
          team.toLowerCase() === teamNameShort.toLowerCase()
        );
        
        if (fullTeamName) {
          matchInfo.scores[fullTeamName] = teamScore;
        } else {
          // If we can't match to a full name, use the short name
          matchInfo.scores[teamNameShort] = teamScore;
        }
      }
    });
    
    // Fallback direct score extraction if scores object is empty
    if (Object.keys(matchInfo.scores).length === 0 && teams.length > 0) {
      // Try different selectors for score extraction
      $('.cb-scrd-itms-main').each((i, elem) => {
        const scoreText = $(elem).text().trim();
        if (scoreText && teams[i] && !matchInfo.scores[teams[i]]) {
          matchInfo.scores[teams[i]] = scoreText;
        }
      });
      
      // Another fallback method - look for mini-scorecard
      $('.cb-min-bat-rw').each((i, elem) => {
        const team = $(elem).find('.cb-min-itm-rw').text().trim();
        const score = $(elem).find('.cb-min-itm-rw').next().text().trim();
        if (team && score && teams.includes(team)) {
          matchInfo.scores[team] = score;
        }
      });
      
      // Try to extract scores from the match status text
      if (Object.keys(matchInfo.scores).length === 0 && matchInfo.status.includes(' won by ')) {
        $('.cb-mini-col').each((i, elem) => {
          const teamScore = $(elem).text().trim();
          if (teamScore && teamScore.includes('/')) {
            const teamIndex = teams[i] ? i : 0;
            if (teams[teamIndex]) {
              matchInfo.scores[teams[teamIndex]] = teamScore;
            }
          }
        });
      }
    }
    
    // Extract match details like toss, umpires, etc.
    extractMatchDetails($, matchInfo);
    
    // Add player of the match if available
    extractPlayerOfTheMatch($, matchInfo);
    
    // Add recent overs information
    extractRecentOvers($, matchInfo);
    
    // Add detailed commentary - commentary will be an array of objects with over and text properties
    await extractDetailedCommentary($, matchInfo, matchPath);
    
    // Process date properly - extract from title which is most reliable
    let matchDateFormatted = date;
    const properDateFromTitle = matchInfo.title.match(/\b([A-Z][a-z]{2}\s+\d{1,2})\b/);
    if (properDateFromTitle && properDateFromTitle[1]) {
      matchDateFormatted = properDateFromTitle[1];
    } else if (matchInfo.title.includes(',')) {
      // Try another date extraction from title format
      const titleParts = matchInfo.title.split(',');
      for (let part of titleParts) {
        const dateMatch = part.trim().match(/^([A-Z][a-z]{2}\s+\d{1,2})$/);
        if (dateMatch) {
          matchDateFormatted = dateMatch[1];
          break;
        }
      }
    }
    
    // Extract match number/format from the title
    let matchFormat = "Match";
    const matchFormatMatch = matchInfo.title.match(/,\s*([^,]+?)\s*,/);
    if (matchFormatMatch && matchFormatMatch[1]) {
      matchFormat = matchFormatMatch[1].trim();
    }
    
    // If we have scores but they're not properly associated with teams, fix it
    if (Object.keys(matchInfo.scores).length > 0 && teams.length >= 2) {
      // Make sure each team has a score if possible
      const scoreKeys = Object.keys(matchInfo.scores);
      teams.forEach(team => {
        // If team doesn't have a score yet
        if (!matchInfo.scores[team]) {
          // Try to find a score key that might match
          const matchingKey = scoreKeys.find(key => 
            team.includes(key) || 
            key.includes(team.substring(0, 3)) || 
            team.toLowerCase().includes(key.toLowerCase())
          );
          
          if (matchingKey) {
            matchInfo.scores[team] = matchInfo.scores[matchingKey];
            // Remove the abbreviated score to avoid duplication
            if (matchingKey !== team) {
              delete matchInfo.scores[matchingKey];
            }
          }
        }
      });
    }
    
    // Extract match ID from the URL - Fix the regex to handle all URL formats
    const matchIdMatch = matchPath.match(/\/(\d+)\//) || 
                        matchPath.match(/\-(\d+)\-/) || 
                        matchPath.match(/\/cricket-scores\/(\d+)\//) ||
                        matchPath.match(/\/live-cricket-scores\/(\d+)\//);
                        
    let squadData = null;
    
    // If we have a match ID, try to get the squad data
    if (matchIdMatch && matchIdMatch[1]) {
      const matchId = matchIdMatch[1];
      try {
        console.log(`Fetching squad data for match ID: ${matchId}`);
        squadData = await extractSquadData(matchId, matchPath);
        if (squadData) {
          console.log("Squad data fetched successfully");
        } else {
          console.log("No squad data found");
        }
      } catch (squadError) {
        console.error('Failed to fetch squad data:', squadError.message);
      }
    } else {
      console.log("No match ID found in path:", matchPath);
    }
    
    // Adding all match details to matchDetails object including date and squad
    matchInfo.matchDetails = {
      ...matchInfo.matchDetails,
      Match: matchFormat,
      teams: teams,
      venue: venue,
      series: series ? series.replace(' | Cricbuzz.com', '') : series,
      time: time,
      date: matchDateFormatted
    };
    
    // Add squad data if available
    if (squadData && Object.keys(squadData).length > 0) {
      matchInfo.matchDetails.squads = squadData;
    }

    // Delete any redundant fields that are now in matchDetails
    delete matchInfo.venue;
    delete matchInfo.series;
    delete matchInfo.teams;

    return res.status(200).json({
      success: true,
      data: matchInfo
    });
  } catch (error) {
    console.error('Error scraping Cricbuzz:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch match data',
      error: error.message
    });
  }
};

/**
 * Get IPL match data from Cricbuzz
 * @param {*} req - Express request object
 * @param {*} res - Express response object
 */
const getIPLMatches = async (req, res) => {
  try {
    console.log('Fetching IPL matches data');
    
    // The main IPL page on Cricbuzz
    const url = 'https://www.cricbuzz.com/cricket-series/9237/indian-premier-league-2025';
    
    // Fetch the HTML content from the URL
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Parse the HTML using cheerio
    const $ = cheerio.load(response.data);
    
    const iplMatches = [];

    // Extract IPL matches
    $('.cb-sch-lst-itm').each((i, elem) => {
      try {
        // Match details container
        const matchElem = $(elem);
        
        // Get match date
        const matchDate = matchElem.find('.cb-lv-scr-mtch-hdr').text().trim();
        
        // Get teams
        const team1 = matchElem.find('.cb-sch-tm-nm').eq(0).text().trim();
        const team2 = matchElem.find('.cb-sch-tm-nm').eq(1).text().trim();
        
        // Get venue
        const venueTime = matchElem.find('.cb-sch-dt-vnu').text().trim();
        
        // Get match number and format
        const matchInfo = matchElem.find('.cb-col-60.cb-col.cb-lst-itm-sm').text().trim();
        
        // Get match status or time
        let matchStatus = matchElem.find('.cb-text-complete').text().trim();
        if (!matchStatus) {
          matchStatus = matchElem.find('.cb-text-live').text().trim() || 
                       matchElem.find('.cb-text-upcoming').text().trim();
        }
        
        // Get match link
        const matchLink = matchElem.find('a').attr('href');
        
        // Extract scores if available
        let team1Score = matchElem.find('.cb-col-50.cb-ovr-flo').eq(0).text().trim();
        let team2Score = matchElem.find('.cb-col-50.cb-ovr-flo').eq(1).text().trim();
        
        if (!team1Score) {
          team1Score = matchElem.find('.cb-scr-wll-chvrn').eq(0).text().trim();
        }
        
        if (!team2Score) {
          team2Score = matchElem.find('.cb-scr-wll-chvrn').eq(1).text().trim();
        }
        
        // Create match object
        const match = {
          date: matchDate,
          team1,
          team2,
          venueTime,
          matchInfo,
          status: matchStatus || 'Upcoming',
          scores: {}
        };
        
        // Add scores if available
        if (team1Score) match.scores[team1] = team1Score;
        if (team2Score) match.scores[team2] = team2Score;
        
        // Add match link if available
        if (matchLink) {
          match.matchLink = matchLink;
          match.matchId = extractMatchIdFromUrl(matchLink);
        }
        
        iplMatches.push(match);
      } catch (err) {
        console.error(`Error parsing match ${i}:`, err.message);
      }
    });

    // If we didn't find matches on the main page, try the fixtures page
    if (iplMatches.length === 0) {
      await fetchIPLFixtures(iplMatches);
    }

    return res.status(200).json({
      success: true,
      matches: iplMatches
    });
  } catch (error) {
    console.error('Error fetching IPL matches:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch IPL matches data',
      error: error.message
    });
  }
};

/**
 * Fetch IPL fixtures if the main page doesn't have match data
 */
const fetchIPLFixtures = async (iplMatches) => {
  try {
    console.log('Fetching IPL fixtures as fallback');
    
    // The IPL fixtures page on Cricbuzz
    const url = 'https://www.cricbuzz.com/cricket-series/9237/indian-premier-league-2025/matches';
    
    // Fetch the HTML content from the URL
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Parse the HTML using cheerio
    const $ = cheerio.load(response.data);
    
    // Extract IPL fixtures
    $('.cb-sch-lst-itm, .cb-lst-mtch-sm').each((i, elem) => {
      try {
        // Match element
        const matchElem = $(elem);
        
        // Get match date
        const matchDate = matchElem.find('.cb-lv-scr-mtch-hdr').text().trim();
        
        // Get teams
        let team1 = matchElem.find('.cb-mtch-lst-itm-tm').eq(0).text().trim();
        let team2 = matchElem.find('.cb-mtch-lst-itm-tm').eq(1).text().trim();
        
        // Alternate selectors for teams
        if (!team1 || !team2) {
          team1 = matchElem.find('.cb-team-itm').eq(0).text().trim();
          team2 = matchElem.find('.cb-team-itm').eq(1).text().trim();
        }
        
        // Get venue and time
        const venueTime = matchElem.find('.cb-venue-dt-cal').text().trim() || 
                         matchElem.find('.cb-mtch-info').text().trim();
        
        // Get match info
        const matchInfo = matchElem.find('.cb-text-gray').text().trim();
        
        // Get match link
        const matchLink = matchElem.find('a').attr('href');
        
        // Create match object
        if (team1 && team2) {
          const match = {
            date: matchDate,
            team1,
            team2,
            venueTime,
            matchInfo,
            status: 'Upcoming',
            scores: {}
          };
          
          // Add match link if available
          if (matchLink) {
            match.matchLink = matchLink;
            match.matchId = extractMatchIdFromUrl(matchLink);
          }
          
          iplMatches.push(match);
        }
      } catch (err) {
        console.error(`Error parsing fixture ${i}:`, err.message);
      }
    });
  } catch (error) {
    console.error('Error fetching IPL fixtures:', error.message);
    throw error;
  }
};

/**
 * Extract match ID from Cricbuzz URL
 */
function extractMatchIdFromUrl(url) {
  if (!url) return null;
  
  // Match URLs like /live-cricket-scores/114960/kkr-vs-rcb-1st-match-ipl-2025
  const match = url.match(/\/live-cricket-scores\/(\d+)\//);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

module.exports = {
  getMatchData,
  getIPLMatches
};