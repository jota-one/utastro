<template>
  <span class="optional">
    {{ t('common_optional') }}
  </span>
</template>

<script setup lang="ts">
const t = (key: string) => key // @todo: implement i18n
</script>

<style lang="postcss" scoped>
.optional {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  font-size: 0.7rem;
  font-weight: 500;
  color: rgb(var(--color-info));
  border-radius: 3px;
  background: rgb(var(--color-info-bg));
}
</style>
