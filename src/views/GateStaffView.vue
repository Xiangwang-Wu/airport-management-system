<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '../stores/data'
import {
  validateTicketNumber,
  validateFlightConsistency
} from '../utils/validation'
import AppLayout from '../components/AppLayout.vue'
import AppCard from '../components/AppCard.vue'
import FormInput from '../components/FormInput.vue'
import AppButton from '../components/AppButton.vue'

const dataStore = useDataStore()

// Gate selection
const selectedGate = ref('')

// All available gates from flights
const availableGates = computed(() => {
  const gates = [...new Set(dataStore.flights.map(f => f.gate))]
  return gates.sort()
})

const gateInfo = computed(() => selectedGate.value)

// One gate = one flight (pick the first if data contains duplicates)
const gateFlight = computed(() => {
  if (!gateInfo.value) return null
  const flights = dataStore.getFlightsByGate(gateInfo.value)
  return flights.length > 0 ? flights[0] : null
})

const gatePassengers = computed(() => {
  if (!gateFlight.value) return []
  return dataStore.getPassengersByFlight(gateFlight.value.id)
})

const gateBags = computed(() => {
  if (!gateFlight.value) return []
  return dataStore.getBagsByFlight(gateFlight.value.id)
})

const flightStatus = computed(() => {
  if (!gateFlight.value) return null

  const passengers = gatePassengers.value
  const boardedPassengers = passengers.filter(p => p.status === 'Boarded')

  const bags = gateBags.value
  const loadedBags = bags.filter(b => b.status === 'Loaded to flight')

  const allPassengersBoarded = passengers.length > 0 && boardedPassengers.length === passengers.length
  const allBagsLoaded = bags.length === 0 || loadedBags.length === bags.length

  return {
    flight: gateFlight.value.id,
    airline: gateFlight.value.airline,
    passengersBoarded: boardedPassengers.length,
    totalPassengers: passengers.length,
    bagsLoaded: loadedBags.length,
    totalBags: bags.length,
    isReady: allPassengersBoarded && allBagsLoaded
  }
})

// Boarding form
const boardingForm = ref({
  ticketNumber: ''
})

const boardingErrors = ref({
  ticketNumber: []
})

const handleChangeGate = () => {
  if (!selectedGate.value) return
  if (!confirm(`Change gate from ${selectedGate.value}? You can only work at one gate at a time.`)) return

  selectedGate.value = ''
  boardingForm.value.ticketNumber = ''
  boardingErrors.value.ticketNumber = []
}

const handleBoarding = () => {
  boardingErrors.value = { ticketNumber: [] }

  const ticketValidation = validateTicketNumber(boardingForm.value.ticketNumber)
  if (!ticketValidation.valid) {
    boardingErrors.value.ticketNumber = ticketValidation.errors
    return
  }

  if (!gateFlight.value) {
    alert('Please select a gate that has a flight assigned.')
    return
  }

  const passenger = dataStore.passengers.find(p => p.ticketNumber === boardingForm.value.ticketNumber)
  if (!passenger) {
    alert('Passenger not found with this ticket number!')
    return
  }

  const consistencyValidation = validateFlightConsistency(gateFlight.value.id, passenger.flight)
  if (!consistencyValidation.valid) {
    alert(`Flight mismatch! Gate flight is ${gateFlight.value.id}, but passenger ticket is for ${passenger.flight}.`)
    return
  }

  if (passenger.status === 'Not-checked-in') {
    alert('Passenger has not checked in yet! Please complete check-in first.')
    return
  }

  if (passenger.status === 'Boarded') {
    alert('Passenger has already boarded!')
    return
  }

  // Ensure all bags for this ticket are at the gate
  const passengerBags = dataStore.bags.filter(b => b.ticketNumber === boardingForm.value.ticketNumber)
  const bagsNotAtGate = passengerBags.filter(b =>
    b.status !== 'Loaded to flight' && b.status !== 'At gate'
  )

  if (bagsNotAtGate.length > 0) {
    const bagIds = bagsNotAtGate.map(b => `${b.id} (${b.status})`).join(', ')
    alert(`Cannot board! These bags are not at the gate yet: ${bagIds}.`)
    return
  }

  dataStore.updatePassengerStatus(boardingForm.value.ticketNumber, 'Boarded')

  alert(`Boarding complete! Passenger ${passenger.firstName} ${passenger.lastName} (Ticket: ${boardingForm.value.ticketNumber}) has boarded flight ${gateFlight.value.id}.`)

  boardingForm.value.ticketNumber = ''
}

