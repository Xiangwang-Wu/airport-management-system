<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useDataStore } from '../stores/data'
import { validateBagId, validateRequired } from '../utils/validation'
import AppLayout from '../components/AppLayout.vue'
import AppCard from '../components/AppCard.vue'
import FormInput from '../components/FormInput.vue'
import AppButton from '../components/AppButton.vue'

const authStore = useAuthStore()
const dataStore = useDataStore()

// Security clearance form
const clearanceForm = ref({
  bagId: ''
})

const clearanceErrors = ref({
  bagId: []
})

// Send back bag form
const sendBackForm = ref({
  bagId: '',
  reason: '',
  notes: ''
})

const sendBackErrors = ref({
  bagId: [],
  reason: []
})

// Processing history
const processingHistory = ref([])

// Get list of bags pending security check (status: "Checked-in")
const pendingBags = computed(() => {
  return dataStore.bags.filter(bag => bag.status === 'Checked-in')
})

// Get security station information
const securityStation = computed(() => {
  return authStore.userContext || 'Security Station A'
})

// Handle security clearance
const handleSecurityClearance = () => {
  // Clear previous errors
  clearanceErrors.value = {
    bagId: []
  }

  // Validate bag ID
  const bagIdValidation = validateBagId(clearanceForm.value.bagId)
  if (!bagIdValidation.valid) {
    clearanceErrors.value.bagId = bagIdValidation.errors
    return
  }

  // Find bag
  const bag = dataStore.bags.find(b => b.id === clearanceForm.value.bagId)
  if (!bag) {
    alert('Bag not found with this ID!')
    return
  }

  // Validate bag status
  if (bag.status !== 'Checked-in') {
    alert(`Bag ${bag.id} is not in Checked-in status. Current status: ${bag.status}`)
    return
  }

  // Update bag status to "Security cleared"
  dataStore.updateBagStatus(bag.id, 'Security cleared', securityStation.value)

  // Add to processing history
  const flight = dataStore.flights.find(f => f.id === bag.flight)
  processingHistory.value.unshift({
    bagId: bag.id,
    flight: bag.flight,
    airline: flight ? flight.airline : 'N/A',
    status: 'Security cleared',
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    station: securityStation.value
  })

  alert(`Bag ${bag.id} has been cleared through security!`)

  // Reset form
  clearanceForm.value.bagId = ''
}

// Handle send back bag
const handleSendBack = () => {
  // Clear previous errors
  sendBackErrors.value = {
    bagId: [],
    reason: []
  }

  // Validate bag ID
  const bagIdValidation = validateBagId(sendBackForm.value.bagId)
  if (!bagIdValidation.valid) {
    sendBackErrors.value.bagId = bagIdValidation.errors
  }

  // Validate reason
  const reasonValidation = validateRequired(sendBackForm.value.reason, 'Reason')
  if (!reasonValidation.valid) {
    sendBackErrors.value.reason = reasonValidation.errors
  }

  // If there are errors, stop submission
  if (Object.values(sendBackErrors.value).some(errors => errors.length > 0)) {
    return
  }

  // Find bag
  const bag = dataStore.bags.find(b => b.id === sendBackForm.value.bagId)
  if (!bag) {
    alert('Bag not found with this ID!')
    return
  }

  // Validate bag status
  if (bag.status !== 'Checked-in') {
    alert(`Bag ${bag.id} is not in Checked-in status. Current status: ${bag.status}`)
    return
  }

  // Update bag status to "Sent back"
  dataStore.updateBagStatus(bag.id, 'Sent back', securityStation.value)

  // Add to processing history
  const flight = dataStore.flights.find(f => f.id === bag.flight)
  const reasonText = sendBackForm.value.notes
    ? `${sendBackForm.value.reason} - ${sendBackForm.value.notes}`
    : sendBackForm.value.reason

  processingHistory.value.unshift({
    bagId: bag.id,
    flight: bag.flight,
    airline: flight ? flight.airline : 'N/A',
    status: 'Sent back',
    reason: reasonText,
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    station: securityStation.value
  })

  alert(`Bag ${bag.id} has been sent back. Reason: ${reasonText}`)

  // Reset form
  sendBackForm.value = {
    bagId: '',
    reason: '',
    notes: ''
  }
}

// Quick security clearance (from list)
const quickClearBag = (bagId) => {
  const bag = dataStore.bags.find(b => b.id === bagId)
  if (!bag) return

  dataStore.updateBagStatus(bag.id, 'Security cleared', securityStation.value)

  const flight = dataStore.flights.find(f => f.id === bag.flight)
  processingHistory.value.unshift({
    bagId: bag.id,
    flight: bag.flight,
    airline: flight ? flight.airline : 'N/A',
    status: 'Security cleared',
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    station: securityStation.value
  })

  alert(`Bag ${bag.id} has been cleared through security!`)
}

// Get status badge class
const getStatusBadgeClass = (status) => {
  if (status === 'Security cleared') return 'badge-success'
  if (status === 'Sent back') return 'badge-danger'
  if (status === 'Checked-in') return 'badge-default'
  return 'badge-warning'
}
</script>

