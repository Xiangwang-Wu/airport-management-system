<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '../stores/data'
import {
  validateName,
  validateEmail,
  validatePhone,
  validateRequired
} from '../utils/validation'
import AppLayout from '../components/AppLayout.vue'
import AppCard from '../components/AppCard.vue'
import FormInput from '../components/FormInput.vue'
import AppButton from '../components/AppButton.vue'

const router = useRouter()
const dataStore = useDataStore()

// Detail modal state
const selectedStaff = ref(null)

const showStaffDetails = (staff) => { selectedStaff.value = staff }
const closeStaffDetails = () => { selectedStaff.value = null }

// New staff form
const newStaff = ref({
  type: 'Airline staff',
  name: '',
  email: '',
  phone: '',
  airline: '',
  assignment: ''
})

const createdAccount = ref(null)

const staffErrors = ref({
  name: [],
  email: [],
  phone: [],
  airline: [],
  assignment: []
})

const stats = computed(() => {
  const staff = dataStore.staff
  return {
    total: staff.length,
    airlineStaff: staff.filter(s => s.type === 'Airline staff').length,
    gateStaff: staff.filter(s => s.type === 'Gate staff').length,
    groundCrew: staff.filter(s => s.type === 'Ground crew').length
  }
})

const handleAddStaff = async () => {
  // Clear previous errors
  staffErrors.value = {
    name: [],
    email: [],
    phone: [],
    airline: [],
    assignment: []
  }

  // Validate name
  const nameValidation = validateName(newStaff.value.name, 'Name')
  if (!nameValidation.valid) {
    staffErrors.value.name = nameValidation.errors
  }

  // Validate email
  const emailValidation = validateEmail(newStaff.value.email)
  if (!emailValidation.valid) {
    staffErrors.value.email = emailValidation.errors
  }

  // Validate phone number
  const phoneValidation = validatePhone(newStaff.value.phone)
  if (!phoneValidation.valid) {
    staffErrors.value.phone = phoneValidation.errors
  }

  // Validate airline (required only for Airline staff)
  if (newStaff.value.type === 'Airline staff') {
    const airlineValidation = validateRequired(newStaff.value.airline, 'Airline')
    if (!airlineValidation.valid) {
      staffErrors.value.airline = airlineValidation.errors
    }
  }

  // Validate work assignment (required for Gate staff and Ground crew)
  if (newStaff.value.type === 'Gate staff' || newStaff.value.type === 'Ground crew') {
    const assignmentValidation = validateRequired(newStaff.value.assignment, 'Assignment')
    if (!assignmentValidation.valid) {
      staffErrors.value.assignment = assignmentValidation.errors
    }
  }

  // If there are errors, stop submission
  if (Object.values(staffErrors.value).some(errors => errors.length > 0)) {
    return
  }

  // Add staff
  const creds = await dataStore.addStaff(newStaff.value)

  // Reset form
  newStaff.value = {
    type: 'Airline staff',
    name: '',
    email: '',
    phone: '',
    airline: '',
    assignment: ''
  }

  createdAccount.value = creds
}

const handleRemoveStaff = (staffId) => {
  if (confirm('Remove this staff account?')) {
    dataStore.removeStaff(staffId)
    alert('Staff account removed successfully!')
  }
}
</script>

