const extractTeamsAndScores = ($, matchInfo, htmlData, teams) => {
  // First extract full team names from the <title> element
  const titleText = $('title').text().trim();
  if (titleText) {
    const vsMatch = titleText.match(/(.+?)\s+(?:v|vs|VS)\s+(.+?)(?:,|$)/);
    if (vsMatch && vsMatch[1] && vsMatch[2]) {
      const team1 = vsMatch[1].trim();
      const team2 = vsMatch[2].trim();
      
      if (team1.length > 1 && !teams.includes(team1)) {
        teams.push(team1);
      }
      if (team2.length > 1 && !teams.includes(team2)) {
        teams.push(team2);
      }
    }
  }
  
  // Extract team abbreviations and scores from mini-scorecard (most reliable)
  const teamScores = {};
  $('.cb-min-tm').each((i, elem) => {
    const text = $(elem).text().trim();
    const scoreMatch = text.match(/^([A-Za-z]+)\s+(\d+\/\d+.*)/);
    if (scoreMatch && scoreMatch[1] && scoreMatch[2]) {
      const teamAbbr = scoreMatch[1].trim();
      const score = scoreMatch[2].trim();
      teamScores[teamAbbr] = score;
      
      // Try to find the corresponding full team name
      for (const team of teams) {
        if (team.includes(teamAbbr) || teamAbbr.includes(team.substring(0, 3))) {
          matchInfo.scores[team] = score;
        }
      }
    }
  });
  
  // If we can identify a team from the match status, add it
  const status = $('.cb-min-stts').text().trim();
  const wonMatch = status.match(/([A-Za-z\s]+)\s+won by/);
  if (wonMatch && wonMatch[1]) {
    const winningTeam = wonMatch[1].trim();
    if (!teams.includes(winningTeam) && winningTeam.length > 1) {
      teams.push(winningTeam);
    }
  }

  // Extract from the navigation subheader which often contains "Team1 vs Team2"
  const subheaderText = $('.cb-nav-subhdr').text().trim();
  if (subheaderText && teams.length < 2) {
    const vsMatch = subheaderText.match(/([A-Za-z\s]+)\s+vs\s+([A-Za-z\s]+)/);
    if (vsMatch && vsMatch[1] && vsMatch[2]) {
      if (!teams.includes(vsMatch[1].trim())) {
        teams.push(vsMatch[1].trim());
      }
      if (!teams.includes(vsMatch[2].trim())) {
        teams.push(vsMatch[2].trim());
      }
    }
  }
  
  // Extract from H1 heading which usually contains full team names
  const headingText = $('.cb-nav-hdr').text().trim();
  if (headingText && teams.length < 2) {
    const vsMatch = headingText.match(/([A-Za-z\s]+)\s+(?:v|vs|VS)\s+([A-Za-z\s]+)/);
    if (vsMatch && vsMatch[1] && vsMatch[2]) {
      if (!teams.includes(vsMatch[1].trim())) {
        teams.push(vsMatch[1].trim());
      }
      if (!teams.includes(vsMatch[2].trim())) {
        teams.push(vsMatch[2].trim());
      }
    }
  }

  // Try to extract from scoreboard headers
  if (teams.length < 2) {
    $('.cb-scrd-itms').each((i, elem) => {
      const teamName = $(elem).find('.cb-scrd-hdr-rw').text().trim();
      if (teamName && !teamName.includes('Extras') && !teamName.includes('Total') && !teams.includes(teamName)) {
        teams.push(teamName);
      }
    });
  }

  // Try to extract from team batting/bowling sections
  if (teams.length < 2) {
    $('.cb-col-100.cb-scrd-sub-hdr').each((i, elem) => {
      const subHeader = $(elem).text().trim();
      if (subHeader.includes('Batting') || subHeader.includes('Bowling')) {
        const teamMatches = subHeader.match(/(.*?)(?:Batting|Bowling)/);
        if (teamMatches && teamMatches[1] && !teams.includes(teamMatches[1].trim())) {
          teams.push(teamMatches[1].trim());
        }
      }
    });
  }

  // If we still don't have team names, extract from meta description
  if (teams.length < 2) {
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc) {
      const vsMatch = metaDesc.match(/(.+?)\s+(?:v|vs|VS)\s+(.+?)(?:,|$)/);
      if (vsMatch && vsMatch[1] && vsMatch[2]) {
        if (!teams.includes(vsMatch[1].trim())) {
          teams.push(vsMatch[1].trim());
        }
        if (!teams.includes(vsMatch[2].trim())) {
          teams.push(vsMatch[2].trim());
        }
      }
    }
  }

  // Fallback to simple regex extraction from the HTML
  if (teams.length < 2) {
    const vsRegex = /([A-Za-z\s]+)\s+(?:v|vs|VS)\s+([A-Za-z\s]+)/g;
    const matches = htmlData.match(vsRegex);
    if (matches && matches.length > 0) {
      for (let match of matches) {
        const vsMatch = match.match(/([A-Za-z\s]+)\s+(?:v|vs|VS)\s+([A-Za-z\s]+)/);
        if (vsMatch && vsMatch[1] && vsMatch[2]) {
          if (!teams.includes(vsMatch[1].trim()) && vsMatch[1].trim().length > 1) {
            teams.push(vsMatch[1].trim());
          }
          if (!teams.includes(vsMatch[2].trim()) && vsMatch[2].trim().length > 1) {
            teams.push(vsMatch[2].trim());
          }
          if (teams.length >= 2) break;
        }
      }
    }
  }

  // Ensure we have at least two teams
  if (teams.length < 2) {
    if (teams.length === 0) {
      teams.push("Team 1", "Team 2");
    } else {
      teams.push("Opponent");
    }
  }

  // Now apply any scores from abbreviated teams to full team names
  Object.keys(teamScores).forEach(abbr => {
    const score = teamScores[abbr];
    // Find the matching full team name
    for (const team of teams) {
      if (team.includes(abbr) || abbr.includes(team.substring(0, 3))) {
        matchInfo.scores[team] = score;
      }
    }
  });

  // If scores are still empty, try the legacy extraction methods
  if (Object.keys(matchInfo.scores).length === 0) {
    extractScores($, matchInfo, teams);
  }
};

