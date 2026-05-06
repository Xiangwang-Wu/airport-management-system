<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'
import {
  validateTicketNumber,
  validateRequired,
  validateBagId
} from '../utils/validation'
import AppLayout from '../components/AppLayout.vue'
import AppCard from '../components/AppCard.vue'
import FormInput from '../components/FormInput.vue'
import AppButton from '../components/AppButton.vue'

const authStore = useAuthStore()
const dataStore = useDataStore()

// Check-in form
const checkinForm = ref({
  ticketNumber: '',
  flight: '',
  terminal: 'T1',
  counter: '',
  numBags: '0'
})

const checkinErrors = ref({
  ticketNumber: [],
  flight: [],
  counter: []
})

// Get flights for current airline
const airlineCode = computed(() => {
  // Extract airline code from user context (e.g., "AA (American Airlines)" -> "AA")
  const context = authStore.userContext || ''
  const match = context.match(/^([A-Z]{2})/)
  return match ? match[1] : 'AA'
})

const airlineFlights = computed(() => {
  return dataStore.getFlightsByAirline(airlineCode.value)
})

const airlineBags = computed(() => {
  return dataStore.bags.filter(bag => {
    const flight = dataStore.flights.find(f => f.id === bag.flight)
    return flight && flight.airline === airlineCode.value
  })
})

const airlineMessages = computed(() => {
  // Show messages for flights that belong to this airline
  const myFlightIds = dataStore.flights
    .filter(f => f.airline === airlineCode.value)
    .map(f => f.id)
  return dataStore.airlineMessages.filter(m => myFlightIds.includes(m.flightId))
})

const newMessage = ref('')

const handlePostMessage = () => {
  if (!newMessage.value || newMessage.value.trim() === '') {
    alert('Message content is required')
    return
  }

  dataStore.addAirlineMessage({
    flightId:  checkinForm.value.flight || (dataStore.getFlightsByAirline(airlineCode.value)[0]?.id),
    sender:    authStore.currentUser?.username || 'airline_staff',
    message:   newMessage.value.trim()
  })

  newMessage.value = ''
  alert('Message posted successfully!')
}

const handleCheckin = () => {
  // Clear previous errors
  checkinErrors.value = {
    ticketNumber: [],
    flight: [],
    counter: []
  }

  // Validate ticket number
  const ticketValidation = validateTicketNumber(checkinForm.value.ticketNumber)
  if (!ticketValidation.valid) {
    checkinErrors.value.ticketNumber = ticketValidation.errors
  }

  // Validate flight
  const flightValidation = validateRequired(checkinForm.value.flight, 'Flight')
  if (!flightValidation.valid) {
    checkinErrors.value.flight = flightValidation.errors
  }

  // Validate counter
  const counterValidation = validateRequired(checkinForm.value.counter, 'Counter')
  if (!counterValidation.valid) {
    checkinErrors.value.counter = counterValidation.errors
  }

  // If there are errors, stop submission
  if (Object.values(checkinErrors.value).some(errors => errors.length > 0)) {
    return
  }

  // Find passenger
  const passenger = dataStore.passengers.find(p => p.ticketNumber === checkinForm.value.ticketNumber)
  if (!passenger) {
    alert('Passenger not found with this ticket number!')
    return
  }

  // Validate flight match
  if (passenger.flight !== checkinForm.value.flight) {
    alert(`Passenger ticket is for flight ${passenger.flight}, not ${checkinForm.value.flight}!`)
    return
  }

  // Update passenger status
  dataStore.updatePassengerStatus(checkinForm.value.ticketNumber, 'Checked-in')

  // Create bag records
  const numBags = parseInt(checkinForm.value.numBags)
  for (let i = 0; i < numBags; i++) {
    const bagId = String(Math.floor(100000 + Math.random() * 900000)) // Generate 6-digit random number
    dataStore.addBag({
      id: bagId,
      ticketNumber: checkinForm.value.ticketNumber,
      flight: checkinForm.value.flight,
      status: 'Checked-in',
      location: `${checkinForm.value.terminal}-${checkinForm.value.counter}`
    })
  }

  alert(`Check-in complete! Passenger status updated to Checked-in. ${numBags} bag(s) created.`)

  // Reset form
  checkinForm.value = {
    ticketNumber: '',
    flight: '',
    terminal: 'T1',
    counter: '',
    numBags: '0'
  }
}

