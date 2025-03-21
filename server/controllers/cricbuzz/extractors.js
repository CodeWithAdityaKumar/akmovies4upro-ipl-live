const extractTitle = ($) => {
  // Directly extract from meta tag or title tag for most accurate title
  const metaTitle = $('meta[property="og:title"]').attr('content');
  
  if (metaTitle) {
    return metaTitle.trim();
  }
  
  // Use the title tag as backup
  const pageTitle = $('title').text().trim();
  if (pageTitle) {
    // Extract just the match title part (remove Cricbuzz.com)
    return pageTitle.split('|')[0].trim();
  }
  
  // Fallback options
  return $('h4.cb-list-item').text().trim() || 
         $('.cb-nav-hdr-lg').first().text().trim() || 
         "Match Information";
};

const extractMatchStatus = ($) => {
  return $('.cbz-ui-status').text().trim() || 
         $('.cb-text-live').text().trim() || 
         $('.cb-text-complete').text().trim() ||
         $('.cb-text-inprogress').text().trim() ||
         $('.cb-text-stump').text().trim() ||
         $('.cb-mini-stts .cb-font-16').text().trim() ||
         $('.cb-mtch-crd-state').text().trim();
};

const extractSeries = ($) => {
  // First try to find series name from the meta title
  let seriesName = '';
  const titleText = $('title').text();
  if (titleText) {
    // Extract series name from the title format "Team1 vs Team2, Match Type, Date, Series Name"
    const titleParts = titleText.split(',');
    if (titleParts.length >= 4) {
      seriesName = titleParts[titleParts.length - 1].trim().replace(' | Cricbuzz.com', '');
    }
  }
  
  // If not found in title, check the subheader which often has series information
  if (!seriesName) {
    const subheader = $('.cb-nav-subhdr').text().trim();
    const seriesMatch = subheader.match(/Series:\s*([^,]+)/);
    if (seriesMatch && seriesMatch[1]) {
      seriesName = seriesMatch[1].trim();
    }
  }
  
  // Try the venue-date-time element which often contains series info
  if (!seriesName) {
    const venueText = $('.venue-date-time').text();
    if (venueText && venueText.includes('Series:')) {
      const seriesMatch = venueText.match(/Series:\s*([^,]+)/);
      if (seriesMatch && seriesMatch[1]) {
        seriesName = seriesMatch[1].trim();
      }
    }
  }
  
  // Try extracting from meta description
  if (!seriesName) {
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc && metaDesc.includes('tour of')) {
      const tourMatch = metaDesc.match(/(.*tour of.*),\s*\d{4}/);
      if (tourMatch && tourMatch[1]) {
        seriesName = tourMatch[1].trim();
      }
    }
  }
  
  return seriesName || '';
};

const extractVenue = ($) => {
  // Try the most specific venue extractor first
  let venueText = $('.cb-mtch-info-itm:contains("Venue")').find('.cb-col-60').text().trim();
  
  // If that didn't work, extract from venue-date-time content
  if (!venueText) {
    const venueTimeText = $('.venue-date-time').text().trim();
    if (venueTimeText) {
      // Extract just the venue part
      const venueMatch = venueTimeText.match(/Venue:\s*([^,]+(?:,[^D]+)?)/);
      if (venueMatch && venueMatch[1]) {
        venueText = venueMatch[1].trim();
      }
    }
  }
  
  // Try other selectors if still no venue
  if (!venueText) {
    venueText = $('.cb-nav-subhdr.cb-font-12').text().trim();
  }
  
  // Try to get venue from meta description
  if (!venueText || venueText.includes("Series:")) {
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc && metaDesc.includes('Venue:')) {
      const venueMatch = metaDesc.match(/Venue:\s*([^,]+(?:,[^D]+)?)/);
      if (venueMatch && venueMatch[1]) {
        venueText = venueMatch[1].trim();
      }
    }
  }
  
  // Clean up the venue text - extract just venue if it contains other info
  if (venueText && venueText.includes("Series:")) {
    const cleanVenueMatch = venueText.match(/Venue:\s*([^,]+(?:,[^D]+)?)/);
    if (cleanVenueMatch && cleanVenueMatch[1]) {
      venueText = cleanVenueMatch[1].trim();
    }
  }
  
  return venueText || "Venue not available";
};

