<script setup>
defineProps({
  title: String
})
</script>

<template>
  <div class="card">
    <div v-if="title" class="card-header">
      <h2 class="card-title">{{ title }}</h2>
    </div>
    <div class="card-body">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  border: 1px solid var(--line);
}

.card-header {
  padding: 24px;
  border-bottom: 1px solid var(--line);
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.card-body {
  padding: 24px;
}
</style>
