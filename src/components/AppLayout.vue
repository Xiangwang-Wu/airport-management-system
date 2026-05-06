<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const roleDisplay = computed(() => {
  const roleMap = {
    'admin': 'Admin',
    'airline': 'Airline Staff',
    'ground': 'Ground Crew',
    'gate': 'Gate Staff',
    'passenger': 'Passenger'
  }
  return roleMap[authStore.userRole] || 'User'
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const navItems = computed(() => {
  const role = authStore.userRole

  if (role === 'admin') {
    return [
      { path: '/admin', label: 'Console', sublabel: 'Flights / Messages' },
      { path: '/admin/passengers', label: 'Passengers', sublabel: 'Manage passengers' },
      { path: '/admin/staff', label: 'Staff', sublabel: 'Manage staff' }
    ]
  } else if (role === 'airline') {
    return [
      { path: '/airline', label: 'Check-in', sublabel: 'Check-in / Bags' }
    ]
  } else if (role === 'ground') {
    return [
      { path: '/ground', label: 'Ground Crew', sublabel: 'Security / Gate operations' }
    ]
  } else if (role === 'gate') {
    return [
      { path: '/gate', label: 'Gate Staff', sublabel: 'Boarding / Ready' }
    ]
  } else if (role === 'passenger') {
    return [
      { path: '/passenger', label: 'My Info', sublabel: 'Track bag / Gate' }
    ]
  }

  return []
})
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Airport System</h2>
      </div>

      <div class="role-info">
        <div class="role-pill">
          <span>Current role</span>
          <strong>{{ roleDisplay }}</strong>
        </div>
        <div v-if="authStore.userContext" class="context-pill">
          <span>Context</span>
          <strong>{{ authStore.userContext }}</strong>
        </div>
      </div>

      <nav class="nav">
        <div class="nav-title">Pages</div>
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
        >
          <span class="nav-label">{{ item.label }}</span>
          <small class="nav-sublabel">{{ item.sublabel }}</small>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button @click="handleLogout" class="logout-btn">
          Logout
        </button>
      </div>
    </aside>

    <main class="main-content">
      <div class="content-wrapper">
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  min-height: 100vh;
  padding: 16px;
}

.sidebar {
  position: sticky;
  top: 16px;
  height: calc(100vh - 32px);
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 14px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-header {
  padding: 14px 10px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 10px;
}

.sidebar-header h2 {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
  margin: 0;
  letter-spacing: .2px;
}

.role-info {
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.role-pill,
.context-pill {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 10px;
  background: var(--bg);
  border-radius: 12px;
  border: 1px solid var(--line);
}

.role-pill span,
.context-pill span {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 700;
}

.role-pill strong,
.context-pill strong {
  font-size: 14px;
  color: var(--text);
  font-weight: 700;
}

.nav {
  flex: 1;
  padding: 16px 0;
}

.nav-title {
  font-size: 12px;
  color: var(--muted);
  font-weight: 750;
  letter-spacing: .8px;
  text-transform: uppercase;
  margin: 10px 8px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  padding: 10px 10px;
  margin: 6px 0;
  text-decoration: none;
  color: var(--text);
  transition: all 0.15s ease;
  border-radius: 12px;
  border: 1px solid transparent;
  gap: 2px;
}

.nav-item:hover {
  background: var(--bg);
  border-color: var(--line);
}

.nav-item.router-link-active {
  background: rgba(37, 99, 235, 0.10);
  border-color: rgba(37, 99, 235, 0.30);
}

.nav-label {
  font-size: 14px;
  font-weight: 600;
}

.nav-sublabel {
  font-size: 12px;
  color: var(--muted);
}

.sidebar-footer {
  padding: 10px 0 0;
  border-top: 1px solid var(--line);
  margin-top: 10px;
}

.logout-btn {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 650;
  color: var(--text);
  cursor: pointer;
  transition: transform .08s ease, background .15s ease;
}

.logout-btn:hover {
  background: var(--line);
}

.logout-btn:active {
  transform: translateY(1px);
}

.main-content {
  min-height: calc(100vh - 32px);
}

.content-wrapper {
  width: 100%;
}
</style>
