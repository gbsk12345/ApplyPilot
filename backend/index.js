// index.js
// 1) Ensure Sharp uses the correct ARM64 libvips on Apple Silicon
try {
  require('@img/sharp-libvips-darwin-arm64');
} catch (e) {
  // package may not be installed; ignore if so
}

// 2) Load environment variables and dependencies
require('dotenv').config();
const express = require('express');
const { applyToJob } = require('./services/autoApply');

const app = express();
app.use(express.json()); // built-in JSON parser

app.post('/api/apply', async (req, res) => {
  const { jobUrl, userData } = req.body;
  if (!jobUrl || !userData) {
    return res.status(400).json({ error: 'Missing jobUrl or userData' });
  }
  try {
    await applyToJob(jobUrl, userData);
    res.json({ success: true });
  } catch (err) {
    console.error('applyToJob error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
