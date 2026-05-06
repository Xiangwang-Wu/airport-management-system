const express = require('express')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const { db } = require('../db')
const router = express.Router()

// Ethereal test account — created once at startup, printed to console
let transporter = null
let testAccount = null

async function getTransporter() {
  if (transporter) return transporter
  testAccount = await nodemailer.createTestAccount()
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass }
  })
  return transporter
}

async function sendCredentialEmail(to, username, password, role) {
  try {
    const t = await getTransporter()
    const info = await t.sendMail({
      from: '"Airport System Admin" <admin@airport.com>',
      to,
      subject: 'Your Airport System Account Credentials',
      text: `Welcome!\n\nYour account has been created.\n\nRole: ${role}\nUsername: ${username}\nTemporary Password: ${password}\n\nPlease login and change your password immediately.\n\nLogin at: http://localhost:5174`
    })
    const previewUrl = nodemailer.getTestMessageUrl(info)
    console.log(`[Email] Sent to ${to} — Preview: ${previewUrl}`)
    return previewUrl
  } catch (e) {
    console.error('[Email] Failed:', e.message)
    return null
  }
}

function generatePassword(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let p = ''
  for (let i = 0; i < len; i++) p += chars[Math.floor(Math.random() * chars.length)]
  return p
}

function generateUsername(lastname) {
  const base = lastname.toLowerCase().replace(/[^a-z]/g, '')
  const suffix = String(Math.floor(Math.random() * 90) + 10)
  let username = base + suffix
  // ensure unique
  while (db.prepare('SELECT 1 FROM User_Account WHERE username = ?').get(username)) {
    username = base + String(Math.floor(Math.random() * 90) + 10)
  }
  return username
}

const ROLE_MAP = {
  'Airline staff': 'airline',
  'Gate staff': 'gate',
  'Ground crew': 'ground',
  'Admin': 'admin'
}

// GET /api/staff  — all staff
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM Staff').all())
})

// GET /api/staff/:id
router.get('/:id', (req, res) => {
  const s = db.prepare('SELECT * FROM Staff WHERE staff_id = ?').get(req.params.id)
  if (!s) return res.status(404).json({ error: 'Staff not found' })
  res.json(s)
})

// POST /api/staff  — add staff (admin), auto-creates User_Account
router.post('/', async (req, res) => {
  const { staff_type, firstname, lastname, email, phone, airline_code, assignment } = req.body
  if (!staff_type || !firstname || !lastname || !email || !phone) {
    return res.status(400).json({ error: 'staff_type, firstname, lastname, email, phone are required' })
  }
  try {
    const info = db.prepare(
      'INSERT INTO Staff(staff_type,firstname,lastname,email,phone,airline_code,assignment) VALUES (?,?,?,?,?,?,?)'
    ).run(staff_type, firstname, lastname, email, phone, airline_code || null, assignment || null)
    const staff_id = info.lastInsertRowid

    const username = generateUsername(lastname)
    const password = generatePassword()
    const hash = bcrypt.hashSync(password, 10)
    const role = ROLE_MAP[staff_type] || 'gate'
    db.prepare('INSERT INTO User_Account(username,password_hash,role,staff_id,must_change_password) VALUES (?,?,?,?,1)').run(username, hash, role, staff_id)

    const staff = db.prepare('SELECT * FROM Staff WHERE staff_id = ?').get(staff_id)

    // Send credentials via email (Ethereal test — preview URL returned)
    const emailPreview = await sendCredentialEmail(email, username, password, staff_type)

    res.json({ ...staff, username, temp_password: password, email_preview: emailPreview })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// DELETE /api/staff/:id
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM Staff WHERE staff_id = ?').run(req.params.id)
  if (!info.changes) return res.status(404).json({ error: 'Staff not found' })
  res.json({ success: true })
})

// GET /api/staff/gate/:gate  — gate info
router.get('/gate/:gate', (req, res) => {
  const flights = db.prepare('SELECT * FROM Flight WHERE gate = ?').all(req.params.gate)
  const staff   = db.prepare("SELECT * FROM Staff WHERE assignment = ? AND staff_type = 'Gate staff'").all(req.params.gate)
  res.json({ gate: req.params.gate, flights, staff })
})

module.exports = router
