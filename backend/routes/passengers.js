const express = require('express')
const { db } = require('../db')
const router = express.Router()

// GET /api/passengers  — all passengers (admin)
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM Passenger').all())
})

// GET /api/passengers/:ticket  — by ticket number
router.get('/:ticket', (req, res) => {
  const p = db.prepare('SELECT * FROM Passenger WHERE ticket_number = ?').get(req.params.ticket)
  if (!p) return res.status(404).json({ error: 'Passenger not found' })
  res.json(p)
})

// POST /api/passengers  — add passenger (admin)
router.post('/', (req, res) => {
  const { ticket_number, first_name, last_name, id_number, flight_id, status } = req.body
  if (!ticket_number || !first_name || !last_name || !id_number || !flight_id) {
    return res.status(400).json({ error: 'All fields are required' })
  }
  try {
    db.prepare(
      'INSERT INTO Passenger VALUES (?,?,?,?,?,?)'
    ).run(ticket_number, first_name, last_name, id_number, flight_id, status || 'Not-checked-in')

    // Update ticket_count
    db.prepare('UPDATE Flight SET ticket_count = ticket_count + 1 WHERE flight_id = ?').run(flight_id)

    res.json(db.prepare('SELECT * FROM Passenger WHERE ticket_number = ?').get(ticket_number))
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// PATCH /api/passengers/:ticket/status  — change status (staff)
router.patch('/:ticket/status', (req, res) => {
  const { status } = req.body
  const info = db.prepare('UPDATE Passenger SET status = ? WHERE ticket_number = ?').run(status, req.params.ticket)
  if (!info.changes) return res.status(404).json({ error: 'Passenger not found' })
  res.json(db.prepare('SELECT * FROM Passenger WHERE ticket_number = ?').get(req.params.ticket))
})

// DELETE /api/passengers/:ticket  — remove by ticket number (admin)
router.delete('/:ticket', (req, res) => {
  const p = db.prepare('SELECT * FROM Passenger WHERE ticket_number = ?').get(req.params.ticket)
  if (!p) return res.status(404).json({ error: 'Passenger not found' })

  db.prepare('DELETE FROM Passenger WHERE ticket_number = ?').run(req.params.ticket)
  db.prepare('UPDATE Flight SET ticket_count = MAX(0, ticket_count - 1) WHERE flight_id = ?').run(p.flight_id)

  res.json({ success: true })
})

module.exports = router
