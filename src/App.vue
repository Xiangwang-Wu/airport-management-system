<script setup>
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useDataStore } from './stores/data'
import { onMounted } from 'vue'

const authStore = useAuthStore()
const dataStore = useDataStore()

onMounted(async () => {
  authStore.restoreAuth()
  await dataStore.fetchAll()
})
</script>

<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<style>
:root {
  --bg: #f0f4f8;
  --panel: #ffffff;
  --card: #ffffff;
  --muted: #6b7a99;
  --text: #1a2340;
  --line: rgba(0,0,0,.10);
  --accent: #2563eb;
  --good: #16a34a;
  --warn: #d97706;
  --bad: #dc2626;
  --shadow: 0 4px 16px rgba(0,0,0,.10);
  --radius: 16px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
}

a { color: inherit; text-decoration: none; }

/* Override dark-mode rgba values used throughout views */
select, textarea, input[type="text"], input[type="password"], input[type="email"] {
  background: #f8fafc !important;
  color: var(--text) !important;
}

select option {
  background: #ffffff !important;
  color: var(--text) !important;
}

#app {
  min-height: 100vh;
}
</style>
