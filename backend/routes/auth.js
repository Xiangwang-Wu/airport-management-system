const express = require('express')
const bcrypt = require('bcryptjs')
const { db } = require('../db')
const router = express.Router()

// POST /api/login
router.post('/', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  const user = db.prepare('SELECT * FROM User_Account WHERE username = ?').get(username)
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  const valid = bcrypt.compareSync(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  let staffInfo = null
  if (user.staff_id) {
    staffInfo = db.prepare('SELECT * FROM Staff WHERE staff_id = ?').get(user.staff_id)
  }

  res.json({
    username: user.username,
    role: user.role,
    staff: staffInfo,
    must_change_password: user.must_change_password === 1
  })
})

// POST /api/change-password
router.post('/change-password', (req, res) => {
  const { username, current_password, new_password } = req.body
  if (!username || !current_password || !new_password) {
    return res.status(400).json({ error: 'username, current_password, new_password are required' })
  }
  const user = db.prepare('SELECT * FROM User_Account WHERE username = ?').get(username)
  if (!user) return res.status(404).json({ error: 'User not found' })

  if (!bcrypt.compareSync(current_password, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' })
  }

  const hash = bcrypt.hashSync(new_password, 10)
  db.prepare('UPDATE User_Account SET password_hash = ?, must_change_password = 0 WHERE username = ?').run(hash, username)
  res.json({ success: true })
})

module.exports = router
