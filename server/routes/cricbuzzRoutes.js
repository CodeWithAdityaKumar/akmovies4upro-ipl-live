const express = require('express');
const { getMatchData, getIPLMatches } = require('../controllers/cricbuzzController');
const { extractSquadData } = require('../controllers/cricbuzz/squadExtractor');

const router = express.Router();

// Route to get match data from Cricbuzz
// The path parameter will receive the match URL path without the base domain
// Example: /api/cricbuzz/matchData/live-cricket-scores/some-match-id
router.get('/matchData/:matchPath(*)', getMatchData);

// Route to get IPL match data
router.get('/ipl', getIPLMatches);

// Direct route to get squad data by match ID
router.get('/squads/:matchId', async (req, res) => {
  try {
    const matchId = req.params.matchId;
    console.log(`Fetching squads for match ID: ${matchId}`);
    
    if (!matchId) {
      return res.status(400).json({
        success: false,
        message: 'Match ID is required'
      });
    }
    
    const squadData = await extractSquadData(matchId);
    
    if (!squadData) {
      return res.status(404).json({
        success: false,
        message: 'Squad data not found for this match'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: squadData
    });
  } catch (error) {
    console.error('Error fetching squad data:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch squad data',
      error: error.message
    });
  }
});

// Direct route to get squad data by match path (for debugging)
router.get('/debugSquads/:path(*)', async (req, res) => {
  try {
    const matchPath = req.params.path;
    console.log(`Debugging squads for path: ${matchPath}`);
    
    if (!matchPath) {
      return res.status(400).json({
        success: false,
        message: 'Match path is required'
      });
    }
    
    // Extract match ID using all possible patterns
    const matchIdMatch = matchPath.match(/\/(\d+)\//) || 
                         matchPath.match(/\-(\d+)\-/) || 
                         matchPath.match(/\/cricket-scores\/(\d+)\//) ||
                         matchPath.match(/\/live-cricket-scores\/(\d+)\//);
                         
    if (!matchIdMatch || !matchIdMatch[1]) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract match ID from path'
      });
    }
    
    const matchId = matchIdMatch[1];
    console.log(`Extracted match ID: ${matchId}`);
    
    const { extractSquadData } = require('../controllers/cricbuzz/squadExtractor');
    const squadData = await extractSquadData(matchId, matchPath);
    
    if (!squadData) {
      return res.status(404).json({
        success: false,
        message: 'Squad data not found for this match'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: squadData
    });
  } catch (error) {
    console.error('Error debugging squad data:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch squad data',
      error: error.message
    });
  }
});

module.exports = router;