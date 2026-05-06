<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { validateUsername, validatePassword } from '../utils/validation'
import FormInput from '../components/FormInput.vue'
import AppButton from '../components/AppButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const usernameErrors = ref([])
const passwordErrors = ref([])
const loginError = ref('')
const loading = ref(false)

// Clear errors as user types
function onUsernameInput() { usernameErrors.value = []; loginError.value = '' }
function onPasswordInput() { passwordErrors.value = []; loginError.value = '' }

const handleLogin = async () => {
  usernameErrors.value = []
  passwordErrors.value = []
  loginError.value = ''

  const isAdmin = username.value.toLowerCase() === 'admin'
  const usernameValidation = validateUsername(username.value, isAdmin)
  if (!usernameValidation.valid) usernameErrors.value = usernameValidation.errors

  if (!password.value) { passwordErrors.value = ['Password is required']; return }

  if (usernameErrors.value.length > 0) return

  loading.value = true
  try {
    const data = await authStore.login(username.value, password.value)
    if (data.must_change_password) {
      router.push('/change-password')
    } else {
      const routeMap = { admin: '/admin', airline: '/airline', ground: '/ground', gate: '/gate' }
      router.push(routeMap[data.role] || '/admin')
    }
  } catch (e) {
    loginError.value = e.message || 'Invalid username or password'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-left">
      <div class="branding">
        <div class="logo">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 10L70 25V55L40 70L10 55V25L40 10Z" stroke="white" stroke-width="3" fill="rgba(255,255,255,0.1)"/>
            <path d="M40 25L55 32.5V47.5L40 55L25 47.5V32.5L40 25Z" fill="white"/>
          </svg>
        </div>
        <h1>Airport Management System</h1>
        <p class="subtitle">Comprehensive flight, passenger, and staff management platform</p>

        <div class="features">
          <div class="feature">
            <div class="feature-icon">✓</div>
            <div class="feature-text">Multi-role access control</div>
          </div>
          <div class="feature">
            <div class="feature-icon">✓</div>
            <div class="feature-text">Real-time flight tracking</div>
          </div>
          <div class="feature">
            <div class="feature-icon">✓</div>
            <div class="feature-text">Baggage management system</div>
          </div>
          <div class="feature">
            <div class="feature-icon">✓</div>
            <div class="feature-text">Complete validation framework</div>
          </div>
        </div>

        <div class="footer-info">
          <p>CS 5336/7336 - Web Application Development</p>
          <p>Assignment 4 - Spring 2026</p>
        </div>
      </div>
    </div>

    <div class="login-right">
      <div class="login-form-container">
        <div class="form-header">
          <h2>Welcome Back</h2>
          <p>Please login to continue</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <FormInput
            v-model="username"
            label="Username"
            placeholder="Enter username"
            :errors="usernameErrors"
            :required="true"
            help-text="Format: lastname + two digits (e.g., smith12); admin has no format rule"
            @input="onUsernameInput"
          />

          <FormInput
            v-model="password"
            label="Password"
            type="password"
            placeholder="Enter password"
            :errors="passwordErrors"
            :required="true"
            help-text="At least 6 characters with uppercase, lowercase, and digit"
            @input="onPasswordInput"
          />

          <div v-if="loginError" class="login-error">{{ loginError }}</div>

          <AppButton variant="primary" type="submit" class="login-btn" :disabled="loading">
            {{ loading ? 'Logging in...' : 'Login' }}
          </AppButton>

          <div class="test-accounts">
            <p class="test-title">Test Accounts:</p>
            <p>Admin: admin / Test123</p>
            <p>Airline Staff: chen12 / Test123</p>
            <p>Gate Staff: smith12 / Test123</p>
            <p>Ground Crew: garcia23 / Test123</p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, rgba(30,60,114,0.6) 0%, rgba(42,82,152,0.4) 50%, rgba(126,34,206,0.3) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  position: relative;
  overflow: hidden;
}

.login-left::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
  animation: float 20s infinite ease-in-out;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-20px, 20px) rotate(5deg); }
}

.branding {
  max-width: 600px;
  color: var(--text);
  position: relative;
  z-index: 1;
}

.logo {
  margin-bottom: 40px;
}

.branding h1 {
  font-size: 52px;
  font-weight: 800;
  margin-bottom: 20px;
  line-height: 1.2;
  letter-spacing: -1px;
}

.subtitle {
  font-size: 20px;
  color: var(--muted);
  margin-bottom: 60px;
  font-weight: 300;
  line-height: 1.6;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 80px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 16px;
}

.feature-icon {
  width: 32px;
  height: 32px;
  background: rgba(106, 166, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--accent);
  flex-shrink: 0;
}

.feature-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text);
}

.footer-info {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.8;
}

.login-right {
  flex: 1;
  background: var(--panel);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.login-form-container {
  width: 100%;
  max-width: 480px;
}

.form-header {
  margin-bottom: 36px;
}

.form-header h2 {
  font-size: 32px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 10px;
}

.form-header p {
  font-size: 15px;
  color: var(--muted);
}

.login-form {
  background: var(--card);
  padding: 40px;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
}

.form-field {
  margin-bottom: 20px;
}

.login-error {
  background: rgba(255,107,107,0.15);
  border: 1px solid var(--bad);
  color: var(--bad);
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 12px;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text);
}

.required {
  color: var(--bad);
  margin-left: 2px;
}

.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  font-size: 15px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s;
}

.form-select option {
  background: var(--card);
  color: var(--text);
}

.form-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(106, 166, 255, 0.15);
}

.help-text {
  margin-top: 6px;
  font-size: 12px;
  color: var(--muted);
}

.login-btn {
  width: 100%;
  margin-top: 28px;
  padding: 14px;
  font-size: 16px;
}

.test-accounts {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  text-align: center;
}

.test-title {
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 8px;
  font-size: 13px;
}

.test-accounts p {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0;
  font-family: 'Courier New', monospace;
}

@media (max-width: 1024px) {
  .login-left {
    display: none;
  }
  .login-right {
    flex: 1;
  }
}
</style>
