<template>
  <span class="filled">
    {{ t('common_filled') }}
  </span>
</template>

<script setup lang="ts">
import { useI36n } from '@jota-one/i36n'
const { t } = useI36n()
</script>

<style lang="postcss" scoped>
.filled {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  font-size: 0.7rem;
  font-weight: 500;
  color: rgb(var(--color-success-text));
  border-radius: 3px;
  background: rgb(var(--color-success-bg));
}
</style>
