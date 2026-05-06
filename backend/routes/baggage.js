const express = require('express')
const { db } = require('../db')
const router = express.Router()

// GET /api/baggage/:id  — single bag
router.get('/:id', (req, res) => {
  const bag = db.prepare('SELECT * FROM Baggage WHERE bag_id = ?').get(req.params.id)
  if (!bag) return res.status(404).json({ error: 'Bag not found' })
  res.json(bag)
})

// GET /api/baggage?gate=T1-G12 or ?flight=AA1024 or ?ticket=1234567890
router.get('/', (req, res) => {
  const { gate, flight, ticket } = req.query
  let bags
  if (gate) {
    const flightIds = db.prepare('SELECT flight_id FROM Flight WHERE gate = ?').all(gate).map(f => f.flight_id)
    if (!flightIds.length) return res.json([])
    const placeholders = flightIds.map(() => '?').join(',')
    bags = db.prepare(`SELECT * FROM Baggage WHERE flight_id IN (${placeholders})`).all(...flightIds)
  } else if (flight) {
    bags = db.prepare('SELECT * FROM Baggage WHERE flight_id = ?').all(flight)
  } else if (ticket) {
    bags = db.prepare('SELECT * FROM Baggage WHERE ticket_number = ?').all(ticket)
  } else {
    bags = db.prepare('SELECT * FROM Baggage').all()
  }
  res.json(bags)
})

// POST /api/baggage  — add bag (staff)
router.post('/', (req, res) => {
  const { bag_id, ticket_number, flight_id, check_in_location, status } = req.body
  if (!bag_id || !ticket_number || !flight_id || !check_in_location) {
    return res.status(400).json({ error: 'bag_id, ticket_number, flight_id, check_in_location are required' })
  }
  const valid = ['Checked-in','At security check','At gate','Loaded to flight','Sent back']
  const bagStatus = (status && valid.includes(status)) ? status : 'Checked-in'
  try {
    db.prepare(
      'INSERT INTO Baggage(bag_id,ticket_number,flight_id,status,check_in_location) VALUES (?,?,?,?,?)'
    ).run(bag_id, ticket_number, flight_id, bagStatus, check_in_location)
    res.json(db.prepare('SELECT * FROM Baggage WHERE bag_id = ?').get(bag_id))
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// PATCH /api/baggage/:id/status  — update status (staff)
router.patch('/:id/status', (req, res) => {
  const { status } = req.body
  const valid = ['Checked-in','At security check','At gate','Loaded to flight','Sent back']
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' })
  const info = db.prepare('UPDATE Baggage SET status = ? WHERE bag_id = ?').run(status, req.params.id)
  if (!info.changes) return res.status(404).json({ error: 'Bag not found' })
  res.json(db.prepare('SELECT * FROM Baggage WHERE bag_id = ?').get(req.params.id))
})

// DELETE /api/baggage/:id  — remove bag (staff)
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM Baggage WHERE bag_id = ?').run(req.params.id)
  if (!info.changes) return res.status(404).json({ error: 'Bag not found' })
  res.json({ success: true })
})

module.exports = router
