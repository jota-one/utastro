<template>
  <div :class="['field-wrapper', { error }]">
    <label class="label">
      <span class="header">
        {{ label }}
        <FormOptional v-if="optional" />
        <FormRequired v-if="required" />
      </span>
      <slot />
    </label>
    <div v-if="!hideError" class="error">{{ error }}&nbsp;</div>
  </div>
</template>

<script setup lang="ts">
import FormOptional from './FormOptional.vue';
import FormRequired from './FormRequired.vue';

defineProps({
  icon: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  optional: {
    type: Boolean,
  },
  required: {
    type: Boolean,
  },
  error: {
    type: String,
    default: '',
  },
  hideError: Boolean,
})
</script>

<style lang="postcss" scoped>
.field-wrapper {
  display: flex;
  flex-direction: column;
  color: rgb(var(--color-neutral));
}

.label {
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  min-height: 2.3rem;
  padding: 0.35rem 0.15rem;
  font-size: 0.76rem;
  font-weight: 500;
}

.error {
  padding: 0.15rem 0.15rem 0;
  font-size: 0.8rem;
  color: rgb(var(--color-error-text));
}
</style>
