import { defineStore } from 'pinia'

const API = 'http://localhost:3000/api'

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// ── Normalizers: API (snake_case) → Frontend (camelCase) ──────────────────
function normFlight(f) {
  return {
    id:          f.flight_id,
    airline:     f.airline_code,
    gate:        f.gate,
    destination: f.destination,
    status:      f.status,
    ticketCount: f.ticket_count
  }
}

function normPassenger(p) {
  return {
    id:           p.ticket_number,   // views use passenger.id as the key
    firstName:    p.first_name,
    lastName:     p.last_name,
    idNumber:     p.id_number,
    ticketNumber: p.ticket_number,
    flight:       p.flight_id,
    status:       p.status
  }
}

function normStaff(s) {
  return {
    id:         s.staff_id,
    type:       s.staff_type,
    name:       `${s.firstname} ${s.lastname}`,
    firstname:  s.firstname,
    lastname:   s.lastname,
    email:      s.email,
    phone:      s.phone,
    airline:    s.airline_code,
    assignment: s.assignment
  }
}

function normBag(b) {
  return {
    id:               b.bag_id,
    ticketNumber:     b.ticket_number,
    flight:           b.flight_id,
    status:           b.status,
    location:         b.status,          // views show "status · location" so reuse status
    checkInLocation:  b.check_in_location
  }
}

function normMessage(m) {
  return {
    id:         m.message_id,
    flightId:   m.flight_id,
    sender:     m.sender,
    recipient:  m.recipient,
    message:    m.message,
    time:       m.created_at ? m.created_at.substring(11, 16) : ''
  }
}

function normNotification(n) {
  return {
    id:       n.notification_id,
    flightId: n.flight_id,
    gate:     n.gate,
    isReady:  !!n.is_ready,
    time:     n.created_at ? n.created_at.substring(11, 16) : ''
  }
}

