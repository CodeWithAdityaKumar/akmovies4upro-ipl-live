const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Extract squad information from a match
 * @param {String} matchId - Match ID to fetch squad for
 * @param {String} originalPath - Original match path for fallback
 * @returns {Object} - Squad information for both teams
 */
const extractSquadData = async (matchId, originalPath = null) => {
  try {
    // Extract team names from the path if available
    let teamNames = { team1: '', team2: '' };
    if (originalPath) {
      const teamMatch = originalPath.match(/\/(\w+)-vs-(\w+)/i);
      if (teamMatch && teamMatch[1] && teamMatch[2]) {
        teamNames.team1 = teamMatch[1].toUpperCase();
        teamNames.team2 = teamMatch[2].toUpperCase();
      }
    }

    console.log("Extracted team names from URL:", teamNames);

    // Try multiple URL formats for the squad page
    const urls = [
      `https://www.cricbuzz.com/cricket-match-squads/${matchId}`,
      `https://www.cricbuzz.com/live-cricket-scorecard/${matchId}`,
      `https://www.cricbuzz.com/api/html/cricket-squads/${matchId}`,
      `https://www.cricbuzz.com/cricket-scores/${matchId}`,
      `https://www.cricbuzz.com/cricket-scorecard/${matchId}`,
      // Original URL if we have it
      originalPath ? `https://www.cricbuzz.com/${originalPath}` : null,
    ].filter(Boolean); // Remove null entries
    
    let htmlContent = null;
    let successUrl = '';
    let $ = null; // Declare $ outside the loop for wider scope
    
    // Try each URL until one works
    for (const url of urls) {
      try {
        console.log(`Trying squad URL: ${url}`);
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 8000
        });
        htmlContent = response.data;
        successUrl = url;
        $ = cheerio.load(htmlContent); // Assign $ here
        console.log(`Successfully fetched data from: ${url}`);
        break;
      } catch (error) {
        console.log(`Failed to fetch from ${url}: ${error.message}`);
      }
    }
    
    if (!htmlContent || !$) {
      console.error('Failed to fetch squad data from any URL');
      return null;
    }
    
    // Initialize the squad data structure
    const squadData = {
      team1: {
        name: teamNames.team1 || '',
        playingXI: [],
        substitutes: [],
        bench: [],
        flagUrl: '' // Will be extracted from HTML
      },
      team2: {
        name: teamNames.team2 || '',
        playingXI: [],
        substitutes: [],
        bench: [],
        flagUrl: '' // Will be extracted from HTML
      }
    };
    
    // Extract team names from the page title or navigation header
    const extractTeamNames = ($doc) => {
      // First try from navigation header
      const navHeader = $doc('h1.cb-nav-hdr').text().trim();
      const navMatch = navHeader.match(/(.+?)\s+(?:v|vs|VS)\s+(.+?)(?:,|$)/i);
      
      if (navMatch && navMatch[1] && navMatch[2]) {
        squadData.team1.name = squadData.team1.name || navMatch[1].trim();
        squadData.team2.name = squadData.team2.name || navMatch[2].trim();
        return true;
      }
      
      // Try from title tag
      const titleText = $doc('title').text().trim();
      const titleMatch = titleText.match(/(.+?)\s+(?:v|vs|VS)\s+(.+?)(?:,|$)/i);
      
      if (titleMatch && titleMatch[1] && titleMatch[2]) {
        squadData.team1.name = squadData.team1.name || titleMatch[1].trim();
        squadData.team2.name = squadData.team2.name || titleMatch[2].trim();
        return true;
      }
      
      return false;
    };
    
    // Try to get team names
    extractTeamNames($);
    
    // Try to extract team flags directly from the HTML
    extractTeamFlags($, squadData);
    
    // Check if we have a squads tab and follow it if needed
    const squadsTabLink = $('a.cb-nav-tab:contains("Squads")').attr('href');
    if (squadsTabLink && !successUrl.includes('squads')) {
      try {
        console.log(`Found squads tab link: ${squadsTabLink}`);
        const squadsUrl = `https://www.cricbuzz.com${squadsTabLink}`;
        const squadsResponse = await axios.get(squadsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 8000
        });
        
        // Create a new cheerio instance with the squads page content
        const $squads = cheerio.load(squadsResponse.data);
        console.log("Successfully loaded squads page");
        
        // Try to extract team names again
        extractTeamNames($squads);
        
        // Extract squad data using the squad-specific page
        if (extractFromSquadPage($squads, squadData)) {
          console.log("Successfully extracted squad data from squads tab");
          return squadData; // Return early if successful
        }
      } catch (error) {
        console.log(`Failed to fetch squads page: ${error.message}`);
      }
    }
    
    // Try multiple selectors for playing XI
    // First, check if we're on a squad-specific page
    const isSquadPage = $('.cb-col-50.cb-play11-lft-col').length > 0 || $('.cb-sq-lft-col').length > 0;
    
    if (isSquadPage) {
      // Extract using squad page selectors
      if (extractFromSquadPage($, squadData)) {
        console.log("Successfully extracted squad data from main page");
      }
    } else {
      // Try extracting from scorecard page
      if (extractFromScorecardPage($, squadData)) {
        console.log("Successfully extracted squad data from scorecard");
      }
    }
    
    // Only return squad data if we have at least some player information
    if (squadData.team1.playingXI.length > 0 || squadData.team2.playingXI.length > 0) {
      return squadData;
    }
    
    // If no squads found but we have team names, return basic structure
    if (squadData.team1.name && squadData.team2.name) {
      return {
        team1: {
          name: squadData.team1.name,
          flagUrl: squadData.team1.flagUrl,
          playingXI: [],
          substitutes: [],
          bench: []
        },
        team2: {
          name: squadData.team2.name,
          flagUrl: squadData.team2.flagUrl,
          playingXI: [],
          substitutes: [],
          bench: []
        }
      };
    }
    
    console.log('No player data found in the HTML content');
    return null;
  } catch (error) {
    console.error('Error extracting squad data:', error.message);
    return null;
  }
};

