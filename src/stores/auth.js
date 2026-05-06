import { defineStore } from 'pinia'

const API = 'http://localhost:3000/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: null,
    isAuthenticated: false,
    userRole: null,
    userContext: null,
    staffInfo: null,
    mustChangePassword: false
  }),

  getters: {
    isAdmin:        (state) => state.userRole === 'admin',
    isAirlineStaff: (state) => state.userRole === 'airline',
    isGroundCrew:   (state) => state.userRole === 'ground',
    isGateStaff:    (state) => state.userRole === 'gate'
  },

  actions: {
    async login(username, password) {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Login failed')
      }
      const data = await res.json()
      this.currentUser    = { username: data.username, role: data.role }
      this.isAuthenticated = true
      this.userRole       = data.role
      this.staffInfo      = data.staff
      this.mustChangePassword = data.must_change_password || false

      if (data.staff) {
        this.userContext = data.staff.assignment || null
      }

      localStorage.setItem('auth', JSON.stringify({
        username: data.username,
        role: data.role,
        staffInfo: data.staff,
        context: this.userContext,
        mustChangePassword: this.mustChangePassword
      }))
      return data
    },

    async changePassword(currentPassword, newPassword) {
      const res = await fetch(`${API}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.currentUser.username,
          current_password: currentPassword,
          new_password: newPassword
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Password change failed')
      }
      this.mustChangePassword = false
      const stored = JSON.parse(localStorage.getItem('auth') || '{}')
      stored.mustChangePassword = false
      localStorage.setItem('auth', JSON.stringify(stored))
    },

    logout() {
      this.currentUser     = null
      this.isAuthenticated = false
      this.userRole        = null
      this.userContext     = null
      this.staffInfo       = null
      this.mustChangePassword = false
      localStorage.removeItem('auth')
    },

    restoreAuth() {
      const auth = localStorage.getItem('auth')
      if (auth) {
        const { username, role, staffInfo, context, mustChangePassword } = JSON.parse(auth)
        this.currentUser     = { username, role }
        this.isAuthenticated = true
        this.userRole        = role
        this.staffInfo       = staffInfo
        this.userContext     = context
        this.mustChangePassword = mustChangePassword || false
      }
    }
  }
})