const handleNotifyFlightReady = () => {
  if (!flightStatus.value) {
    alert('No flight selected.')
    return
  }

  if (!flightStatus.value.isReady) {
    alert('Flight is not ready yet! All passengers must be boarded and all bags must be loaded.')
    return
  }

  dataStore.addFlightReadyNotification({
    flightId: flightStatus.value.flight,
    gate:     selectedGate.value,
    isReady:  true
  })

  alert(`Flight ${flightStatus.value.flight} ready notification sent to Admin!`)
}

const getStatusBadgeClass = (status) => {
  if (status === 'Boarded') return 'badge-success'
  if (status === 'Checked-in') return 'badge-default'
  if (status === 'Not-checked-in') return 'badge-warning'
  return 'badge-default'
}

const getBagStatusBadgeClass = (status) => {
  if (status === 'Loaded to flight') return 'badge-success'
  if (status === 'At gate') return 'badge-success'
  if (status === 'At security check') return 'badge-warning'
  if (status === 'Sent back') return 'badge-danger'
  if (status === 'Checked-in') return 'badge-warning'
  return 'badge-default'
}
</script>

<template>
  <AppLayout>
    <div class="gate-view">
      <AppCard title="Gate Staff · Select Gate">
        <p class="card-description">
          Select the gate you are working at. A gate staff member cannot work at more than one gate at a time.
        </p>

        <div class="form-field">
          <label class="form-label">Select Gate <span class="required">*</span></label>
          <select v-model="selectedGate" class="form-select" :disabled="Boolean(selectedGate)">
            <option value="">-- Select a gate --</option>
            <option v-for="gate in availableGates" :key="gate" :value="gate">
              {{ gate }}
            </option>
          </select>
          <div v-if="selectedGate" class="help-text">
            Gate locked for this session. Use “Change gate” to switch.
          </div>
        </div>

        <div v-if="selectedGate" class="form-actions">
          <AppButton variant="secondary" @click="handleChangeGate">
            Change gate
          </AppButton>
        </div>
      </AppCard>

      <template v-if="selectedGate && gateFlight">
        <AppCard title="Gate Information">
          <p class="card-description">
            Working at: <span class="badge badge-primary">{{ gateInfo }}</span>
          </p>
          <p><strong>Flight:</strong> {{ gateFlight.id }} ({{ gateFlight.airline }})</p>
          <div class="help-text">
            Gate staff can only board passengers for the flight departing from this gate.
          </div>
        </AppCard>

        <div class="grid">
          <AppCard title="Board passenger">
            <p class="card-description">
              Validation: ticket must be 10 digits; passenger must be checked-in; and all bags must be at the gate before boarding.
            </p>

            <form @submit.prevent="handleBoarding">
              <FormInput
                v-model="boardingForm.ticketNumber"
                label="Ticket number (10 digits)"
                placeholder="1234567890"
                :errors="boardingErrors.ticketNumber"
                :required="true"
              />

              <div class="form-actions">
                <AppButton variant="primary" type="submit">
                  Board passenger
                </AppButton>
              </div>
            </form>
          </AppCard>

          <AppCard title="Flight readiness">
            <p class="card-description">
              When all passengers are boarded and all bags are loaded, notify Admin that the flight is ready for departure.
            </p>

            <div v-if="flightStatus" class="flight-status-card">
              <div class="flight-status-header">
                <span class="chip">{{ flightStatus.flight }}</span>
                <span v-if="flightStatus.isReady" class="badge badge-success">Ready</span>
                <span v-else class="badge badge-warning">Not Ready</span>
              </div>

              <div class="flight-status-details">
                <div class="status-item">
                  <span class="status-label">Passengers:</span>
                  <span class="status-value">
                    {{ flightStatus.passengersBoarded }} / {{ flightStatus.totalPassengers }} boarded
                  </span>
                </div>
                <div class="status-item">
                  <span class="status-label">Bags:</span>
                  <span class="status-value">
                    {{ flightStatus.bagsLoaded }} / {{ flightStatus.totalBags }} loaded
                  </span>
                </div>
              </div>

              <div class="flight-status-actions">
                <AppButton
                  variant="primary"
                  :disabled="!flightStatus.isReady"
                  @click="handleNotifyFlightReady"
                >
                  Notify Admin: Flight Ready
                </AppButton>
              </div>
            </div>
          </AppCard>
        </div>

        <AppCard title="Passenger list">
          <p class="card-description">
            Passengers travelling on {{ gateFlight.id }}. Status: Not-checked-in / Checked-in / Boarded.
          </p>

          <table class="data-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Name</th>
                <th>Status</th>
                <th>Bags</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="passenger in gatePassengers" :key="passenger.id">
                <td><span class="chip">{{ passenger.ticketNumber }}</span></td>
                <td>{{ passenger.firstName }} {{ passenger.lastName }}</td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(passenger.status)">
                    {{ passenger.status }}
                  </span>
                </td>
                <td>
                  <div class="bag-list">
                    <span
                      v-for="bag in dataStore.bags.filter(b => b.ticketNumber === passenger.ticketNumber)"
                      :key="bag.id"
                      class="badge"
                      :class="getBagStatusBadgeClass(bag.status)"
                    >
                      {{ bag.id }}: {{ bag.status }}
                    </span>
                    <span v-if="dataStore.bags.filter(b => b.ticketNumber === passenger.ticketNumber).length === 0" class="no-bags">
                      No bags
                    </span>
                  </div>
                </td>
              </tr>
              <tr v-if="gatePassengers.length === 0">
                <td colspan="4" style="text-align: center; color: var(--muted);">No passengers found</td>
              </tr>
            </tbody>
          </table>
        </AppCard>

        <AppCard title="Bag list (flight)">
          <p class="card-description">
            Bags for {{ gateFlight.id }}. Track statuses: Checked-in → At security check → At gate → Loaded to flight.
          </p>

          <table class="data-table">
            <thead>
              <tr>
                <th>Bag ID</th>
                <th>Ticket</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bag in gateBags" :key="bag.id">
                <td><span class="chip">{{ bag.id }}</span></td>
                <td>{{ bag.ticketNumber }}</td>
                <td>
                  <span class="badge" :class="getBagStatusBadgeClass(bag.status)">
                    {{ bag.status }}
                  </span>
                </td>
              </tr>
              <tr v-if="gateBags.length === 0">
                <td colspan="3" style="text-align: center; color: var(--muted);">No bags found for this flight</td>
              </tr>
            </tbody>
          </table>
        </AppCard>
      </template>

      <AppCard v-else-if="selectedGate && !gateFlight" title="Gate Information">
        <div class="empty-state">
          No flight assigned to gate {{ gateInfo }}.
        </div>
      </AppCard>
    </div>
  </AppLayout>
</template>

<style scoped>
.gate-view {
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

.badge-danger {
  background: rgba(255,107,107,0.15);
  color: var(--bad);
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

.form-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.flight-status-card {
  padding: 16px;
  background: rgba(255,255,255,0.06);
  border-radius: 8px;
  border: 1px solid var(--line);
  margin-top: 12px;
}

.flight-status-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.flight-status-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.status-label {
  font-weight: 600;
  color: var(--muted);
}

.status-value {
  color: var(--text);
}

.flight-status-actions {
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  text-align: center;
  color: var(--muted);
  padding: 24px;
  font-size: 14px;
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

.bag-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.no-bags {
  color: var(--muted);
  font-size: 12px;
  font-style: italic;
}
</style>