<template>
  <AppLayout>
    <div class="staff-view">
      <AppCard title="Admin · Staff Management">
        <p class="card-description">
          Create staff accounts (auto credentials shown as toast). Staff are small in number and managed separately from passengers.
        </p>

        <div class="kpis">
          <div class="kpi">
            <div class="kpi-label">Total staff</div>
            <div class="kpi-value">{{ stats.total }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Airline staff</div>
            <div class="kpi-value">{{ stats.airlineStaff }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Gate staff</div>
            <div class="kpi-value">{{ stats.gateStaff }}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Ground crew</div>
            <div class="kpi-value">{{ stats.groundCrew }}</div>
          </div>
        </div>
      </AppCard>

      <AppCard title="Staff List">
        <p class="card-description">
          View and manage all staff accounts.
        </p>

        <table class="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Assignment</th>
              <th style="text-align: right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="staff in dataStore.staff" :key="staff.id">
              <td><span class="chip">{{ staff.type }}</span></td>
              <td>{{ staff.name }}</td>
              <td>{{ staff.email }}</td>
              <td>{{ staff.phone }}</td>
              <td>{{ staff.assignment || staff.airline || '-' }}</td>
              <td>
                <div class="row-actions">
                  <AppButton variant="secondary" @click="showStaffDetails(staff)">
                    Details
                  </AppButton>
                  <AppButton variant="danger" @click="handleRemoveStaff(staff.id)">
                    Remove
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </AppCard>

      <AppCard title="Create Staff Account">
        <p class="card-description">
          System auto-generates username and temporary password. Staff must change password on first login.
        </p>

        <div v-if="createdAccount" class="credentials-box">
          <strong>Account created!</strong> Credentials have been sent via email. You can also copy them here:
          <div class="cred-row"><span class="cred-label">Username:</span> <code>{{ createdAccount.username }}</code></div>
          <div class="cred-row"><span class="cred-label">Temp Password:</span> <code>{{ createdAccount.temp_password }}</code></div>
          <div v-if="createdAccount.email_preview" class="cred-row">
            <span class="cred-label">Email preview:</span>
            <a :href="createdAccount.email_preview" target="_blank" class="cred-link">View sent email &rarr;</a>
          </div>
          <button class="cred-dismiss" @click="createdAccount = null">Dismiss</button>
        </div>

        <form @submit.prevent="handleAddStaff" class="form-grid">
          <div class="form-field">
            <label class="form-label">Staff type <span class="required">*</span></label>
            <select v-model="newStaff.type" class="form-select">
              <option>Airline staff</option>
              <option>Gate staff</option>
              <option>Ground crew</option>
            </select>
          </div>

          <FormInput
            v-model="newStaff.name"
            label="Name"
            placeholder="Full name"
            :errors="staffErrors.name"
            :required="true"
            help-text="At least 2 letters"
          />

          <FormInput
            v-model="newStaff.email"
            label="Email"
            type="email"
            placeholder="name@domain.com"
            :errors="staffErrors.email"
            :required="true"
            help-text="Format: XXX@XXX.XX"
          />

          <FormInput
            v-model="newStaff.phone"
            label="Phone"
            placeholder="e.g., 2145550123"
            :errors="staffErrors.phone"
            :required="true"
            help-text="10 digits, first digit cannot be 0"
          />

          <FormInput
            v-model="newStaff.airline"
            label="Airline (for Airline staff)"
            placeholder="e.g., AA"
            :errors="staffErrors.airline"
            :required="newStaff.type === 'Airline staff'"
            help-text="Required for Airline staff; optional for others"
          />

          <FormInput
            v-model="newStaff.assignment"
            label="Assignment (Gate/Station)"
            placeholder="e.g., T1-G12 or Security Station A"
            :errors="staffErrors.assignment"
            :required="newStaff.type === 'Gate staff' || newStaff.type === 'Ground crew'"
            help-text="For Gate staff or Ground crew work location"
          />

          <div class="form-actions-full">
            <AppButton variant="secondary" @click="router.push('/admin')">
              Back to Admin Console
            </AppButton>
            <AppButton variant="primary" type="submit">
              Create staff
            </AppButton>
          </div>
        </form>
      </AppCard>
    </div>
  </AppLayout>

  <!-- Staff Detail Modal -->
  <div v-if="selectedStaff" class="modal-overlay" @click.self="closeStaffDetails">
    <div class="modal">
      <div class="modal-header">
        <h3>Staff Details · {{ selectedStaff.name }}</h3>
        <button class="modal-close" @click="closeStaffDetails">&times;</button>
      </div>
      <div class="modal-body">
        <div class="detail-row"><span class="detail-label">Staff ID</span><span>{{ selectedStaff.id }}</span></div>
        <div class="detail-row"><span class="detail-label">Type</span><span class="chip">{{ selectedStaff.type }}</span></div>
        <div class="detail-row"><span class="detail-label">First Name</span><span>{{ selectedStaff.firstname }}</span></div>
        <div class="detail-row"><span class="detail-label">Last Name</span><span>{{ selectedStaff.lastname }}</span></div>
        <div class="detail-row"><span class="detail-label">Email</span><span>{{ selectedStaff.email }}</span></div>
        <div class="detail-row"><span class="detail-label">Phone</span><span>{{ selectedStaff.phone }}</span></div>
        <div class="detail-row" v-if="selectedStaff.airline"><span class="detail-label">Airline</span><span>{{ selectedStaff.airline }}</span></div>
        <div class="detail-row" v-if="selectedStaff.assignment"><span class="detail-label">Assignment</span><span>{{ selectedStaff.assignment }}</span></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.staff-view {
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

.form-actions-full {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.credentials-box {
  background: #1a3a1a;
  border: 1px solid #4caf50;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #e0ffe0;
}
.cred-row { margin-top: 8px; }
.cred-label { color: #aaa; margin-right: 8px; }
.credentials-box code {
  background: rgba(0,0,0,0.3);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 15px;
  letter-spacing: 0.5px;
}
.cred-dismiss {
  margin-top: 12px;
  background: none;
  border: 1px solid #4caf50;
  color: #4caf50;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 13px;
}
.cred-link {
  color: #7ec8e3;
  text-decoration: underline;
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
