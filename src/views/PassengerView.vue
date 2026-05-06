<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'
import { validateTicketNumber } from '../utils/validation'
import AppLayout from '../components/AppLayout.vue'
import AppCard from '../components/AppCard.vue'
import FormInput from '../components/FormInput.vue'
import AppButton from '../components/AppButton.vue'

const authStore = useAuthStore()
const dataStore = useDataStore()

// Baggage status query form
const baggageForm = ref({
  ticketNumber: ''
})

const baggageErrors = ref({
  ticketNumber: []
})

const baggageResults = ref(null)

// Flight information query form
const flightForm = ref({
  ticketNumber: ''
})

const flightErrors = ref({
  ticketNumber: []
})

const flightResults = ref(null)

// Get current passenger information
const currentPassenger = computed(() => {
  // Extract ticket number from user context (e.g., "1234567890 (Li Wei)")
  const context = authStore.userContext || ''
  const match = context.match(/^(\d{10})/)
  if (match) {
    const ticketNumber = match[1]
    return dataStore.passengers.find(p => p.ticketNumber === ticketNumber)
  }
  return null
})

// Get current passenger's flight information
const currentFlight = computed(() => {
  if (currentPassenger.value) {
    return dataStore.flights.find(f => f.id === currentPassenger.value.flight)
  }
  return null
})

// Query baggage status
const handleBaggageQuery = () => {
  // Clear previous errors and results
  baggageErrors.value = {
    ticketNumber: []
  }
  baggageResults.value = null

  // Validate ticket number
  const ticketValidation = validateTicketNumber(baggageForm.value.ticketNumber)
  if (!ticketValidation.valid) {
    baggageErrors.value.ticketNumber = ticketValidation.errors
    return
  }

  // Find all bags for this ticket number
  const bags = dataStore.bags.filter(b => b.ticketNumber === baggageForm.value.ticketNumber)

  if (bags.length === 0) {
    baggageResults.value = {
      found: false,
      message: 'No baggage found for this ticket number'
    }
  } else {
    baggageResults.value = {
      found: true,
      bags: bags
    }
  }
}

// Query flight information
const handleFlightQuery = () => {
  // Clear previous errors and results
  flightErrors.value = {
    ticketNumber: []
  }
  flightResults.value = null

  // Validate ticket number
  const ticketValidation = validateTicketNumber(flightForm.value.ticketNumber)
  if (!ticketValidation.valid) {
    flightErrors.value.ticketNumber = ticketValidation.errors
    return
  }

  // Find passenger
  const passenger = dataStore.passengers.find(p => p.ticketNumber === flightForm.value.ticketNumber)

  if (!passenger) {
    flightResults.value = {
      found: false,
      message: 'Passenger not found with this ticket number'
    }
    return
  }

  // Find flight
  const flight = dataStore.flights.find(f => f.id === passenger.flight)

  if (!flight) {
    flightResults.value = {
      found: false,
      message: 'Flight information not found'
    }
    return
  }

  flightResults.value = {
    found: true,
    flightNumber: flight.id,
    gate: flight.gate,
    boardingStatus: passenger.status
  }
}

// Get status badge class
const getStatusBadgeClass = (status) => {
  if (status === 'Loaded to flight') return 'badge-success'
  if (status === 'Security cleared') return 'badge-success'
  if (status === 'Checked-in') return 'badge-default'
  if (status === 'Boarded') return 'badge-success'
  return 'badge-warning'
}
</script>

