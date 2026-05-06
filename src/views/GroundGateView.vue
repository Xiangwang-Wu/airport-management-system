<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'
import {
  validateBagId,
  validateRequired
} from '../utils/validation'
import AppLayout from '../components/AppLayout.vue'
import AppCard from '../components/AppCard.vue'
import FormInput from '../components/FormInput.vue'
import AppButton from '../components/AppButton.vue'

const authStore = useAuthStore()
const dataStore = useDataStore()

// Update bag location form
const updateLocationForm = ref({
  bagId: '',
  location: ''
})

const updateLocationErrors = ref({
  bagId: [],
  location: []
})

// Load bag form
const loadBagForm = ref({
  bagId: ''
})

const loadBagErrors = ref({
  bagId: []
})

// Extract gate information from user context (e.g., "T1 Gate G12" -> "T1-G12")
const gateInfo = computed(() => {
  const context = authStore.userContext || ''
  // Match format like "T1 Gate G12" or "T1-G12"
  const match = context.match(/T(\d+).*?G(\d+)/)
  if (match) {
    return `T${match[1]}-G${match[2]}`
  }
  return 'T1-G12' // Default value
})

// Get all flights for this gate
const gateFlights = computed(() => {
  return dataStore.getFlightsByGate(gateInfo.value)
})

// Get all bags for flights at this gate
const gateBags = computed(() => {
  return dataStore.getBagsByGate(gateInfo.value)
})

// Handle update bag location
const handleUpdateLocation = () => {
  // Clear previous errors
  updateLocationErrors.value = {
    bagId: [],
    location: []
  }

  // Validate bag ID
  const bagIdValidation = validateBagId(updateLocationForm.value.bagId)
  if (!bagIdValidation.valid) {
    updateLocationErrors.value.bagId = bagIdValidation.errors
  }

  // Validate location
  const locationValidation = validateRequired(updateLocationForm.value.location, 'Location')
  if (!locationValidation.valid) {
    updateLocationErrors.value.location = locationValidation.errors
  }

  // If there are errors, stop submission
  if (Object.values(updateLocationErrors.value).some(errors => errors.length > 0)) {
    return
  }

  // Find bag
  const bag = dataStore.bags.find(b => b.id === updateLocationForm.value.bagId)
  if (!bag) {
    alert('Bag not found with this ID!')
    return
  }

  // Validate bag status must be "Security cleared"
  if (bag.status !== 'Security cleared') {
    alert(`Cannot update location. Bag status is "${bag.status}". Only bags with status "Security cleared" can be moved.`)
    return
  }

  // Validate bag belongs to a flight at this gate
  const flight = dataStore.flights.find(f => f.id === bag.flight)
  if (!flight || flight.gate !== gateInfo.value) {
    alert(`This bag belongs to flight ${bag.flight} at gate ${flight?.gate || 'unknown'}, not your gate ${gateInfo.value}!`)
    return
  }

  // Update bag location
  dataStore.updateBagStatus(updateLocationForm.value.bagId, 'Security cleared', updateLocationForm.value.location)

  alert(`Bag location updated to ${updateLocationForm.value.location}!`)

  // Reset form
  updateLocationForm.value = {
    bagId: '',
    location: ''
  }
}

// Handle load bag to flight
const handleLoadBag = () => {
  // Clear previous errors
  loadBagErrors.value = {
    bagId: []
  }

  // Validate bag ID
  const bagIdValidation = validateBagId(loadBagForm.value.bagId)
  if (!bagIdValidation.valid) {
    loadBagErrors.value.bagId = bagIdValidation.errors
  }

  // If there are errors, stop submission
  if (Object.values(loadBagErrors.value).some(errors => errors.length > 0)) {
    return
  }

  // Find bag
  const bag = dataStore.bags.find(b => b.id === loadBagForm.value.bagId)
  if (!bag) {
    alert('Bag not found with this ID!')
    return
  }

  // Validate bag belongs to a flight at this gate
  const flight = dataStore.flights.find(f => f.id === bag.flight)
  if (!flight || flight.gate !== gateInfo.value) {
    alert(`This bag belongs to flight ${bag.flight} at gate ${flight?.gate || 'unknown'}, not your gate ${gateInfo.value}!`)
    return
  }

  // Validate bag is in loading zone
  if (bag.location !== 'Loading zone') {
    alert(`Cannot load bag. Bag is currently at "${bag.location}". Only bags in "Loading zone" can be loaded to flight.`)
    return
  }

  // Validate passenger has boarded
  const passenger = dataStore.passengers.find(p => p.ticketNumber === bag.ticketNumber)
  if (!passenger) {
    alert('Passenger not found for this bag!')
    return
  }

  if (passenger.status !== 'Boarded') {
    alert(`Cannot load bag. Passenger status is "${passenger.status}". Passenger must be "Boarded" before loading their bag.`)
    return
  }

  // Update bag status to "Loaded to flight"
  dataStore.updateBagStatus(loadBagForm.value.bagId, 'Loaded to flight', 'Aircraft')

  alert('Bag loaded to flight successfully!')

  // Reset form
  loadBagForm.value = {
    bagId: ''
  }
}

