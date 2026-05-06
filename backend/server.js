const express = require('express')
const cors    = require('cors')
const { initDB } = require('./db')

const app = express()
app.use(cors())
app.use(express.json())

// Init + seed database
initDB()

// Routes
app.use('/api/login',           require('./routes/auth'))
app.use('/api/change-password', require('./routes/change-password'))
app.use('/api/flights',    require('./routes/flights'))
app.use('/api/passengers', require('./routes/passengers'))
app.use('/api/baggage',    require('./routes/baggage'))
app.use('/api/staff',      require('./routes/staff'))
app.use('/api/messages',   require('./routes/messages'))

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

const PORT = 3000
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))
