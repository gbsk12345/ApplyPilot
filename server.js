const express = require('express')
const linkedIn = require('linkedin-jobs-api')
const app = express()
const port = 3000

app.get('/jobs', async (req, res) => {
  const queryOptions = {
    keyword: req.query.keyword || 'software engineer',
    location: req.query.location || 'India',
    limit: '5',
    dateSincePosted: 'past Week',
    jobType: 'full time',
    remoteFilter: 'remote',
  }

  try {
    const jobs = await linkedIn.query(queryOptions)
    res.json(jobs)
  } catch (err) {
    res.status(500).send({ error: err.toString() })
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
