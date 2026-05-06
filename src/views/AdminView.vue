<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '../stores/data'
import { validateFlightNumber, validateAirlineCode, validateRequired } from '../utils/validation'
import AppLayout from '../components/AppLayout.vue'
import AppCard from '../components/AppCard.vue'
import FormInput from '../components/FormInput.vue'
import AppButton from '../components/AppButton.vue'

const router = useRouter()
const dataStore = useDataStore()

// Detail modal state
const selectedFlight = ref(null)

const showFlightDetails = (flight) => { selectedFlight.value = flight }
const closeFlightDetails = () => { selectedFlight.value = null }

// New flight form
const newFlight = ref({
  airlineCode: '',
  flightNumber: '',
  terminal: 'T1',
  gate: '',
  destination: ''
})

const flightErrors = ref({
  airlineCode: [],
  flightNumber: [],
  gate: [],
  destination: []
})

const stats = computed(() => ({
  activeFlights: dataStore.flights.length,
  readyNotifications: dataStore.flightReadyNotifications.filter(n => n.ready).length,
  activePassengers: dataStore.passengers.length,
  staffAccounts: dataStore.staff.length
}))

const handleAddFlight = () => {
  // Clear previous errors
  flightErrors.value = {
    airlineCode: [],
    flightNumber: [],
    gate: [],
    destination: []
  }

  // Validate airline code
  const airlineValidation = validateAirlineCode(newFlight.value.airlineCode)
  if (!airlineValidation.valid) {
    flightErrors.value.airlineCode = airlineValidation.errors
  }

  // Validate flight number (4 digits)
  if (!newFlight.value.flightNumber || !/^\d{4}$/.test(newFlight.value.flightNumber)) {
    flightErrors.value.flightNumber = ['Flight number must be 4 digits']
  }

  // Validate gate
  const gateValidation = validateRequired(newFlight.value.gate, 'Gate')
  if (!gateValidation.valid) {
    flightErrors.value.gate = gateValidation.errors
  }

  // Validate destination
  const destValidation = validateRequired(newFlight.value.destination, 'Destination')
  if (!destValidation.valid) {
    flightErrors.value.destination = destValidation.errors
  }

  // If there are errors, stop submission
  if (Object.values(flightErrors.value).some(errors => errors.length > 0)) {
    return
  }

  // Combine full flight number
  const fullFlightId = newFlight.value.airlineCode.toUpperCase() + newFlight.value.flightNumber

  // Add flight
  dataStore.addFlight({
    id:          fullFlightId,
    airline:     newFlight.value.airlineCode.toUpperCase(),
    gate:        `${newFlight.value.terminal}-${newFlight.value.gate}`,
    destination: newFlight.value.destination
  })

  // Reset form
  newFlight.value = {
    airlineCode: '',
    flightNumber: '',
    terminal: 'T1',
    gate: '',
    destination: ''
  }

  alert('Flight added successfully!')
}

const handleRemoveFlight = (flightId) => {
  if (confirm(`Remove flight ${flightId}? This will also remove all passengers for this flight.`)) {
    dataStore.removeFlight(flightId)
    alert('Flight removed successfully!')
  }
}

const handleAuthorizeDeparture = (flight) => {
  if (confirm(`Authorize departure for flight ${flight}?`)) {
    alert(`Flight ${flight} authorized for departure!`)
    // In production, this would update the flight status
  }
}
</script>

