<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '../stores/data'
import { validateBagId, validateRequired } from '../utils/validation'
import AppLayout from '../components/AppLayout.vue'
import AppCard from '../components/AppCard.vue'
import FormInput from '../components/FormInput.vue'
import AppButton from '../components/AppButton.vue'

const dataStore = useDataStore()

// Work location selection: 'none', 'security', 'gate'
const workLocation = ref('none')
const selectedGate = ref('')

const availableGates = computed(() => {
  const gates = [...new Set(dataStore.flights.map(f => f.gate))]
  return gates.sort()
})

// ===== Security mode state =====
const receiveForm = ref({ bagId: '' })
const receiveErrors = ref({ bagId: [] })

const sendBackForm = ref({ bagId: '', reason: '', notes: '' })
const sendBackErrors = ref({ bagId: [], reason: [] })

const processingHistory = ref([])

const checkInBags = computed(() => {
  return dataStore.bags.filter(b => b.status === 'Checked-in')
})

const securityCheckBags = computed(() => {
  return dataStore.bags.filter(b => b.status === 'At security check')
})

const getFlightById = (flightId) => {
  return dataStore.flights.find(f => f.id === flightId) || null
}

const addHistory = (record) => {
  processingHistory.value.unshift({
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    ...record
  })
}

const moveToSecurityCheck = (bagId) => {
  const bag = dataStore.bags.find(b => b.id === bagId)
  if (!bag) {
    alert('Bag not found with this ID!')
    return
  }

  if (bag.status !== 'Checked-in') {
    alert(`Cannot move. Bag ${bag.id} status is "${bag.status}". Only "Checked-in" bags can arrive at security.`)
    return
  }

  dataStore.updateBagStatus(bag.id, 'At security check', 'Security check')

  const flight = getFlightById(bag.flight)
  addHistory({
    action: 'Moved to security check',
    bagId: bag.id,
    flight: bag.flight,
    airline: flight?.airline || 'N/A',
    from: bag.checkInLocation || 'Check-in counter',
    to: 'Security check'
  })

  alert(`Bag ${bag.id} moved to security check.`)
}

const clearSecurityBag = (bagId) => {
  const bag = dataStore.bags.find(b => b.id === bagId)
  if (!bag) {
    alert('Bag not found with this ID!')
    return
  }

  if (bag.status !== 'At security check') {
    alert(`Cannot clear. Bag ${bag.id} is not at security check. Current status: "${bag.status}".`)
    return
  }

  const flight = getFlightById(bag.flight)
  if (!flight) {
    alert(`Flight not found for bag ${bag.id}.`)
    return
  }

  // Clear means it has to go to the gate
  dataStore.updateBagStatus(bag.id, 'At gate', flight.gate)

  addHistory({
    action: 'Cleared (sent to gate)',
    bagId: bag.id,
    flight: bag.flight,
    airline: flight.airline,
    from: 'Security check',
    to: flight.gate
  })

  alert(`Bag ${bag.id} cleared and sent to gate ${flight.gate}.`)
}

const sendBagBackToCheckIn = (bagId, reasonText) => {
  const bag = dataStore.bags.find(b => b.id === bagId)
  if (!bag) {
    alert('Bag not found with this ID!')
    return
  }

  if (bag.status !== 'At security check') {
    alert(`Cannot send back. Bag ${bag.id} is not at security check. Current status: "${bag.status}".`)
    return
  }

  const returnLocation = bag.checkInLocation || 'Check-in counter'
  dataStore.updateBagStatus(bag.id, 'Sent back', returnLocation)

  const flight = getFlightById(bag.flight)
  const airline = flight?.airline || 'N/A'

  addHistory({
    action: 'Sent back to check-in',
    bagId: bag.id,
    flight: bag.flight,
    airline,
    from: 'Security check',
    to: returnLocation,
    reason: reasonText
  })

  dataStore.addAirlineMessage({
    airline,
    content: `Security violation: Bag ${bag.id} sent back to check-in (Reason: ${reasonText})`
  })

  alert(`Bag ${bag.id} sent back to check-in. Airline staff informed.`)
}

