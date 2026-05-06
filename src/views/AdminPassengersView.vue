<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '../stores/data'
import {
  validateName,
  validateIdNumber,
  validateTicketNumber,
  validateRequired
} from '../utils/validation'
import AppLayout from '../components/AppLayout.vue'
import AppCard from '../components/AppCard.vue'
import FormInput from '../components/FormInput.vue'
import AppButton from '../components/AppButton.vue'

const router = useRouter()
const dataStore = useDataStore()

// Detail modal state
const selectedPassenger = ref(null)

const showPassengerDetails = (passenger) => { selectedPassenger.value = passenger }
const closePassengerDetails = () => { selectedPassenger.value = null }

// New passenger form
const newPassenger = ref({
  firstName: '',
  lastName: '',
  idNumber: '',
  ticketNumber: '',
  flight: '',
  status: 'Not-checked-in'
})

const passengerErrors = ref({
  firstName: [],
  lastName: [],
  idNumber: [],
  ticketNumber: [],
  flight: []
})

const stats = computed(() => {
  const passengers = dataStore.passengers
  return {
    total: passengers.length,
    checkedIn: passengers.filter(p => p.status === 'Checked-in').length,
    boarded: passengers.filter(p => p.status === 'Boarded').length,
    notCheckedIn: passengers.filter(p => p.status === 'Not-checked-in').length
  }
})

const handleAddPassenger = () => {
  // Clear previous errors
  passengerErrors.value = {
    firstName: [],
    lastName: [],
    idNumber: [],
    ticketNumber: [],
    flight: []
  }

  // Validate first name
  const firstNameValidation = validateName(newPassenger.value.firstName, 'First name')
  if (!firstNameValidation.valid) {
    passengerErrors.value.firstName = firstNameValidation.errors
  }

  // Validate last name
  const lastNameValidation = validateName(newPassenger.value.lastName, 'Last name')
  if (!lastNameValidation.valid) {
    passengerErrors.value.lastName = lastNameValidation.errors
  }

  // Validate ID number
  const idValidation = validateIdNumber(newPassenger.value.idNumber)
  if (!idValidation.valid) {
    passengerErrors.value.idNumber = idValidation.errors
  }

  // Validate ticket number
  const ticketValidation = validateTicketNumber(newPassenger.value.ticketNumber)
  if (!ticketValidation.valid) {
    passengerErrors.value.ticketNumber = ticketValidation.errors
  }

  // Validate flight
  const flightValidation = validateRequired(newPassenger.value.flight, 'Flight')
  if (!flightValidation.valid) {
    passengerErrors.value.flight = flightValidation.errors
  }

  // If there are errors, stop submission
  if (Object.values(passengerErrors.value).some(errors => errors.length > 0)) {
    return
  }

  // Add passenger
  dataStore.addPassenger(newPassenger.value)

  // Reset form
  newPassenger.value = {
    firstName: '',
    lastName: '',
    idNumber: '',
    ticketNumber: '',
    flight: '',
    status: 'Not-checked-in'
  }

  alert('Passenger added successfully!')
}

const handleRemovePassenger = (passengerId) => {
  if (confirm('Remove this passenger?')) {
    dataStore.removePassenger(passengerId)
    alert('Passenger removed successfully!')
  }
}

const getStatusBadgeClass = (status) => {
  if (status === 'Boarded') return 'badge-success'
  if (status === 'Checked-in') return 'badge-warning'
  return 'badge-default'
}
</script>

