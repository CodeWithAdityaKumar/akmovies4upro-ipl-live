const axios = require('axios');
const cheerio = require('cheerio');

const extractDetailedCommentary = async ($, matchInfo, matchPath) => {
  // Extract detailed commentary if available
  try {
    // First try to extract commentary directly from the current page
    const commentaryElements = $('.cb-com-ln');
    const comments = [];
    
    if (commentaryElements.length > 0) {
      commentaryElements.each((i, elem) => {
        const overDiv = $(elem).parent().find('.cb-ovr-num');
        const overNumber = overDiv.length > 0 ? overDiv.text().trim() : '';
        const commentText = $(elem).text().trim();
        
        if (commentText && !commentText.includes('ADVERTISEMENT')) {
          comments.push({
            over: overNumber || '',
            text: commentText
          });
        }
      });
      
      if (comments.length > 0) {
        matchInfo.commentary = comments;
        return;
      }
    }
    
    // If no commentary found on current page, try to get it from API
    const commentaryLink = `/api/html/cricket-commentary/${matchPath}`;
    const commentaryLinkExists = $('a[href*="commentary"]').length > 0;
    
    if (commentaryLinkExists) {
      try {
        // Fetch the commentary page
        const commentaryResponse = await axios.get(`https://www.cricbuzz.com${commentaryLink}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        // Parse the commentary HTML
        const $commentary = cheerio.load(commentaryResponse.data);
        
        // Extract each commentary item with over number if available
        $commentary('.cb-col.cb-col-100').each((i, elem) => {
          const overDiv = $commentary(elem).find('.cb-ovr-num');
          const overNumber = overDiv.length > 0 ? overDiv.text().trim() : '';
          const commentText = $commentary(elem).find('.cb-com-ln').text().trim();
          
          if (commentText && !commentText.includes('ADVERTISEMENT')) {
            comments.push({
              over: overNumber || '',
              text: commentText
            });
          }
        });
        
        if (comments.length > 0) {
          matchInfo.commentary = comments;
        }
      } catch (commError) {
        console.log('Failed to fetch commentary page:', commError.message);
        
        // Try one more fallback method - full commentary link
        try {
          const fullCommentaryLink = `/live-cricket-full-commentary/${matchPath.split('/').pop()}`;
          const fullCommResponse = await axios.get(`https://www.cricbuzz.com${fullCommentaryLink}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          const $fullComm = cheerio.load(fullCommResponse.data);
          
          $fullComm('.cb-col.cb-col-100').each((i, elem) => {
            const overDiv = $fullComm(elem).find('.cb-ovr-num');
            const overNumber = overDiv.length > 0 ? overDiv.text().trim() : '';
            const commentText = $fullComm(elem).find('.cb-com-ln').text().trim();
            
            if (commentText && !commentText.includes('ADVERTISEMENT')) {
              comments.push({
                over: overNumber || '',
                text: commentText
              });
            }
          });
          
          if (comments.length > 0) {
            matchInfo.commentary = comments;
          }
        } catch (fullCommError) {
          console.log('Failed to fetch full commentary:', fullCommError.message);
        }
      }
    }
  } catch (error) {
    console.log('Failed to extract detailed commentary:', error.message);
  }
};

module.exports = {
  extractDetailedCommentary
};