<template>
  <AppLayout>
    <div class="passenger-view">
      <AppCard title="Passenger Portal">
        <p class="card-description">
          Welcome to the passenger self-service portal. Query your baggage status and flight information.
        </p>
      </AppCard>

      <!-- Passenger information -->
      <AppCard v-if="currentPassenger" title="Your Information">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Name</div>
            <div class="info-value">{{ currentPassenger.firstName }} {{ currentPassenger.lastName }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Ticket Number</div>
            <div class="info-value"><span class="chip">{{ currentPassenger.ticketNumber }}</span></div>
          </div>
          <div class="info-item">
            <div class="info-label">Flight</div>
            <div class="info-value"><span class="chip">{{ currentPassenger.flight }}</span></div>
          </div>
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">
              <span class="badge" :class="getStatusBadgeClass(currentPassenger.status)">
                {{ currentPassenger.status }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="currentFlight" class="flight-details">
          <div class="section-divider">
            <span class="badge">Flight Details</span>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Gate</div>
              <div class="info-value">{{ currentFlight.gate }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Airline</div>
              <div class="info-value">{{ currentFlight.airline }}</div>
            </div>
          </div>
        </div>
      </AppCard>

      <div class="grid">
        <!-- Query baggage status -->
        <AppCard title="Query Baggage Status">
          <p class="card-description">
            Enter a 10-digit ticket number to view all baggage associated with that ticket.
          </p>

          <form @submit.prevent="handleBaggageQuery">
            <FormInput
              v-model="baggageForm.ticketNumber"
              label="Ticket Number (10 digits)"
              placeholder="1234567890"
              :errors="baggageErrors.ticketNumber"
              :required="true"
            />

            <div class="form-actions">
              <AppButton variant="primary" type="submit">
                Query Baggage
              </AppButton>
            </div>
          </form>

          <!-- Baggage query results -->
          <div v-if="baggageResults" class="query-results">
            <div class="section-divider">
              <span class="badge">Query Results</span>
            </div>

            <div v-if="!baggageResults.found" class="no-results">
              {{ baggageResults.message }}
            </div>

            <div v-else>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Bag ID</th>
                    <th>Status</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="bag in baggageResults.bags" :key="bag.id">
                    <td><span class="chip">{{ bag.id }}</span></td>
                    <td>
                      <span class="badge" :class="getStatusBadgeClass(bag.status)">
                        {{ bag.status }}
                      </span>
                    </td>
                    <td>{{ bag.location }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </AppCard>

        <!-- Query flight information -->
        <AppCard title="Query Flight Information">
          <p class="card-description">
            Enter a 10-digit ticket number to view flight details and boarding status.
          </p>

          <form @submit.prevent="handleFlightQuery">
            <FormInput
              v-model="flightForm.ticketNumber"
              label="Ticket Number (10 digits)"
              placeholder="1234567890"
              :errors="flightErrors.ticketNumber"
              :required="true"
            />

            <div class="form-actions">
              <AppButton variant="primary" type="submit">
                Query Flight
              </AppButton>
            </div>
          </form>

          <!-- Flight query results -->
          <div v-if="flightResults" class="query-results">
            <div class="section-divider">
              <span class="badge">Query Results</span>
            </div>

            <div v-if="!flightResults.found" class="no-results">
              {{ flightResults.message }}
            </div>

            <div v-else class="flight-info">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Flight Number</div>
                  <div class="info-value"><span class="chip">{{ flightResults.flightNumber }}</span></div>
                </div>
                <div class="info-item">
                  <div class="info-label">Gate</div>
                  <div class="info-value">{{ flightResults.gate }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Boarding Status</div>
                  <div class="info-value">
                    <span class="badge" :class="getStatusBadgeClass(flightResults.boardingStatus)">
                      {{ flightResults.boardingStatus }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.passenger-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-description {
  color: var(--muted);
  font-size: 14px;
  margin-bottom: 8px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 16px 0;
}

.info-item {
  padding: 12px;
  background: rgba(255,255,255,0.06);
  border-radius: 6px;
}

.info-label {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.info-value {
  font-size: 16px;
  color: var(--text);
  font-weight: 600;
}

.flight-details {
  margin-top: 16px;
}

.section-divider {
  margin: 16px 0;
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

.chip {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(106,166,255,0.15);
  color: var(--accent);
  border-radius: 12px;
  font-weight: 600;
  font-size: 13px;
}

.form-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.query-results {
  margin-top: 16px;
}

.no-results {
  padding: 16px;
  background: rgba(255,204,102,0.15);
  color: var(--warn);
  border-radius: 6px;
  text-align: center;
  font-weight: 600;
}

.flight-info {
  padding: 16px;
  background: rgba(255,255,255,0.06);
  border-radius: 6px;
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
</style>