<template>
  <AppLayout>
    <div class="security-view">
      <AppCard title="Ground Security · Security Clearance">
        <p class="card-description">
          Working at: <span class="badge badge-primary">{{ securityStation }}</span>
        </p>
        <p class="card-description">
          Process security checks for all airlines. Update bag status to "Security cleared" or "Sent back" based on inspection results.
        </p>
        <div class="help-text">
          Note: Ground security staff process bags from all airlines at their assigned security station.
        </div>
      </AppCard>

      <div class="grid">
        <AppCard title="Security clearance">
          <p class="card-description">
            Scan or enter bag ID to clear through security. Bag must be in "Checked-in" status.
          </p>

          <form @submit.prevent="handleSecurityClearance">
            <FormInput
              v-model="clearanceForm.bagId"
              label="Bag ID (6 digits)"
              placeholder="550102"
              :errors="clearanceErrors.bagId"
              :required="true"
            />

            <div class="form-actions">
              <AppButton variant="primary" type="submit">
                Clear through security
              </AppButton>
            </div>
          </form>
        </AppCard>

        <AppCard title="Send back bag">
          <p class="card-description">
            If a bag fails security inspection, send it back with a reason.
          </p>

          <form @submit.prevent="handleSendBack">
            <FormInput
              v-model="sendBackForm.bagId"
              label="Bag ID (6 digits)"
              placeholder="550102"
              :errors="sendBackErrors.bagId"
              :required="true"
            />

            <div class="form-field">
              <label class="form-label">Reason <span class="required">*</span></label>
              <select v-model="sendBackForm.reason" class="form-select">
                <option value="">Select reason</option>
                <option value="Liquid over limit">Liquid over limit</option>
                <option value="Prohibited items">Prohibited items</option>
                <option value="Suspicious content">Suspicious content</option>
                <option value="Other">Other</option>
              </select>
              <div v-if="sendBackErrors.reason.length > 0" class="error-messages">
                <div v-for="(error, index) in sendBackErrors.reason" :key="index" class="error-message">
                  {{ error }}
                </div>
              </div>
            </div>

            <div class="form-field">
              <label class="form-label">Additional notes</label>
              <textarea
                v-model="sendBackForm.notes"
                class="form-textarea"
                placeholder="Provide additional details about the issue..."
              ></textarea>
              <div class="help-text">Optional: Add more details about why the bag was sent back</div>
            </div>

            <div class="form-actions">
              <AppButton variant="danger" type="submit">
                Send back bag
              </AppButton>
            </div>
          </form>
        </AppCard>
      </div>

      <AppCard title="Pending security check">
        <p class="card-description">
          Bags waiting for security clearance (status: "Checked-in"). Total: {{ pendingBags.length }}
        </p>

        <table class="data-table">
          <thead>
            <tr>
              <th>Bag ID</th>
              <th>Ticket</th>
              <th>Flight</th>
              <th>Airline</th>
              <th>Current Location</th>
              <th style="text-align: right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bag in pendingBags" :key="bag.id">
              <td><span class="chip">{{ bag.id }}</span></td>
              <td>{{ bag.ticketNumber }}</td>
              <td><span class="chip">{{ bag.flight }}</span></td>
              <td>
                <span class="badge badge-primary">
                  {{ dataStore.flights.find(f => f.id === bag.flight)?.airline || 'N/A' }}
                </span>
              </td>
              <td>{{ bag.location }}</td>
              <td>
                <div class="row-actions">
                  <AppButton variant="primary" @click="quickClearBag(bag.id)">
                    Clear
                  </AppButton>
                </div>
              </td>
            </tr>
            <tr v-if="pendingBags.length === 0">
              <td colspan="6" style="text-align: center; color: var(--muted);">No bags pending security check</td>
            </tr>
          </tbody>
        </table>
      </AppCard>

      <AppCard title="Processing history">
        <p class="card-description">
          Recent bags processed at {{ securityStation }}. Showing last {{ processingHistory.length }} records.
        </p>

        <table class="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Bag ID</th>
              <th>Flight</th>
              <th>Airline</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in processingHistory" :key="index">
              <td>{{ record.time }}</td>
              <td><span class="chip">{{ record.bagId }}</span></td>
              <td><span class="chip">{{ record.flight }}</span></td>
              <td>
                <span class="badge badge-primary">{{ record.airline }}</span>
              </td>
              <td>
                <span class="badge" :class="getStatusBadgeClass(record.status)">
                  {{ record.status }}
                </span>
              </td>
              <td>
                <span v-if="record.reason" class="reason-text">{{ record.reason }}</span>
                <span v-else class="help-text">Cleared successfully</span>
              </td>
            </tr>
            <tr v-if="processingHistory.length === 0">
              <td colspan="6" style="text-align: center; color: var(--muted);">No processing history yet</td>
            </tr>
          </tbody>
        </table>
      </AppCard>
    </div>
  </AppLayout>
</template>

<style scoped>
.security-view {
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

.reason-text {
  font-size: 13px;
  color: var(--bad);
  font-weight: 500;
}
</style>
