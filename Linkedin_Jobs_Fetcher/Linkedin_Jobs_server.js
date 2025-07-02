// server.js — LinkedIn Jobs API Server
const express = require('express')
const linkedIn = require('linkedin-jobs-api')
const app = express()
const port = 3000

app.get('/jobs', async (req, res) => {
  const queryOptions = {
    keyword: req.query.keyword || 'software engineer',
    location: req.query.location || 'India',
    limit: req.query.limit || '25', // now dynamic
    page: req.query.page || '0', // new page param
    dateSincePosted: 'past Week',
    jobType: 'full time',
    remoteFilter: 'remote',
  }

  try {
    console.log(
      `🔍 Fetching LinkedIn jobs → Page: ${queryOptions.page}, Limit: ${queryOptions.limit}`
    )
    const jobs = await linkedIn.query(queryOptions)
    res.json(jobs)
  } catch (err) {
    console.error('❌ LinkedIn Query Failed:', err)
    res.status(500).send({ error: err.toString() })
  }
})

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`)
})
