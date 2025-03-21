// Script to upload IPL 2025 schedule to matches database
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Map of team names to their short names (update these based on your actual teams table)
const teamShortNames = {
  'Kolkata Knight Riders': 'KKR',
  'Royal Challengers Bengaluru': 'RCB',
  'Sunrisers Hyderabad': 'SRH',
  'Rajasthan Royals': 'RR',
  'Chennai Super Kings': 'CSK', 
  'Mumbai Indians': 'MI',
  'Delhi Capitals': 'DC',
  'Lucknow Super Giants': 'LSG',
  'Gujarat Titans': 'GT',
  'Punjab Kings': 'PBKS'
};

// Path to JSON file
const scheduleFile = path.join(__dirname, '../data/ipl2025_schedule.json');

// Base URL for API
const API_URL = 'http://localhost:3000/api/matches';

// Function to convert date and time to ISO format
function formatDateTime(date, time) {
  // Expected format: "2025-03-22", "14:00 GMT"
  // Convert to ISO format: "2025-03-22T14:00:00Z"
  const timeWithoutGMT = time.replace(' GMT', '');
  return `${date}T${timeWithoutGMT}:00Z`;
}

// Function to upload a match
async function uploadMatch(match) {
  try {
    // Convert match data to format expected by API
    const matchData = {
      team1_short_name: teamShortNames[match.team1],
      team2_short_name: teamShortNames[match.team2],
      match_date: formatDateTime(match.date, match.time),
      venue: match.venue,
      status: 'upcoming', // All matches are upcoming
      thumbnail_url: `/images/matches/match${match.match_no}.jpg`, // Optional - update as needed
    };

    console.log(`Uploading match ${match.match_no}: ${match.team1} vs ${match.team2}`);
    
    // POST to API endpoint
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(matchData),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error(`Error uploading match ${match.match_no}:`, result.error);
      return false;
    }
    
    console.log(`Successfully uploaded match ${match.match_no}`);
    return true;
  } catch (error) {
    console.error(`Error uploading match ${match.match_no}:`, error.message);
    return false;
  }
}

// Main function to process all matches
async function uploadAllMatches() {
  try {
    // Read and parse the schedule file
    const scheduleData = JSON.parse(fs.readFileSync(scheduleFile, 'utf8'));
    
    console.log(`Found ${scheduleData.matches.length} matches to upload`);
    
    // Process each match sequentially with a small delay
    let successCount = 0;
    let failureCount = 0;
    
    for (const match of scheduleData.matches) {
      const success = await uploadMatch(match);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Add a small delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('============ Upload Summary ============');
    console.log(`Total matches: ${scheduleData.matches.length}`);
    console.log(`Successfully uploaded: ${successCount}`);
    console.log(`Failed to upload: ${failureCount}`);
    
  } catch (error) {
    console.error('Failed to process schedule file:', error.message);
  }
}

// Run the script
uploadAllMatches().then(() => {
  console.log('Upload process completed');
});
