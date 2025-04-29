const express = require('express');
const { applyToJob } = require('../services/autoApply');
const router = express.Router();

router.post('/apply', async (req, res) => {
  const { jobUrl, userData } = req.body;
  try {
    await applyToJob(jobUrl, userData);
    res.send({ success: true });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

module.exports = router;