const handleReceiveAtSecurity = () => {
  receiveErrors.value = { bagId: [] }

  const bagIdValidation = validateBagId(receiveForm.value.bagId)
  if (!bagIdValidation.valid) {
    receiveErrors.value.bagId = bagIdValidation.errors
    return
  }

  moveToSecurityCheck(receiveForm.value.bagId)
  receiveForm.value.bagId = ''
}

const handleSendBack = () => {
  sendBackErrors.value = { bagId: [], reason: [] }

  const bagIdValidation = validateBagId(sendBackForm.value.bagId)
  if (!bagIdValidation.valid) {
    sendBackErrors.value.bagId = bagIdValidation.errors
  }

  const reasonValidation = validateRequired(sendBackForm.value.reason, 'Reason')
  if (!reasonValidation.valid) {
    sendBackErrors.value.reason = reasonValidation.errors
  }

  if (Object.values(sendBackErrors.value).some(errors => errors.length > 0)) return

  const reasonText = sendBackForm.value.notes
    ? `${sendBackForm.value.reason} - ${sendBackForm.value.notes}`
    : sendBackForm.value.reason

  sendBagBackToCheckIn(sendBackForm.value.bagId, reasonText)

  sendBackForm.value = { bagId: '', reason: '', notes: '' }
}

const quickSendBack = (bagId) => {
  sendBackForm.value.bagId = bagId
  sendBackForm.value.reason = ''
  sendBackForm.value.notes = ''
}

// ===== Gate mode state =====
const gateFlight = computed(() => {
  if (!selectedGate.value) return null
  return dataStore.flights.find(f => f.gate === selectedGate.value) || null
})

const gateBags = computed(() => {
  if (!selectedGate.value) return []
  return dataStore.bags.filter(b => b.status === 'At gate' && b.location === selectedGate.value)
})

const loadBagForm = ref({ bagId: '' })
const loadBagErrors = ref({ bagId: [] })

const loadBagToFlight = (bagId) => {
  const bag = dataStore.bags.find(b => b.id === bagId)
  if (!bag) {
    alert('Bag not found with this ID!')
    return
  }

  if (bag.status !== 'At gate' || bag.location !== selectedGate.value) {
    alert(`Cannot load. Bag ${bag.id} is not at gate ${selectedGate.value}. Current: ${bag.status} @ ${bag.location}`)
    return
  }

  const passenger = dataStore.passengers.find(p => p.ticketNumber === bag.ticketNumber)
  if (!passenger) {
    alert('Passenger not found for this bag!')
    return
  }

  if (passenger.status !== 'Boarded') {
    alert(`Cannot load. Passenger status is "${passenger.status}". Passenger must be "Boarded" first.`)
    return
  }

  // Update location to flight ID (per project description: Loaded = flight identifier)
  dataStore.updateBagStatus(bag.id, 'Loaded to flight', bag.flight)

  const flight = getFlightById(bag.flight)
  addHistory({
    action: 'Loaded to flight',
    bagId: bag.id,
    flight: bag.flight,
    airline: flight?.airline || 'N/A',
    from: selectedGate.value,
    to: `Loaded (${bag.flight})`
  })

  alert(`Bag ${bag.id} loaded to flight ${bag.flight}.`)
}

const handleLoadBag = () => {
  loadBagErrors.value = { bagId: [] }

  const bagIdValidation = validateBagId(loadBagForm.value.bagId)
  if (!bagIdValidation.valid) {
    loadBagErrors.value.bagId = bagIdValidation.errors
    return
  }

  loadBagToFlight(loadBagForm.value.bagId)
  loadBagForm.value.bagId = ''
}

const quickLoad = (bagId) => {
  loadBagForm.value.bagId = bagId
  handleLoadBag()
}

const setWorkLocation = (location) => {
  workLocation.value = location
  if (location !== 'gate') selectedGate.value = ''
}
</script>

