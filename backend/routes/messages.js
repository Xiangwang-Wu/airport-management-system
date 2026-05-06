const express = require('express')
const { db } = require('../db')
const router = express.Router()

// GET /api/messages?flight=AA1024
router.get('/', (req, res) => {
  const { flight } = req.query
  if (flight) {
    return res.json(db.prepare('SELECT * FROM Airline_Message WHERE flight_id = ? ORDER BY created_at DESC').all(flight))
  }
  res.json(db.prepare('SELECT * FROM Airline_Message ORDER BY created_at DESC').all())
})

// POST /api/messages
router.post('/', (req, res) => {
  const { flight_id, sender, recipient, message } = req.body
  if (!flight_id || !sender || !message) {
    return res.status(400).json({ error: 'flight_id, sender, message are required' })
  }
  const info = db.prepare(
    'INSERT INTO Airline_Message(flight_id,sender,recipient,message) VALUES (?,?,?,?)'
  ).run(flight_id, sender, recipient || null, message)
  res.json(db.prepare('SELECT * FROM Airline_Message WHERE message_id = ?').get(info.lastInsertRowid))
})

// GET /api/notifications
router.get('/notifications', (req, res) => {
  res.json(db.prepare('SELECT * FROM Flight_Notification ORDER BY created_at DESC').all())
})

// POST /api/notifications
router.post('/notifications', (req, res) => {
  const { flight_id, gate, is_ready } = req.body
  if (!flight_id || !gate) return res.status(400).json({ error: 'flight_id and gate required' })
  const info = db.prepare(
    'INSERT INTO Flight_Notification(flight_id,gate,is_ready) VALUES (?,?,?)'
  ).run(flight_id, gate, is_ready !== false ? 1 : 0)
  res.json(db.prepare('SELECT * FROM Flight_Notification WHERE notification_id = ?').get(info.lastInsertRowid))
})

module.exports = router
