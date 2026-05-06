<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: String,
  label: String,
  type: {
    type: String,
    default: 'text'
  },
  placeholder: String,
  errors: {
    type: Array,
    default: () => []
  },
  required: {
    type: Boolean,
    default: false
  },
  helpText: String
})

const emit = defineEmits(['update:modelValue'])

const hasErrors = computed(() => props.errors && props.errors.length > 0)

const updateValue = (event) => {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <div class="form-field">
    <label v-if="label" class="form-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      @input="updateValue"
      :class="['form-input', { 'has-error': hasErrors }]"
    />
    <div v-if="helpText && !hasErrors" class="help-text">{{ helpText }}</div>
    <div v-if="hasErrors" class="error-messages">
      <div v-for="(error, index) in errors" :key="index" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-field {
  margin-bottom: 20px;
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

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text);
}

.form-input::placeholder {
  color: var(--muted);
  opacity: 0.6;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(106, 166, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

.form-input.has-error {
  border-color: var(--bad);
  background: rgba(255, 107, 107, 0.08);
}

.form-input.has-error:focus {
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.15);
}

.help-text {
  margin-top: 6px;
  font-size: 12px;
  color: var(--muted);
}

.error-messages {
  margin-top: 6px;
}

.error-message {
  font-size: 13px;
  color: var(--bad);
  margin-top: 4px;
  font-weight: 500;
}
</style>
