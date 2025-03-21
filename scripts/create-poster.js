const fs = require('fs');
const { createCanvas } = require('canvas');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret',
  secure: true
});

/**
 * Creates a match poster and uploads it to Cloudinary
 * @param {Object} matchData - Match data object
 * @param {Object} matchData.team1 - Team 1 info
 * @param {Object} matchData.team2 - Team 2 info
 * @param {string} matchData.id - Match ID
 * @param {string} matchData.match_date - Match date
 * @param {string} matchData.venue - Venue location
 * @param {boolean} isLive - Whether the match is currently live
 * @returns {Promise<string>} - URL of the uploaded poster
 */
async function createMatchPoster(matchData, isLive = false) {
  const width = 1280;
  const height = 720;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0a2556');  // Dark blue
  gradient.addColorStop(1, '#162240');  // Navy blue
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add match title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${matchData.team1.name} vs ${matchData.team2.name}`, width / 2, height / 2 - 50);

  // Add live indicator if match is live
  if (isLive) {
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#ff4d4d';
    ctx.fillText('LIVE', width / 2, height / 2 + 30);
  }

  // Add match details
  ctx.font = '24px Arial';
  ctx.fillStyle = 'white';
  const matchDate = new Date(matchData.match_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  ctx.fillText(`Match ${matchData.id.slice(0, 8)} • ${matchDate}`, width / 2, height / 2 + 80);
  ctx.fillText(matchData.venue, width / 2, height / 2 + 120);

  // Convert canvas to buffer
  const buffer = canvas.toBuffer('image/jpeg');
  
  // Temporarily save file (optional, for local debugging)
  const tempFileName = `./tmp/match-poster-${matchData.id.slice(0, 8)}.jpg`;
  fs.mkdirSync('./tmp', { recursive: true });
  fs.writeFileSync(tempFileName, buffer);
  
  // Upload to Cloudinary
  try {
    const result = await cloudinary.uploader.upload(tempFileName, {
      folder: 'ipl-match-posters',
      public_id: `match-${matchData.id.slice(0, 8)}`,
      overwrite: true
    });
    
    console.log(`Match poster created and uploaded successfully: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  } finally {
    // Cleanup temp file
    if (fs.existsSync(tempFileName)) {
      fs.unlinkSync(tempFileName);
    }
  }
}

// Export for use in API routes and scripts
module.exports = { createMatchPoster };

// If script is run directly, run a test
if (require.main === module) {
  const testMatch = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    team1: { name: 'Mumbai Indians', short_name: 'MI' },
    team2: { name: 'Chennai Super Kings', short_name: 'CSK' },
    match_date: new Date().toISOString(),
    venue: 'Wankhede Stadium, Mumbai'
  };
  
  createMatchPoster(testMatch, true)
    .then(url => console.log('Test poster URL:', url))
    .catch(err => console.error('Test error:', err));
}
