<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary', // primary, secondary, danger
    validator: (value) => ['primary', 'secondary', 'danger'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <button
    :class="['btn', `btn-${variant}`]"
    :disabled="disabled"
  >
    <slot></slot>
  </button>
</template>

<style scoped>
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform .08s ease, box-shadow .15s ease, background .15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn:active:not(:disabled) {
  transform: translateY(1px);
}

.btn-primary {
  background: var(--accent);
  color: #0b1220;
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(106, 166, 255, 0.35);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
  border: 1px solid var(--line);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.10);
}

.btn-danger {
  background: var(--bad);
  color: #0b1220;
}

.btn-danger:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.35);
}

.btn-success {
  background: var(--good);
  color: #0b1220;
}

.btn-success:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(47, 224, 122, 0.35);
}
</style>
