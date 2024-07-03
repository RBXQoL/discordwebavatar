const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env file

// Load configuration
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const app = express();

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Function to update profile pictures
async function updateProfilePictures() {
  for (const userId of config.userIds) {
    try {
      const user = await client.users.fetch(userId);
      const avatarUrl = user.displayAvatarURL({ format: 'png', size: 256 });
      const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(path.join(__dirname, 'public', `${userId}.png`), response.data);
      console.log(`Updated profile picture for user ${userId}`);
    } catch (error) {
      console.error(`Error updating profile picture for user ${userId}:`, error);
    }
  }
}

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Instructions</title></head>
      <body>
        <p>To add IDs, go to <code>config.json</code>.</p>
        <p>To view images, go to <code>/profile-pics</code>.</p>
        <br>
        <p style="font-weight: bold; font-size: 0.9em;">Project by Mapler from <a href="https://github.com/rbxqol/discordwebavatar">RBXQoL</a></p>
      </body>
    </html>
  `);
});

// Route to get all profile picture URLs
app.get('/profile-pics', (req, res) => {
  const pics = config.userIds.map(userId => ({
    userId,
    url: `${req.protocol}://${req.get('host')}/${userId}.png`
  }));
  res.json(pics);
});

// Start the Express server
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

// Discord bot login and initialization
client.once('ready', () => {
  console.log('Discord bot is ready');
  updateProfilePictures();
  setInterval(updateProfilePictures, 30 * 60 * 1000); // Update every 30 minutes
});

client.login(process.env.DISCORD_TOKEN); 