/**
 * Extract team flags from the HTML
 * @param {Object} $ - Cheerio instance
 * @param {Object} squadData - Squad data structure to update with flags
 */
const extractTeamFlags = ($, squadData) => {
  // First specifically target the teams header with team1 and team2 classes as shown in the example
  const team1Flag = $('.cb-teams-hdr .cb-team1 img').attr('src');
  const team2Flag = $('.cb-teams-hdr .cb-team2 img').attr('src');
  
  if (team1Flag) {
    squadData.team1.flagUrl = team1Flag;
  }
  
  if (team2Flag) {
    squadData.team2.flagUrl = team2Flag;
  }
  
  // If both flags found from the teams header, return early
  if (squadData.team1.flagUrl && squadData.team2.flagUrl) {
    return;
  }
  
  // First prioritize finding exact flag pattern format
  $('img').each((idx, elem) => {
    const imgUrl = $(elem).attr('src');
    // Look for exact pattern like: https://static.cricbuzz.com/a/img/v1/72x54/i1/c225643/team_flag.jpg
    if (imgUrl && imgUrl.includes('/i1/c') && imgUrl.includes('team_flag.jpg')) {
      const teamSection = $(elem).closest('.cb-col-50');
      
      // Check if we can determine the team directly from the section
      if (teamSection.hasClass('cb-play11-lft-col') || $(elem).closest('.cb-sq-lft-col').length > 0) {
        squadData.team1.flagUrl = imgUrl;
      } else if (teamSection.hasClass('cb-play11-rt-col') || $(elem).closest('.cb-sq-rgt-col').length > 0) {
        squadData.team2.flagUrl = imgUrl;
      } else {
        // If we can't determine which team by position, assign by order
        if (!squadData.team1.flagUrl) {
          squadData.team1.flagUrl = imgUrl;
        } else if (!squadData.team2.flagUrl) {
          squadData.team2.flagUrl = imgUrl;
        }
      }
    }
  });
  
  // If both flags found, return early
  if (squadData.team1.flagUrl && squadData.team2.flagUrl) {
    return;
  }
  
  // Try any image with "team_flag.jpg" in URL
  $('img').each((idx, elem) => {
    const imgUrl = $(elem).attr('src');
    if (imgUrl && imgUrl.includes('team_flag.jpg') && 
        ((squadData.team1.flagUrl === '' && idx === 0) || 
         (squadData.team2.flagUrl === '' && idx === 1) ||
         (squadData.team1.flagUrl === '' && squadData.team2.flagUrl !== '' && imgUrl !== squadData.team2.flagUrl) ||
         (squadData.team2.flagUrl === '' && squadData.team1.flagUrl !== '' && imgUrl !== squadData.team1.flagUrl))) {
      
      if (!squadData.team1.flagUrl) {
        squadData.team1.flagUrl = imgUrl;
      } else if (!squadData.team2.flagUrl) {
        squadData.team2.flagUrl = imgUrl;
      }
    }
  });
  
  // Try looking in specific containers for team flags
  if (!squadData.team1.flagUrl || !squadData.team2.flagUrl) {
    $('.cb-team-flag-img img, .cb-flag-img img, .cb-sqd-hdr-img img').each((idx, elem) => {
      const imgUrl = $(elem).attr('src');
      if (imgUrl && (imgUrl.includes('team_flag') || imgUrl.includes('/i1/c'))) {
        if (!squadData.team1.flagUrl) {
          squadData.team1.flagUrl = imgUrl;
        } else if (!squadData.team2.flagUrl && imgUrl !== squadData.team1.flagUrl) {
          squadData.team2.flagUrl = imgUrl;
        }
      }
    });
  }
  
  // Try alternate selectors if flags not found
  if (!squadData.team1.flagUrl || !squadData.team2.flagUrl) {
    $('.cb-sq-lft-col img, .cb-sq-rgt-col img').each((idx, elem) => {
      const imgUrl = $(elem).attr('src');
      if (imgUrl && (imgUrl.includes('flags') || imgUrl.includes('team_flag') || imgUrl.includes('/i1/c'))) {
        if (!squadData.team1.flagUrl) {
          squadData.team1.flagUrl = imgUrl;
        } else if (!squadData.team2.flagUrl && imgUrl !== squadData.team1.flagUrl) {
          squadData.team2.flagUrl = imgUrl;
        }
      }
    });
  }
  
  // Final fallback - check for specific dimensions or patterns
  if (!squadData.team1.flagUrl || !squadData.team2.flagUrl) {
    $('img').each((idx, elem) => {
      const imgUrl = $(elem).attr('src');
      // Check for images with specific dimensions often used for flags (72x54 or 45x30)
      if (imgUrl && ((imgUrl.includes('72x54') || imgUrl.includes('45x30')) || 
                     (imgUrl.includes('/i1/c') && imgUrl.includes('flag')))) {
        if (!squadData.team1.flagUrl) {
          squadData.team1.flagUrl = imgUrl;
        } else if (!squadData.team2.flagUrl && imgUrl !== squadData.team1.flagUrl) {
          squadData.team2.flagUrl = imgUrl;
        }
      }
    });
  }
};