<template>
  <AppLayout>
    <div class="admin-view">
      <AppCard title="Admin Console">
        <p class="card-description">
          Manage flights and receive flight readiness notifications from gate staff. Use separate modules for passenger and staff management.
        </p>

        <div class="kpis">
          <div class="kpi">
            <div class="kpi-label">Active flights</div>
            <div class="kpi-value">{{ stats.activeFlights }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Ready notifications</div>
            <div class="kpi-value">{{ stats.readyNotifications }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Active passengers</div>
            <div class="kpi-value">{{ stats.activePassengers }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Staff accounts</div>
            <div class="kpi-value">{{ stats.staffAccounts }}</div>
          </div>
        </div>
      </AppCard>

      <div class="grid">
        <AppCard title="Flights">
          <p class="card-description">
            Flight ID format: 2-letter airline code + 4-digit flight number. Includes gate and ticket list.
          </p>

          <table class="data-table">
            <thead>
              <tr>
                <th>Flight</th>
                <th>Destination</th>
                <th>Gate</th>
                <th>Status</th>
                <th># Tickets</th>
                <th style="text-align: right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="flight in dataStore.flights" :key="flight.id">
                <td><span class="chip">{{ flight.id }}</span></td>
                <td>{{ flight.destination }}</td>
                <td>{{ flight.gate }}</td>
                <td><span class="chip">{{ flight.status }}</span></td>
                <td>{{ flight.ticketCount }}</td>
                <td>
                  <div class="row-actions">
                    <AppButton variant="secondary" @click="showFlightDetails(flight)">
                      Details
                    </AppButton>
                    <AppButton variant="danger" @click="handleRemoveFlight(flight.id)">
                      Remove
                    </AppButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="section-divider">
            <span class="badge">Add new flight</span>
          </div>

          <form @submit.prevent="handleAddFlight" class="form-grid">
            <FormInput
              v-model="newFlight.airlineCode"
              label="Airline code (2 letters)"
              placeholder="e.g., AA"
              :errors="flightErrors.airlineCode"
              :required="true"
            />

            <FormInput
              v-model="newFlight.flightNumber"
              label="Flight number (4 digits)"
              placeholder="e.g., 1024"
              :errors="flightErrors.flightNumber"
              :required="true"
            />

            <div class="form-field">
              <label class="form-label">Terminal <span class="required">*</span></label>
              <select v-model="newFlight.terminal" class="form-select">
                <option>T1</option>
                <option>T2</option>
                <option>T3</option>
              </select>
            </div>

            <FormInput
              v-model="newFlight.gate"
              label="Gate"
              placeholder="e.g., G12"
              :errors="flightErrors.gate"
              :required="true"
            />

            <FormInput
              v-model="newFlight.destination"
              label="Destination"
              placeholder="e.g., Los Angeles"
              :errors="flightErrors.destination"
              :required="true"
            />

            <div class="form-actions-full">
              <AppButton variant="primary" type="submit">
                Add flight
              </AppButton>
            </div>
          </form>
        </AppCard>

        <AppCard title="Flight Readiness Notifications">
          <p class="card-description">
            Gate staff sends notifications when all passengers are boarded and all bags are loaded. Admin can then authorize flight departure.
          </p>

          <div class="notifications">
            <div
              v-for="notification in dataStore.flightReadyNotifications"
              :key="notification.id"
              class="notification"
              :class="{ 'notification-ready': notification.isReady }"
            >
              <div class="notification-header">
                <span class="badge" :class="notification.isReady ? 'badge-success' : 'badge-warning'">
                  {{ notification.flightId }}
                </span>
                <span v-if="notification.isReady" class="notification-status">Ready for departure</span>
                <span v-else class="notification-status">Pending</span>
              </div>

              <div class="notification-body">
                <div class="notification-info">
                  Gate: {{ notification.gate }}
                </div>
                <div v-if="notification.isReady" class="notification-time">
                  Notification received from Gate Staff at {{ notification.time }}
                </div>
                <div v-else class="notification-time">
                  Not ready yet - waiting for gate staff notification
                </div>
              </div>

              <div v-if="notification.isReady" class="notification-actions">
                <AppButton variant="primary" @click="handleAuthorizeDeparture(notification.flightId)">
                  Authorize departure
                </AppButton>
              </div>
            </div>
          </div>

          <div class="section-divider">
            <span class="badge">Quick links</span>
          </div>

          <div class="quick-links">
            <AppButton variant="secondary" @click="router.push('/admin/passengers')">
              Manage Passengers
            </AppButton>
            <AppButton variant="secondary" @click="router.push('/admin/staff')">
              Manage Staff
            </AppButton>
          </div>
        </AppCard>
      </div>
    </div>
  </AppLayout>

  <!-- Flight Detail Modal -->
  <div v-if="selectedFlight" class="modal-overlay" @click.self="closeFlightDetails">
    <div class="modal">
      <div class="modal-header">
        <h3>Flight Details · {{ selectedFlight.id }}</h3>
        <button class="modal-close" @click="closeFlightDetails">&times;</button>
      </div>
      <div class="modal-body">
        <div class="detail-row"><span class="detail-label">Flight ID</span><span>{{ selectedFlight.id }}</span></div>
        <div class="detail-row"><span class="detail-label">Airline</span><span>{{ selectedFlight.airline }}</span></div>
        <div class="detail-row"><span class="detail-label">Destination</span><span>{{ selectedFlight.destination }}</span></div>
        <div class="detail-row"><span class="detail-label">Gate</span><span>{{ selectedFlight.gate }}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="chip">{{ selectedFlight.status }}</span></div>
        <div class="detail-row"><span class="detail-label">Tickets sold</span><span>{{ selectedFlight.ticketCount }}</span></div>
        <div class="detail-section-title">Passengers</div>
        <div v-if="dataStore.getPassengersByFlight(selectedFlight.id).length === 0" class="detail-empty">No passengers for this flight.</div>
        <table v-else class="detail-table">
          <thead><tr><th>Ticket</th><th>Name</th><th>Status</th></tr></thead>
          <tbody>
            <tr v-for="p in dataStore.getPassengersByFlight(selectedFlight.id)" :key="p.id">
              <td>{{ p.ticketNumber }}</td>
              <td>{{ p.firstName }} {{ p.lastName }}</td>
              <td>{{ p.status }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-description {
  color: var(--muted);
  font-size: 14px;
  margin-bottom: 16px;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.kpi {
  padding: 16px;
  background: rgba(255,255,255,0.06);
  border-radius: 8px;
}

.kpi-label {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 16px;
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

.section-divider {
  margin: 24px 0 16px;
}

.badge {
  display: inline-block;
  padding: 6px 12px;
  background: rgba(255,255,255,0.06);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

.badge-success {
  background: rgba(47,224,122,0.15);
  color: var(--good);
}

.badge-warning {
  background: rgba(255,204,102,0.15);
  color: var(--warn);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-field {
  margin-bottom: 0;
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

.form-actions-full {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
}

.notifications {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 16px 0;
}

.notification {
  padding: 16px;
  background: rgba(255,255,255,0.06);
  border-radius: 8px;
  border-left: 4px solid var(--warn);
}

.notification-ready {
  background: rgba(47,224,122,0.10);
  border-left-color: var(--good);
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.notification-status {
  font-weight: 600;
  font-size: 14px;
  color: var(--text);
}

.notification-body {
  margin-bottom: 12px;
}

.notification-info {
  font-size: 14px;
  color: var(--text);
  margin-bottom: 4px;
}

.notification-time {
  font-size: 12px;
  color: var(--muted);
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.quick-links {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal {
  background: var(--panel); border: 1px solid var(--line); border-radius: 10px;
  width: 560px; max-width: 95vw; max-height: 80vh; overflow-y: auto;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid var(--line);
}
.modal-header h3 { margin: 0; font-size: 16px; }
.modal-close {
  background: none; border: none; color: var(--muted); font-size: 22px;
  cursor: pointer; line-height: 1; padding: 0 4px;
}
.modal-body { padding: 20px; }
.detail-row {
  display: flex; justify-content: space-between;
  padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 14px;
}
.detail-label { color: var(--muted); }
.detail-section-title {
  font-weight: 600; font-size: 13px; color: var(--muted);
  text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 0 8px;
}
.detail-empty { color: var(--muted); font-size: 14px; }
.detail-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.detail-table th {
  text-align: left; padding: 6px 8px; color: var(--muted);
  border-bottom: 1px solid var(--line); font-weight: 600;
}
.detail-table td { padding: 6px 8px; border-bottom: 1px solid var(--line); }
</style>
