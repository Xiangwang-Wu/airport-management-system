const express = require('express')
const { db } = require('../db')
const router = express.Router()

// GET /api/flights  — all flights (optionally ?airline=XX or ?gate=T1-G12)
router.get('/', (req, res) => {
  const { airline, gate } = req.query
  let sql = 'SELECT * FROM Flight'
  const params = []
  if (airline) { sql += ' WHERE airline_code = ?'; params.push(airline) }
  else if (gate) { sql += ' WHERE gate = ?'; params.push(gate) }
  res.json(db.prepare(sql).all(...params))
})

// GET /api/flights/:id  — single flight
router.get('/:id', (req, res) => {
  const flight = db.prepare('SELECT * FROM Flight WHERE flight_id = ?').get(req.params.id)
  if (!flight) return res.status(404).json({ error: 'Flight not found' })
  res.json(flight)
})

// GET /api/flights/:id/passengers
router.get('/:id/passengers', (req, res) => {
  const passengers = db.prepare('SELECT * FROM Passenger WHERE flight_id = ?').all(req.params.id)
  res.json(passengers)
})

// GET /api/flights/:id/bags
router.get('/:id/bags', (req, res) => {
  const bags = db.prepare('SELECT * FROM Baggage WHERE flight_id = ?').all(req.params.id)
  res.json(bags)
})

// POST /api/flights  — add flight (admin)
router.post('/', (req, res) => {
  const { flight_id, airline_code, gate, destination, status } = req.body
  if (!flight_id || !airline_code || !gate || !destination) {
    return res.status(400).json({ error: 'flight_id, airline_code, gate, destination are required' })
  }
  try {
    // Auto-insert airline if it doesn't exist (admin can add any airline code)
    db.prepare('INSERT OR IGNORE INTO Airline(airline_code, airline_name) VALUES (?, ?)').run(airline_code, airline_code)
    db.prepare(
      'INSERT INTO Flight(flight_id,airline_code,gate,destination,status,ticket_count) VALUES (?,?,?,?,?,0)'
    ).run(flight_id, airline_code, gate, destination, status || 'waiting')
    res.json(db.prepare('SELECT * FROM Flight WHERE flight_id = ?').get(flight_id))
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// PATCH /api/flights/:id  — update status
router.patch('/:id', (req, res) => {
  const { status } = req.body
  const info = db.prepare('UPDATE Flight SET status = ? WHERE flight_id = ?').run(status, req.params.id)
  if (!info.changes) return res.status(404).json({ error: 'Flight not found' })
  res.json(db.prepare('SELECT * FROM Flight WHERE flight_id = ?').get(req.params.id))
})

// DELETE /api/flights/:id  — remove flight + cascade passengers + bags (admin)
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM Baggage WHERE flight_id = ?').run(req.params.id)
  const info = db.prepare('DELETE FROM Flight WHERE flight_id = ?').run(req.params.id)
  if (!info.changes) return res.status(404).json({ error: 'Flight not found' })
  res.json({ success: true })
})

module.exports = router