/**
 * Extract squad data from a dedicated squad page
 * @returns {Boolean} - True if we were able to extract any players
 */
const extractFromSquadPage = ($, squadData) => {
  let foundPlayers = false;
  // First try standard squad page layout
  const leftColExists = $('.cb-col-50.cb-play11-lft-col').length > 0;
  const rightColExists = $('.cb-col-50.cb-play11-rt-col').length > 0;
  
  if (leftColExists) {
    // Extract playing XI for team 1 (left column)
    $('.cb-col-50.cb-play11-lft-col .cb-player-card-left, .cb-col-50.cb-play11-lft-col .cb-sq-plyr-cn').each((i, elem) => {
      const playerElem = $(elem);
      const playerName = playerElem.find('.cb-player-name-left, .cb-sq-plyr-name').text().trim();
      
      if (!playerName) return;
      
      foundPlayers = true;
      
      // Get player image URL if available
      let imageUrl = '';
      const imgElem = playerElem.find('img');
      if (imgElem.length > 0) {
        imageUrl = imgElem.attr('src') || '';
      }
      
      // Extract role separately
      const roleName = playerElem.find('.cb-font-12').text().trim() || 'Player';
      
      // Clean up player name - remove captain, wicketkeeper AND role designations
      let cleanName = playerName
        .replace(/\s*\([Cc]\)\s*/, '')
        .replace(/\s*\([Ww][Kk]\)\s*/, '')
        .replace(/\s*\([^\)]+\)\s*/g, '') // Remove any text in parentheses (including roles)
        .replace(/\s+/g, ' ')
        .trim();
      
      // Fix name when role is appended to the name (like "Faf du PlessisBatter")
      if (cleanName.endsWith(roleName) && roleName !== 'Player') {
        cleanName = cleanName.substring(0, cleanName.length - roleName.length).trim();
      }
      
      const playerInfo = {
        name: cleanName,
        isCaptain: playerName.includes('(C)') || playerName.includes('(c)'),
        role: roleName,
        imageUrl: imageUrl
      };
      
      // Check if this is in the XI or a substitute
      if (i < 11) {
        squadData.team1.playingXI.push(playerInfo);
      } else if (playerElem.hasClass('cb-bg-player-out') || playerElem.hasClass('cb-sq-plyr-sub')) {
        squadData.team1.substitutes.push(playerInfo);
      } else {
        squadData.team1.bench.push(playerInfo);
      }
    });
  }
  
  if (rightColExists) {
    // Extract playing XI for team 2 (right column)
    $('.cb-col-50.cb-play11-rt-col .cb-player-card-right, .cb-col-50.cb-play11-rt-col .cb-sq-plyr-cn').each((i, elem) => {
      const playerElem = $(elem);
      const playerName = playerElem.find('.cb-player-name-right, .cb-sq-plyr-name').text().trim();
      
      if (!playerName) return;
      
      foundPlayers = true;
      
      // Get player image URL if available
      let imageUrl = '';
      const imgElem = playerElem.find('img');
      if (imgElem.length > 0) {
        imageUrl = imgElem.attr('src') || '';
      }
      
      // Extract role separately
      const roleName = playerElem.find('.cb-font-12').text().trim() || 'Player';
      
      // Clean up player name - remove captain, wicketkeeper AND role designations
      let cleanName = playerName
        .replace(/\s*\([Cc]\)\s*/, '')
        .replace(/\s*\([Ww][Kk]\)\s*/, '')
        .replace(/\s*\([^\)]+\)\s*/g, '') // Remove any text in parentheses (including roles)
        .replace(/\s+/g, ' ')
        .trim();
      
      // Fix name when role is appended to the name (like "Faf du PlessisBatter")
      if (cleanName.endsWith(roleName) && roleName !== 'Player') {
        cleanName = cleanName.substring(0, cleanName.length - roleName.length).trim();
      }
      
      const playerInfo = {
        name: cleanName,
        isCaptain: playerName.includes('(C)') || playerName.includes('(c)'),
        role: roleName,
        imageUrl: imageUrl
      };
      
      // Check if this is in the XI or a substitute
      if (i < 11) {
        squadData.team2.playingXI.push(playerInfo);
      } else if (playerElem.hasClass('cb-bg-player-out') || playerElem.hasClass('cb-sq-plyr-sub')) {
        squadData.team2.substitutes.push(playerInfo);
      } else {
        squadData.team2.bench.push(playerInfo);
      }
    });
  }
  
  // Try alternative squad page layout
  if (!foundPlayers) {
    // Try the team squad boxes
    $('.cb-minfo-tm-nm').each((teamIdx, teamElem) => {
      const teamName = $(teamElem).text().trim();
      const teamKey = teamIdx === 0 ? 'team1' : 'team2';
      
      // Set team name if found
      if (teamName && !squadData[teamKey].name) {
        squadData[teamKey].name = teamName;
      }
      
      // Find player list for this team
      const playerList = $(teamElem).closest('.cb-col-67').find('.cb-col-50 a');
      playerList.each((i, elem) => {
        // Fix: Use a different variable name to avoid redeclaration
        const $playerElem = $(elem);
        const playerName = $playerElem.text().trim();
        
        if (playerName) {
          foundPlayers = true;
          
          // Get player image URL if available
          let imageUrl = '';
          const imgElem = $playerElem.find('img');
          if (imgElem.length > 0) {
            imageUrl = imgElem.attr('src') || '';
          }
          
          // Try to determine role if possible
          let roleName = 'Player';
          const roleElem = $playerElem.find('.cb-font-12');
          if (roleElem.length > 0) {
            roleName = roleElem.text().trim() || 'Player';
          }
          
          // Clean up player name - remove captain, wicketkeeper AND role designations
          let cleanName = playerName
            .replace(/\s*\([Cc]\)\s*/, '')
            .replace(/\s*\([Ww][Kk]\)\s*/, '')
            .replace(/\s*\([^\)]+\)\s*/g, '') // Remove any text in parentheses (including roles)
            .replace(/\s+/g, ' ')
            .trim();
          
          // Fix name when role is appended to the name (like "Faf du PlessisBatter")
          if (cleanName.endsWith(roleName) && roleName !== 'Player') {
            cleanName = cleanName.substring(0, cleanName.length - roleName.length).trim();
          }
          
          const playerInfo = {
            name: cleanName,
            isCaptain: playerName.includes('(C)') || playerName.includes('(c)'),
            role: roleName,
            imageUrl: imageUrl
          };
          
          // Add to playing XI (we don't know subs in this view)
          squadData[teamKey].playingXI.push(playerInfo);
        }
      });
    });
  }
  
  return foundPlayers;
};