const getStatusBadgeClass = (status) => {
  if (status === 'Loaded to flight') return 'badge-success'
  if (status === 'Security cleared') return 'badge-success'
  if (status === 'Checked-in') return 'badge-default'
  return 'badge-warning'
}

const canMoveBag = (bag) => {
  return bag.status === 'Security cleared'
}

const canLoadBag = (bag) => {
  return bag.location === 'Loading zone'
}
</script>

<template>
  <AppLayout>
    <div class="ground-gate-view">
      <AppCard title="Ground Gate Staff · Baggage Handling">
        <p class="card-description">
          Working at: <span class="badge badge-primary">{{ gateInfo }} ({{ authStore.userContext }})</span>
        </p>
        <p class="card-description">
          Move bags from security to staging area or loading zone. Load bags to aircraft after passenger boards.
        </p>
        <div class="help-text">
          Note: Ground gate staff can only handle bags for flights at their assigned gate ({{ gateInfo }}).
        </div>
      </AppCard>

      <div class="grid">
        <AppCard title="Update bag location">
          <p class="card-description">
            Move bags that have cleared security to staging area or loading zone. Only bags with status "Security cleared" can be moved.
          </p>

          <form @submit.prevent="handleUpdateLocation">
            <FormInput
              v-model="updateLocationForm.bagId"
              label="Bag ID (6 digits)"
              placeholder="550102"
              :errors="updateLocationErrors.bagId"
              :required="true"
            />

            <div class="form-field">
              <label class="form-label">New location <span class="required">*</span></label>
              <select v-model="updateLocationForm.location" class="form-select">
                <option value="">Select location</option>
                <option value="Staging area">Staging area</option>
                <option value="Loading zone">Loading zone</option>
              </select>
              <div class="help-text">Move bags to staging area first, then to loading zone when ready</div>
              <div v-if="updateLocationErrors.location.length > 0" class="error-messages">
                <div v-for="(error, index) in updateLocationErrors.location" :key="index" class="error-message">
                  {{ error }}
                </div>
              </div>
            </div>

            <div class="form-actions">
              <AppButton variant="primary" type="submit">
                Update location
              </AppButton>
            </div>
          </form>
        </AppCard>

        <AppCard title="Load bag to aircraft">
          <p class="card-description">
            Load bags from loading zone to aircraft. Passenger must be boarded before loading their bag.
          </p>

          <form @submit.prevent="handleLoadBag">
            <FormInput
              v-model="loadBagForm.bagId"
              label="Bag ID (6 digits)"
              placeholder="550102"
              :errors="loadBagErrors.bagId"
              :required="true"
              help-text="Only bags in Loading zone can be loaded"
            />

            <div class="form-actions">
              <AppButton variant="primary" type="submit">
                Load to aircraft
              </AppButton>
            </div>
          </form>
        </AppCard>
      </div>

      <AppCard title="Gate baggage list">
        <p class="card-description">
          Showing bags for flights at gate {{ gateInfo }}:
          <span v-for="(flight, index) in gateFlights" :key="flight.id">
            <span class="chip">{{ flight.id }}</span>
            <span v-if="index < gateFlights.length - 1">, </span>
          </span>
        </p>

        <table class="data-table">
          <thead>
            <tr>
              <th>Bag ID</th>
              <th>Ticket</th>
              <th>Flight</th>
              <th>Status / Location</th>
              <th style="text-align: right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bag in gateBags" :key="bag.id">
              <td><span class="chip">{{ bag.id }}</span></td>
              <td>{{ bag.ticketNumber }}</td>
              <td><span class="chip">{{ bag.flight }}</span></td>
              <td>
                <span class="badge" :class="getStatusBadgeClass(bag.status)">
                  {{ bag.status }} · {{ bag.location }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <AppButton
                    v-if="canMoveBag(bag)"
                    variant="secondary"
                    @click="updateLocationForm.bagId = bag.id"
                  >
                    Move
                  </AppButton>
                  <AppButton
                    v-if="canLoadBag(bag)"
                    variant="primary"
                    @click="loadBagForm.bagId = bag.id"
                  >
                    Load
                  </AppButton>
                  <span v-if="!canMoveBag(bag) && !canLoadBag(bag)" class="no-action">
                    No action available
                  </span>
                </div>
              </td>
            </tr>
            <tr v-if="gateBags.length === 0">
              <td colspan="5" style="text-align: center; color: var(--muted);">No bags found for gate {{ gateInfo }}</td>
            </tr>
          </tbody>
        </table>
      </AppCard>
    </div>
  </AppLayout>
</template>

<style scoped>
.ground-gate-view {
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

.no-action {
  font-size: 12px;
  color: var(--muted);
  font-style: italic;
}
</style>
