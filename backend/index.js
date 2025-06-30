// index.js

// 1) Ensure Sharp uses the correct ARM64 libvips on Apple Silicon
// This is a good practice for ensuring cross-platform compatibility, especially for image processing.
try {
  require('@img/sharp-libvips-darwin-arm64');
} catch (e) {
  // The package may not be installed in all environments; we can safely ignore this if it fails.
}

// 2) Load environment variables and dependencies
require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Import the cors middleware
const { URL } = require('url'); // Using the native URL module for robust parsing

// Import the specific application services for each job platform
const { applyToJob } = require('./services/autoApply'); // Assumed to be for Greenhouse
const { applyToLeverJob } = require('./services/leverApply');
const { applyToSmartRecruiters } = require('./services/autoApplySmartRecruiters');

// --- Express App Setup ---
const app = express();

// --- Middleware ---
// Add the cors middleware to allow cross-origin requests.
// Make sure to install it first by running: npm install cors
app.use(cors()); 
app.use(express.json()); // Middleware to parse JSON request bodies

// --- Unified API Endpoint for Job Applications ---
app.post('/api/apply', async (req, res) => {
  const { jobUrl, userData } = req.body;


  try {
    // Use the URL object to reliably parse the hostname from the jobUrl
    const parsedUrl = new URL(jobUrl);
    const hostname = parsedUrl.hostname;

    console.log(`Processing application for URL: ${jobUrl}`);
    console.log(`Detected hostname: ${hostname}`);

    // --- Routing Logic ---
    // Check the hostname to determine which application service to use.
    // This is more reliable than using string.includes() on the whole URL.
    if (hostname.includes('greenhouse.io')) {
      console.log('Routing to Greenhouse application service.');
      await applyToJob(jobUrl, userData);
      res.json({ success: true, message: 'Successfully applied to Greenhouse job.' });

    } else if (hostname.includes('lever.co')) {
      console.log('Routing to Lever application service.');
      await applyToLeverJob(jobUrl, userData);
      res.json({ success: true, message: 'Successfully applied to Lever job.' });

    } else if (hostname.includes('smartrecruiters.com')) {
      console.log('Routing to SmartRecruiters application service.');
      await applyToSmartRecruiters(jobUrl, userData);
      res.json({ success: true, message: 'Successfully applied to SmartRecruiters job.' });

    } else {
      // If the URL doesn't match any supported platform, return an error.
      console.warn(`Unsupported job platform for hostname: ${hostname}`);
      return res.status(400).json({ 
        success: false, 
        error: `The job platform for ${hostname} is not supported.` 
      });
    }
  } catch (err) {
    // Centralized error handling for all application services
    // The 'err' object could be an error from URL parsing or from one of the applyTo... functions.
    console.error(`Error during application process for ${jobUrl}:`, err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'An internal server error occurred during the application process.' 
    });
  }
});

// --- Server Initialization ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server is running and listening on port ${PORT}`));
