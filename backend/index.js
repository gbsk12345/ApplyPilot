const express = require('express')
const cors = require('cors')
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' })
})

const applyRoute = require('./routes/apply');
app.use('/api', applyRoute);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})