const extractMatchDate = ($) => {
  // First try to extract from meta title which usually has the correct format
  const metaTitle = $('meta[property="og:title"]').attr('content');
  if (metaTitle) {
    const dateMatch = metaTitle.match(/\b([A-Z][a-z]{2}\s+\d{1,2})\b/);
    if (dateMatch && dateMatch[1]) {
      return dateMatch[1].trim();
    }
  }
  
  // Next check for date in the title tag
  const titleText = $('title').text().trim();
  if (titleText) {
    // First try direct month day pattern like "Mar 19"
    const dateParts = titleText.match(/\b([A-Z][a-z]{2}\s+\d{1,2})\b/);
    if (dateParts && dateParts[1]) {
      return dateParts[1].trim();
    }
    
    // Try date format with ordinal suffix like "19th Mar"
    const altDateFormat = titleText.match(/(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3})/);
    if (altDateFormat && altDateFormat[1]) {
      return altDateFormat[1].trim();
    }
  }
  
  // Try to find date in the venue-date-time section which is reliable
  const dateTimeSection = $('.cb-nav-subhdr').text().trim();
  if (dateTimeSection) {
    const dateMatch = dateTimeSection.match(/Date & Time:\s*([A-Za-z]+\s+\d{1,2})/i);
    if (dateMatch && dateMatch[1]) {
      return dateMatch[1].trim();
    }
  }
  
  // Try direct extraction from HTML structure
  const dateElement = $('.cb-min-itm-rw:contains("Date")');
  if (dateElement.length) {
    return dateElement.next().text().trim();
  }
  
  // Final fallback - look for script variables in the HTML
  const scriptContent = $('script:contains("matchState")').text();
  const dateVarMatch = scriptContent.match(/var\s+matchDate\s*=\s*["']([^"']+)["']/);
  if (dateVarMatch && dateVarMatch[1]) {
    return dateVarMatch[1].trim();
  }
  
  return "Date not available";
};

const extractMatchTime = ($) => {
  let timeText = '';
  
  // First check for specific time string in venue-date-time section
  const venueTimeText = $('.venue-date-time').text().trim();
  if (venueTimeText) {
    const timeMatch = venueTimeText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)(?:\s*LOCAL)?)/i);
    if (timeMatch && timeMatch[1]) {
      return timeMatch[1].trim();
    }
  }
  
  // Next try the date time item which may include time
  const dateTimeInfo = $('.cb-mtch-info-itm:contains("Date")').find('.cb-col-60').text().trim();
  if (dateTimeInfo) {
    const timeMatch = dateTimeInfo.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm|LOCAL))/i);
    if (timeMatch && timeMatch[1]) {
      return timeMatch[1].trim();
    }
  }
  
  // Try extracting from title or meta description
  const metaDesc = $('meta[name="description"]').attr('content');
  if (metaDesc) {
    const timeMatch = metaDesc.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm|LOCAL))/i);
    if (timeMatch && timeMatch[1]) {
      return timeMatch[1].trim();
    }
  }
  
  return timeText;
};