const handleDeleteBag = (bagId) => {
  if (confirm(`Delete bag ${bagId}? Please confirm this is an incorrect entry.`)) {
    dataStore.removeBag(bagId)
    alert('Bag deleted successfully!')
  }
}

const getStatusBadgeClass = (status) => {
  if (status === 'Loaded to flight') return 'badge-success'
  if (status === 'Security cleared') return 'badge-success'
  if (status === 'Checked-in') return 'badge-default'
  return 'badge-warning'
}
</script>

<template>
  <AppLayout>
    <div class="airline-view">
      <AppCard title="Airline Staff · Check-in">
        <p class="card-description">
          Working for: <span class="badge badge-primary">{{ airlineCode }} ({{ authStore.userContext }})</span>
        </p>
        <p class="card-description">
          Ensure passenger + flight exist. Update passenger status to Checked-in. Create one Bag record per checked bag (can be 0).
        </p>
        <div class="help-text">
          Note: Airline staff can only see and process passengers/bags for their own airline ({{ airlineCode }} in this example).
        </div>
      </AppCard>

      <div class="grid">
        <AppCard title="Process check-in">
          <p class="card-description">
            Example validation: ticket number must be 10 digits; bag ID is 6 digits; default bag location is check-in counter (terminal + counter ID).
          </p>

          <form @submit.prevent="handleCheckin">
            <FormInput
              v-model="checkinForm.ticketNumber"
              label="Ticket number (10 digits)"
              placeholder="1234567890"
              :errors="checkinErrors.ticketNumber"
              :required="true"
            />

            <div class="form-field">
              <label class="form-label">Flight ({{ airlineCode }} flights only) <span class="required">*</span></label>
              <select v-model="checkinForm.flight" class="form-select">
                <option value="">Select flight</option>
                <option v-for="flight in airlineFlights" :key="flight.id" :value="flight.id">
                  {{ flight.id }}
                </option>
              </select>
              <div class="help-text">Only shows flights for your airline ({{ airlineCode }})</div>
              <div v-if="checkinErrors.flight.length > 0" class="error-messages">
                <div v-for="(error, index) in checkinErrors.flight" :key="index" class="error-message">
                  {{ error }}
                </div>
              </div>
            </div>

            <div class="form-field">
              <label class="form-label">Terminal <span class="required">*</span></label>
              <select v-model="checkinForm.terminal" class="form-select">
                <option>T1</option>
                <option>T2</option>
                <option>T3</option>
              </select>
            </div>

            <FormInput
              v-model="checkinForm.counter"
              label="Counter"
              placeholder="e.g., C07"
              :errors="checkinErrors.counter"
              :required="true"
            />

            <div class="form-field">
              <label class="form-label">Number of checked bags <span class="required">*</span></label>
              <select v-model="checkinForm.numBags" class="form-select">
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
              <div class="help-text">If 0, you can still complete check-in.</div>
            </div>

            <div class="form-actions">
              <AppButton variant="primary" type="submit">
                Submit check-in
              </AppButton>
            </div>
          </form>
        </AppCard>

        <AppCard title="Airline message board">
          <p class="card-description">
            Shared info among {{ airlineCode }} airline staff (prototype: announcements / issues / coordination).
          </p>

          <div class="messages">
            <div v-if="airlineMessages.length === 0" class="empty-messages">
              No messages yet.
            </div>
            <div v-else v-for="msg in airlineMessages" :key="msg.id" class="message">
              <div class="message-time">{{ msg.time }}</div>
              <div class="message-content">{{ msg.message }}</div>
            </div>
          </div>

          <div class="section-divider">
            <span class="badge">Post a message</span>
          </div>

          <form @submit.prevent="handlePostMessage">
            <div class="form-field">
              <label class="form-label">Content</label>
              <textarea
                v-model="newMessage"
                class="form-textarea"
                placeholder="e.g., security return / system issue / coordination"
              ></textarea>
            </div>
            <div class="form-actions">
              <AppButton variant="primary" type="submit">
                Post
              </AppButton>
            </div>
          </form>
        </AppCard>
      </div>

      <AppCard :title="`Bag list (${airlineCode} flights only)`">
        <p class="card-description">
          Each bag: Bag ID (6 digits) / Ticket (10 digits) / Location (Checked-in / Security cleared / Gate / Loaded to flight).
        </p>

        <table class="data-table">
          <thead>
            <tr>
              <th>Bag ID</th>
              <th>Ticket</th>
              <th>Flight</th>
              <th>Status</th>
              <th style="text-align: right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bag in airlineBags" :key="bag.id">
              <td><span class="chip">{{ bag.id }}</span></td>
              <td>{{ bag.ticketNumber }}</td>
              <td><span class="chip">{{ bag.flight }}</span></td>
              <td>
                <span class="badge" :class="getStatusBadgeClass(bag.status)">
                  {{ bag.status }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <AppButton variant="secondary" @click="alert('Print tag (prototype)')">
                    Print tag
                  </AppButton>
                  <AppButton variant="danger" @click="handleDeleteBag(bag.id)">
                    Delete
                  </AppButton>
                </div>
              </td>
            </tr>
            <tr v-if="airlineBags.length === 0">
              <td colspan="5" style="text-align: center; color: var(--muted);">No bags found for {{ airlineCode }} flights</td>
            </tr>
          </tbody>
        </table>
      </AppCard>
    </div>
  </AppLayout>
</template>

<style scoped>
.airline-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-description {
  color: var(--muted);
  font-size: 14px;
  margin-bottom: 8px;
}

.help-text {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 12px;
}

.badge-primary {
  background: rgba(106,166,255,0.15);
  color: var(--accent);
}

.badge-success {
  background: rgba(47,224,122,0.15);
  color: var(--good);
}

.badge-default {
  background: rgba(255,255,255,0.06);
  color: var(--muted);
}

.badge-warning {
  background: rgba(255,204,102,0.15);
  color: var(--warn);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 16px;
}

.form-field {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--text);
}