export const useDataStore = defineStore('data', {
  state: () => ({
    flights: [],
    passengers: [],
    staff: [],
    bags: [],
    airlineMessages: [],
    flightReadyNotifications: []
  }),

  getters: {
    getFlightsByAirline: (state) => (airline) =>
      state.flights.filter(f => f.airline === airline),

    getFlightsByGate: (state) => (gate) =>
      state.flights.filter(f => f.gate === gate),

    getPassengersByFlight: (state) => (flightId) =>
      state.passengers.filter(p => p.flight === flightId),

    getBagsByFlight: (state) => (flightId) =>
      state.bags.filter(b => b.flight === flightId),

    getPendingSecurityBags: (state) =>
      state.bags.filter(b => b.status === 'Checked-in'),

    getBagsByGate: (state) => (gate) => {
      const ids = state.flights.filter(f => f.gate === gate).map(f => f.id)
      return state.bags.filter(b => ids.includes(b.flight))
    }
  },

  actions: {
    // ── Init ──────────────────────────────────────────────────────────────
    async fetchAll() {
      const [flights, passengers, staff, bags, messages, notifications] = await Promise.all([
        api('/flights'),
        api('/passengers'),
        api('/staff'),
        api('/baggage'),
        api('/messages'),
        api('/messages/notifications')
      ])
      this.flights                  = flights.map(normFlight)
      this.passengers               = passengers.map(normPassenger)
      this.staff                    = staff.map(normStaff)
      this.bags                     = bags.map(normBag)
      this.airlineMessages          = messages.map(normMessage)
      this.flightReadyNotifications = notifications.map(normNotification)
    },

    // ── Flights ───────────────────────────────────────────────────────────
    async addFlight(flight) {
      const created = await api('/flights', {
        method: 'POST',
        body: JSON.stringify({
          flight_id:    flight.id,
          airline_code: flight.airline,
          gate:         flight.gate,
          destination:  flight.destination || '',
          status:       flight.status || 'waiting'
        })
      })
      this.flights.push(normFlight(created))
    },

    async removeFlight(flightId) {
      await api(`/flights/${flightId}`, { method: 'DELETE' })
      this.flights    = this.flights.filter(f => f.id !== flightId)
      this.passengers = this.passengers.filter(p => p.flight !== flightId)
    },

    async updateFlightStatus(flightId, status) {
      const updated = await api(`/flights/${flightId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
      const idx = this.flights.findIndex(f => f.id === flightId)
      if (idx !== -1) this.flights[idx] = normFlight(updated)
    },

    // ── Passengers ────────────────────────────────────────────────────────
    async addPassenger(passenger) {
      const created = await api('/passengers', {
        method: 'POST',
        body: JSON.stringify({
          ticket_number: passenger.ticketNumber,
          first_name:    passenger.firstName,
          last_name:     passenger.lastName,
          id_number:     passenger.idNumber,
          flight_id:     passenger.flight,
          status:        passenger.status || 'Not-checked-in'
        })
      })
      this.passengers.push(normPassenger(created))
      const flight = this.flights.find(f => f.id === passenger.flight)
      if (flight) flight.ticketCount++
    },

    async removePassenger(ticketNumber) {
      const p = this.passengers.find(p => p.ticketNumber === ticketNumber)
      await api(`/passengers/${ticketNumber}`, { method: 'DELETE' })
      this.passengers = this.passengers.filter(p => p.ticketNumber !== ticketNumber)
      if (p) {
        const flight = this.flights.find(f => f.id === p.flight)
        if (flight) flight.ticketCount = Math.max(0, flight.ticketCount - 1)
      }
    },

    async updatePassengerStatus(ticketNumber, status) {
      const updated = await api(`/passengers/${ticketNumber}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
      const idx = this.passengers.findIndex(p => p.ticketNumber === ticketNumber)
      if (idx !== -1) this.passengers[idx] = normPassenger(updated)
    },

    // ── Staff ─────────────────────────────────────────────────────────────
    async addStaff(staff) {
      // Split name into firstname/lastname for the API
      const parts = (staff.name || '').trim().split(/\s+/)
      const firstname = parts[0] || staff.name
      const lastname  = parts.slice(1).join(' ') || parts[0]
      const created = await api('/staff', {
        method: 'POST',
        body: JSON.stringify({
          staff_type:   staff.type,
          firstname,
          lastname,
          email:        staff.email,
          phone:        staff.phone,
          airline_code: staff.airline || null,
          assignment:   staff.assignment || null
        })
      })
      this.staff.push(normStaff(created))
      return { username: created.username, temp_password: created.temp_password, email_preview: created.email_preview || null }
    },

    async removeStaff(staffId) {
      await api(`/staff/${staffId}`, { method: 'DELETE' })
      this.staff = this.staff.filter(s => s.id !== staffId)
    },

    // ── Baggage ───────────────────────────────────────────────────────────
    async addBag(bag) {
      const created = await api('/baggage', {
        method: 'POST',
        body: JSON.stringify({
          bag_id:           bag.id,
          ticket_number:    bag.ticketNumber,
          flight_id:        bag.flight,
          check_in_location: bag.checkInLocation || bag.location || ''
        })
      })
      this.bags.push(normBag(created))
    },

    async removeBag(bagId) {
      await api(`/baggage/${bagId}`, { method: 'DELETE' })
      this.bags = this.bags.filter(b => b.id !== bagId)
    },

    async updateBagStatus(bagId, status, location = null) {
      const updated = await api(`/baggage/${bagId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
      const idx = this.bags.findIndex(b => b.id === bagId)
      if (idx !== -1) this.bags[idx] = normBag(updated)
    },

    // ── Messages ──────────────────────────────────────────────────────────
    async addAirlineMessage(message) {
      const created = await api('/messages', {
        method: 'POST',
        body: JSON.stringify({
          flight_id: message.flightId || message.flight_id,
          sender:    message.sender,
          recipient: message.recipient || null,
          message:   message.message || message.text
        })
      })
      this.airlineMessages.unshift(normMessage(created))
    },

    async addFlightReadyNotification(notification) {
      const created = await api('/messages/notifications', {
        method: 'POST',
        body: JSON.stringify({
          flight_id: notification.flightId || notification.flight_id,
          gate:      notification.gate,
          is_ready:  notification.isReady !== false
        })
      })
      this.flightReadyNotifications.unshift(normNotification(created))
    }
  }
})
