<template>
  <div class="change-pw-wrap">
    <div class="change-pw-card">
      <h2>Change Password Required</h2>
      <p class="subtitle">You must change your password before continuing.</p>

      <form @submit.prevent="submit">
        <div class="field">
          <label>Current Password</label>
          <input v-model="currentPw" type="password" placeholder="Enter current password" required />
        </div>
        <div class="field">
          <label>New Password</label>
          <input v-model="newPw" type="password" placeholder="At least 6 characters" required />
        </div>
        <div class="field">
          <label>Confirm New Password</label>
          <input v-model="confirmPw" type="password" placeholder="Repeat new password" required />
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>
        <p v-if="success" class="success-msg">Password changed! Redirecting...</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Saving...' : 'Change Password' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const currentPw = ref('')
const newPw = ref('')
const confirmPw = ref('')
const error = ref('')
const success = ref(false)
const loading = ref(false)

async function submit() {
  error.value = ''
  if (newPw.value !== confirmPw.value) {
    error.value = 'New passwords do not match.'
    return
  }
  if (newPw.value.length < 6) {
    error.value = 'New password must be at least 6 characters.'
    return
  }
  loading.value = true
  try {
    await authStore.changePassword(currentPw.value, newPw.value)
    success.value = true
    setTimeout(() => router.push('/'), 1200)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.change-pw-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}
.change-pw-card {
  background: var(--panel);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 40px 36px;
  width: 380px;
}
h2 { margin: 0 0 6px; font-size: 1.3rem; color: var(--text); }
.subtitle { color: var(--muted); font-size: 0.9rem; margin: 0 0 24px; }
.field { margin-bottom: 16px; }
.field label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text); }
.field input {
  width: 100%; padding: 10px 12px; border: 1px solid var(--line);
  border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;
  background: #f8fafc; color: var(--text);
}
button {
  width: 100%; padding: 12px; background: var(--accent); color: #fff;
  border: none; border-radius: 8px; font-size: 1rem; font-weight: 600;
  cursor: pointer; margin-top: 8px;
}
button:disabled { opacity: 0.6; cursor: not-allowed; }
.error-msg { color: var(--bad); font-size: 0.88rem; margin: 8px 0; }
.success-msg { color: var(--good); font-size: 0.88rem; margin: 8px 0; }
</style>