/**
 * Extract squad data from a scorecard page
 * @returns {Boolean} - True if we were able to extract any players
 */
const extractFromScorecardPage = ($, squadData) => {
  let foundPlayers = false;
  // Try to find team names and players from the scorecard
  let currentTeam = null;
  
  // Process each innings section
  $('.cb-col-100.cb-scrd-itms').each((i, elem) => {
    const headerText = $(elem).find('.cb-scrd-hdr-rw').text().trim();
    
    // Determine which team's innings this is
    if (headerText.includes('Innings')) {
      // Extract team name from header
      const teamName = headerText.replace('Innings', '').trim();
      currentTeam = (i === 0) ? 'team1' : 'team2';
      
      // Set the team name if not already set
      if (!squadData[currentTeam].name) {
        squadData[currentTeam].name = teamName;
      }
    }
    
    // Extract batsmen for the current team
    if (currentTeam) {
      $(elem).find('.cb-col-27.cb-col').each((j, player) => {
        const playerElem = $(player);
        const playerName = playerElem.text().trim();
        
        if (playerName && !playerName.includes('Did not bat') && 
            !playerName.includes('Extras') && !playerName.includes('Total')) {
          
          foundPlayers = true;
          
          // Clean up player name - remove captain, wicketkeeper AND role designations
          const cleanName = playerName
            .replace(/\s*\([Cc]\)\s*/, '')
            .replace(/\s*\([Ww][Kk]\)\s*/, '')
            .replace(/\s*\([^\)]+\)\s*/g, '') // Remove any text in parentheses (including roles)
            .replace(/\s+/g, ' ')
            .trim();
          
          const playerInfo = {
            name: cleanName,
            isCaptain: playerName.includes('(c)') || playerName.includes('(C)'),
            role: 'Player',
            imageUrl: '' // Scorecard pages typically don't have player images
          };
          
          if (!squadData[currentTeam].playingXI.some(p => p.name === playerInfo.name)) {
            squadData[currentTeam].playingXI.push(playerInfo);
          }
        }
      });
    }
  });
  
  // Also try to extract from bowling tables
  $('.cb-col-100.cb-scrd-itms-bwl').each((i, elem) => {
    // Assuming bowling tables alternate between teams
    currentTeam = (i === 0) ? 'team2' : 'team1';
    
    $(elem).find('.cb-col-40.cb-col').each((j, player) => {
      const playerElem = $(player);
      const playerName = playerElem.text().trim();
      
      if (playerName) {
        foundPlayers = true;
        
        // Clean up player name - remove captain, wicketkeeper AND role designations
        const cleanName = playerName
          .replace(/\s*\([Cc]\)\s*/, '')
          .replace(/\s*\([Ww][Kk]\)\s*/, '')
          .replace(/\s*\([^\)]+\)\s*/g, '') // Remove any text in parentheses (including roles)
          .replace(/\s+/g, ' ')
          .trim();
        
        const playerInfo = {
          name: cleanName,
          isCaptain: playerName.includes('(c)') || playerName.includes('(C)'),
          role: 'Bowler',
          imageUrl: '' // Scorecard pages typically don't have player images
        };
        
        if (!squadData[currentTeam].playingXI.some(p => p.name === playerInfo.name)) {
          squadData[currentTeam].playingXI.push(playerInfo);
        }
      }
    });
  });
  
  return foundPlayers;
};

module.exports = {
  extractSquadData
};