<template>
  <AppLayout>
    <div class="passengers-view">
      <AppCard title="Admin · Passenger Management">
        <p class="card-description">
          Add passengers (ticket purchase), view/remove records. Passengers are large in number (thousands) and managed separately from staff.
        </p>

        <div class="kpis">
          <div class="kpi">
            <div class="kpi-label">Total passengers</div>
            <div class="kpi-value">{{ stats.total }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Checked-in</div>
            <div class="kpi-value">{{ stats.checkedIn }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Boarded</div>
            <div class="kpi-value">{{ stats.boarded }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Not checked-in</div>
            <div class="kpi-value">{{ stats.notCheckedIn }}</div>
          </div>
        </div>
      </AppCard>

      <AppCard title="Passenger List">
        <p class="card-description">
          Search and filter passengers by flight, status, or ticket number.
        </p>

        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Ticket</th>
              <th>Flight</th>
              <th>Status</th>
              <th style="text-align: right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="passenger in dataStore.passengers" :key="passenger.id">
              <td>{{ passenger.firstName }} {{ passenger.lastName }}</td>
              <td>{{ passenger.ticketNumber }}</td>
              <td><span class="chip">{{ passenger.flight }}</span></td>
              <td>
                <span class="badge" :class="getStatusBadgeClass(passenger.status)">
                  {{ passenger.status }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <AppButton variant="secondary" @click="showPassengerDetails(passenger)">
                    Details
                  </AppButton>
                  <AppButton variant="danger" @click="handleRemovePassenger(passenger.id)">
                    Remove
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </AppCard>

      <AppCard title="Add Passenger (Ticket Purchase)">
        <p class="card-description">
          Create a new passenger record when a ticket is purchased.
        </p>

        <form @submit.prevent="handleAddPassenger" class="form-grid">
          <FormInput
            v-model="newPassenger.firstName"
            label="First name (≥2 letters)"
            placeholder="Firstname"
            :errors="passengerErrors.firstName"
            :required="true"
          />

          <FormInput
            v-model="newPassenger.lastName"
            label="Last name (≥2 letters)"
            placeholder="Lastname"
            :errors="passengerErrors.lastName"
            :required="true"
          />

          <FormInput
            v-model="newPassenger.idNumber"
            label="ID number (6 digits)"
            placeholder="e.g., 123456"
            :errors="passengerErrors.idNumber"
            :required="true"
          />

          <FormInput
            v-model="newPassenger.ticketNumber"
            label="Ticket number (10 digits)"
            placeholder="e.g., 1234567890"
            :errors="passengerErrors.ticketNumber"
            :required="true"
          />

          <div class="form-field">
            <label class="form-label">Flight <span class="required">*</span></label>
            <select v-model="newPassenger.flight" class="form-select">
              <option value="">Select flight</option>
              <option v-for="flight in dataStore.flights" :key="flight.id" :value="flight.id">
                {{ flight.id }}
              </option>
            </select>
            <div v-if="passengerErrors.flight.length > 0" class="error-messages">
              <div v-for="(error, index) in passengerErrors.flight" :key="index" class="error-message">
                {{ error }}
              </div>
            </div>
          </div>

          <div class="form-field">
            <label class="form-label">Status <span class="required">*</span></label>
            <select v-model="newPassenger.status" class="form-select">
              <option>Not-checked-in</option>
              <option>Checked-in</option>
              <option>Boarded</option>
            </select>
          </div>

          <div class="form-actions-full">
            <AppButton variant="secondary" @click="router.push('/admin')">
              Back to Admin Console
            </AppButton>
            <AppButton variant="primary" type="submit">
              Add passenger
            </AppButton>
          </div>
        </form>
      </AppCard>
    </div>
  </AppLayout>

  <!-- Passenger Detail Modal -->
  <div v-if="selectedPassenger" class="modal-overlay" @click.self="closePassengerDetails">
    <div class="modal">
      <div class="modal-header">
        <h3>Passenger Details</h3>
        <button class="modal-close" @click="closePassengerDetails">&times;</button>
      </div>
      <div class="modal-body">
        <div class="detail-row"><span class="detail-label">First Name</span><span>{{ selectedPassenger.firstName }}</span></div>
        <div class="detail-row"><span class="detail-label">Last Name</span><span>{{ selectedPassenger.lastName }}</span></div>
        <div class="detail-row"><span class="detail-label">ID Number</span><span>{{ selectedPassenger.idNumber }}</span></div>
        <div class="detail-row"><span class="detail-label">Ticket Number</span><span>{{ selectedPassenger.ticketNumber }}</span></div>
        <div class="detail-row"><span class="detail-label">Flight</span><span class="chip">{{ selectedPassenger.flight }}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span>{{ selectedPassenger.status }}</span></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.passengers-view {
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

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 12px;
}

.badge-success {
  background: rgba(47,224,122,0.15);
  color: var(--good);
}

.badge-warning {
  background: rgba(255,204,102,0.15);
  color: var(--warn);
}

.badge-default {
  background: rgba(255,255,255,0.06);
  color: var(--muted);
}

.row-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
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

.error-messages {
  margin-top: 4px;
}

.error-message {
  font-size: 12px;
  color: var(--bad);
  margin-top: 2px;
}

.form-actions-full {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal {
  background: var(--panel); border: 1px solid var(--line); border-radius: 10px;
  width: 480px; max-width: 95vw;
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
</style>