<template>
  <AppLayout>
    <div class="ground-view">
      <AppCard title="Ground Crew">
        <p class="card-description">
          Select where to work first: security clearance (inside building) or at a gate.
          Ground crew can operate across all airlines.
        </p>
      </AppCard>

      <AppCard title="Select Work Location">
        <div class="work-location-buttons">
          <AppButton
            :variant="workLocation === 'security' ? 'primary' : 'secondary'"
            @click="setWorkLocation('security')"
          >
            Security Clearance
          </AppButton>
          <AppButton
            :variant="workLocation === 'gate' ? 'primary' : 'secondary'"
            @click="setWorkLocation('gate')"
          >
            At the Gate
          </AppButton>
        </div>
      </AppCard>

      <!-- ===== SECURITY CLEARANCE MODE ===== -->
      <template v-if="workLocation === 'security'">
        <div class="grid">
          <AppCard title="Bags arriving from check-in counters">
            <p class="card-description">
              Move bags from check-in counter to security check (one by one).
              Total: {{ checkInBags.length }}
            </p>

            <table class="data-table" v-if="checkInBags.length > 0">
              <thead>
                <tr>
                  <th>Bag ID</th>
                  <th>Flight</th>
                  <th>Ticket</th>
                  <th>Location</th>
                  <th style="text-align: right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="bag in checkInBags" :key="bag.id">
                  <td><span class="chip">{{ bag.id }}</span></td>
                  <td><span class="chip">{{ bag.flight }}</span></td>
                  <td>{{ bag.ticketNumber }}</td>
                  <td>{{ bag.location }}</td>
                  <td style="text-align: right">
                    <AppButton variant="primary" @click="moveToSecurityCheck(bag.id)">
                      Move to security check
                    </AppButton>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-else class="empty-state">No bags at check-in counter.</div>
          </AppCard>

          <AppCard title="Security check (clear or send back)">
            <p class="card-description">
              For each bag at security check, either clear it to the gate or send it back to check-in.
              Total: {{ securityCheckBags.length }}
            </p>

            <table class="data-table" v-if="securityCheckBags.length > 0">
              <thead>
                <tr>
                  <th>Bag ID</th>
                  <th>Flight</th>
                  <th>Airline</th>
                  <th style="text-align: right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="bag in securityCheckBags" :key="bag.id">
                  <td><span class="chip">{{ bag.id }}</span></td>
                  <td><span class="chip">{{ bag.flight }}</span></td>
                  <td>
                    <span class="badge badge-primary">
                      {{ getFlightById(bag.flight)?.airline || 'N/A' }}
                    </span>
                  </td>
                  <td style="text-align: right">
                    <div class="row-actions">
                      <AppButton variant="primary" @click="clearSecurityBag(bag.id)">
                        Clear (to gate)
                      </AppButton>
                      <AppButton variant="danger" @click="quickSendBack(bag.id)">
                        Send back
                      </AppButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-else class="empty-state">No bags currently at security check.</div>
          </AppCard>
        </div>

        <div class="grid">
          <AppCard title="Receive at security check (manual)">
            <p class="card-description">
              Optional: enter a bag ID to move it from check-in to security check.
            </p>
            <form @submit.prevent="handleReceiveAtSecurity" class="form-section">
              <FormInput
                v-model="receiveForm.bagId"
                label="Bag ID (6 digits)"
                placeholder="550102"
                :errors="receiveErrors.bagId"
                :required="true"
              />
              <AppButton type="submit" variant="primary">
                Receive at security
              </AppButton>
            </form>
          </AppCard>

          <AppCard title="Send back to check-in (with reason)">
            <p class="card-description">
              Select a reason and send the bag back. Airline staff will be informed via message board.
            </p>
            <form @submit.prevent="handleSendBack" class="form-section">
              <FormInput
                v-model="sendBackForm.bagId"
                label="Bag ID (6 digits)"
                placeholder="550103"
                :errors="sendBackErrors.bagId"
                :required="true"
              />

              <div class="form-field">
                <label class="form-label">Reason <span class="required">*</span></label>
                <select v-model="sendBackForm.reason" class="form-select">
                  <option value="">Select reason...</option>
                  <option value="Prohibited item">Prohibited item</option>
                  <option value="Suspicious content">Suspicious content</option>
                  <option value="Liquid over limit">Liquid over limit</option>
                  <option value="Damaged bag">Damaged bag</option>
                  <option value="Other">Other</option>
                </select>
                <div v-if="sendBackErrors.reason.length > 0" class="error-messages">
                  <div v-for="(error, i) in sendBackErrors.reason" :key="i" class="error-message">
                    {{ error }}
                  </div>
                </div>
              </div>

              <FormInput
                v-model="sendBackForm.notes"
                label="Notes (optional)"
                placeholder="Additional details..."
              />

              <AppButton type="submit" variant="danger">
                Send back
              </AppButton>
            </form>
          </AppCard>
        </div>

        <AppCard title="Processing history">
          <p class="card-description">
            Recent actions by ground crew (security + gate operations). Showing {{ processingHistory.length }} records.
          </p>

          <table class="data-table" v-if="processingHistory.length > 0">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Bag</th>
                <th>Flight</th>
                <th>From → To</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, idx) in processingHistory" :key="idx">
                <td>{{ r.time }}</td>
                <td>{{ r.action }}</td>
                <td><span class="chip">{{ r.bagId }}</span></td>
                <td><span class="chip">{{ r.flight }}</span></td>
                <td>{{ r.from }} → {{ r.to }}</td>
                <td>{{ r.reason || '—' }}</td>
              </tr>
            </tbody>
          </table>

          <div v-else class="empty-state">No actions yet.</div>
        </AppCard>
      </template>

      <!-- ===== GATE OPERATIONS MODE ===== -->
      <template v-if="workLocation === 'gate'">
        <AppCard title="Select Gate">
          <div class="form-field">
            <label class="form-label">Gate Number <span class="required">*</span></label>
            <select v-model="selectedGate" class="form-select">
              <option value="">-- Select a gate --</option>
              <option v-for="gate in availableGates" :key="gate" :value="gate">{{ gate }}</option>
            </select>
          </div>
        </AppCard>

        <template v-if="selectedGate">
          <AppCard title="Gate Information">
            <p class="card-description">
              Working at: <span class="badge badge-primary">{{ selectedGate }}</span>
            </p>
            <div v-if="gateFlight">
              <p><strong>Flight:</strong> {{ gateFlight.id }} ({{ gateFlight.airline }})</p>
            </div>
            <div v-else class="empty-state">No flight assigned to this gate.</div>
          </AppCard>

          <div class="grid">
            <AppCard title="Load bag (one by one)">
              <p class="card-description">
                Only bags at this gate can be loaded. Passenger must be boarded first.
              </p>

              <form @submit.prevent="handleLoadBag" class="form-section">
                <FormInput
                  v-model="loadBagForm.bagId"
                  label="Bag ID (6 digits)"
                  placeholder="550102"
                  :errors="loadBagErrors.bagId"
                  :required="true"
                />
                <AppButton type="submit" variant="primary">
                  Load bag to flight
                </AppButton>
              </form>
            </AppCard>

            <AppCard title="Bags at this gate">
              <p class="card-description">
                Showing bags physically at gate {{ selectedGate }}. Total: {{ gateBags.length }}
              </p>

              <table class="data-table" v-if="gateBags.length > 0">
                <thead>
                  <tr>
                    <th>Bag ID</th>
                    <th>Ticket</th>
                    <th>Flight</th>
                    <th style="text-align: right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="bag in gateBags" :key="bag.id">
                    <td><span class="chip">{{ bag.id }}</span></td>
                    <td>{{ bag.ticketNumber }}</td>
                    <td><span class="chip">{{ bag.flight }}</span></td>
                    <td style="text-align: right">
                      <AppButton variant="primary" @click="quickLoad(bag.id)">
                        Load
                      </AppButton>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div v-else class="empty-state">No bags at this gate.</div>
            </AppCard>
          </div>
        </template>
      </template>
    </div>
  </AppLayout>
</template>

<style scoped>
.ground-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.work-location-buttons {
  display: flex;
  gap: 12px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 16px;
}

.card-description {
  color: var(--muted);
  font-size: 14px;
  margin-bottom: 8px;
}

.empty-state {
  text-align: center;
  color: var(--muted);
  padding: 20px;
  font-size: 14px;
}

.row-actions {
  display: inline-flex;
  gap: 10px;
  justify-content: flex-end;
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

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.error-messages {
  margin-top: 4px;
}

.error-message {
  font-size: 12px;
  color: var(--bad);
  margin-top: 2px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
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
</style>