const extractMatchDetails = ($, matchInfo) => {
  // Extract match info items
  $('.cb-mtch-info-itm').each((i, elem) => {
    const label = $(elem).find('.cb-col.cb-col-40').text().trim();
    const value = $(elem).find('.cb-col.cb-col-60').text().trim();
    
    if (label && value) {
      matchInfo.matchDetails[label] = value;
    }
  });
  
  // Extract toss information
  const tossInfo = $('.cb-toss-sts').text().trim();
  if (tossInfo) {
    matchInfo.matchDetails['Toss'] = tossInfo;
  }
  
  // If no match details were found, try to parse from other sources
  if (Object.keys(matchInfo.matchDetails).length === 0) {
    // Try to extract from venue-date-time section
    const venueTimeText = $('.venue-date-time').text().trim();
    if (venueTimeText) {
      const matches = {
        'Series': venueTimeText.match(/Series:\s*([^,]+)/),
        'Venue': venueTimeText.match(/Venue:\s*([^,]+(?:,[^D]+)?)/),
      };

      Object.keys(matches).forEach(key => {
        if (matches[key] && matches[key][1]) {
          matchInfo.matchDetails[key] = matches[key][1].trim();
        }
      });
    }
    
    // Try to extract from match info in meta description
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc) {
      const venueMatch = metaDesc.match(/Venue:\s*([^,]+)/);
      if (venueMatch && venueMatch[1]) {
        matchInfo.matchDetails['Venue'] = venueMatch[1].trim();
      }
    }
    
    // Try extracting from title
    const titleText = $('title').text();
    if (titleText) {
      const titleParts = titleText.split(',');
      if (titleParts.length >= 3) {
        if (!matchInfo.matchDetails['Match']) {
          matchInfo.matchDetails['Match'] = titleParts[1].trim();
        }
      }
    }
  }
  
  // Extract match number and format from title if not already present
  if (!matchInfo.matchDetails['Match']) {
    const titleMatch = matchInfo.title.match(/(\d+(?:st|nd|rd|th)\s+[^,]+)/);
    if (titleMatch && titleMatch[1]) {
      matchInfo.matchDetails['Match'] = titleMatch[1].trim();
    }
  }
};

const extractPlayerOfTheMatch = ($, matchInfo) => {
  // First look for structured player of the match element
  const momText = $('.cb-mom-itm').text().trim();
  if (momText) {
    matchInfo.playerOfTheMatch = momText;
    return;
  }
  
  // Try alternate location - in page body text
  const pageText = $('body').text();
  const momMatch = pageText.match(/PLAYER\s+OF\s+THE\s+MATCH[\s:\-]+([^\.]+)/i);
  if (momMatch && momMatch[1]) {
    matchInfo.playerOfTheMatch = `PLAYER OF THE MATCH ${momMatch[1].trim()}`;
    return;
  }
  
  // Try another pattern sometimes used
  const momMatch2 = pageText.match(/([A-Za-z\s\.]+)\s+is\s+the\s+Player\s+of\s+the\s+Match/i);
  if (momMatch2 && momMatch2[1]) {
    matchInfo.playerOfTheMatch = `PLAYER OF THE MATCH ${momMatch2[1].trim()}`;
    return;
  }
  
  // Try from meta description
  const metaDesc = $('meta[name="description"]').attr('content');
  if (metaDesc) {
    const metaMomMatch = metaDesc.match(/Player\s+of\s+the\s+Match[\s:\-]+([^\.]+)/i);
    if (metaMomMatch && metaMomMatch[1]) {
      matchInfo.playerOfTheMatch = `PLAYER OF THE MATCH ${metaMomMatch[1].trim()}`;
    }
  }
};

const extractRecentOvers = ($, matchInfo) => {
  const recentOvers = [];
  $('.cb-col.cb-col-100.cb-min-itm.cb-mat-mnu').each((i, elem) => {
    recentOvers.push($(elem).text().trim());
  });
  
  if (recentOvers.length > 0) {
    matchInfo.recentOvers = recentOvers;
  }
};

module.exports = {
  extractTitle,
  extractMatchStatus,
  extractSeries,
  extractVenue,
  extractMatchDate,
  extractMatchTime,
  extractMatchDetails,
  extractPlayerOfTheMatch,
  extractRecentOvers
};