const extractScores = ($, matchInfo, teams) => {
  // First try to extract from the mini-scorecard section
  $('.cb-min-bat-rw').each((i, elem) => {
    const team = $(elem).find('.cb-min-itm-rw').text().trim();
    const score = $(elem).find('.cb-min-itm-rw').next().text().trim();
    if (team && score && !matchInfo.scores[team]) {
      matchInfo.scores[team] = score;
    }
  });

  // Try alternative selectors for scorecards
  if (Object.keys(matchInfo.scores).length === 0) {
    $('.cb-lv-scrs-col').each((i, elem) => {
      const team = $(elem).find('.cb-lv-scrs-well-live').text().trim();
      const score = $(elem).find('.cb-lv-scrs-well-live').siblings().text().trim();
      if (team && score && !matchInfo.scores[team]) {
        matchInfo.scores[team] = score;
      }
    });
  }

  // Extract from innings headers in scorecard
  if (Object.keys(matchInfo.scores).length === 0) {
    $('.cb-scrd-hdr-rw').each((i, elem) => {
      const inningsText = $(elem).text().trim();
      if (inningsText && !inningsText.includes('Extras') && !inningsText.includes('Total')) {
        // Extract team name and score (removing "Innings" text if present)
        const parts = inningsText.split('Innings');
        const team = parts[0].trim();
        
        // Find the total score for this innings
        const scoreRow = $(elem).parent().find('.cb-scrd-itms:contains("Total")');
        if (scoreRow.length) {
          const score = scoreRow.find('.cb-scrd-itms-rgt').text().trim();
          if (team && score && !matchInfo.scores[team]) {
            matchInfo.scores[team] = score;
          }
        }
      }
    });
  }
};

module.exports = {
  extractTeamsAndScores,
  extractScores
};