.required {
  color: var(--bad);
  margin-left: 2px;
}

.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-size: 14px;
  background: rgba(255,255,255,0.06);
  color: var(--text);
  cursor: pointer;
}

.form-select option {
  background: var(--panel);
  color: var(--text);
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  background: rgba(255,255,255,0.06);
  color: var(--text);
}

.error-messages {
  margin-top: 4px;
}

.error-message {
  font-size: 12px;
  color: var(--bad);
  margin-top: 2px;
}

.form-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
}

.empty-messages {
  text-align: center;
  color: var(--muted);
  padding: 12px;
  font-size: 13px;
}

.message {
  padding: 12px;
  background: rgba(255,255,255,0.06);
  border-radius: 6px;
}

.message-time {
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 4px;
}

.message-content {
  font-size: 13px;
  color: var(--text);
}

.section-divider {
  margin: 16px 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.data-table th {
  text-align: left;
  padding: 12px;
  background: var(--panel);
  font-weight: 600;
  font-size: 13px;
  color: var(--muted);
  border-bottom: 2px solid var(--line);
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid var(--line);
  font-size: 14px;
  color: var(--text);
}

.chip {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(106,166,255,0.15);
  color: var(--accent);
  border-radius: 12px;
  font-weight: 600;
  font-size: 13px;
}

.row-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
