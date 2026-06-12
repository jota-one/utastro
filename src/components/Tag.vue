<template>
  <div class="tag">
    {{ label }}
  </div>
</template>

<script setup lang="ts">
defineProps({
  label: {
    type: String,
    default: '',
  },
})
</script>

<style lang="postcss" scoped>
.tag {
  padding: 0.35rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgb(var(--color-white));
  border: none;
  border-radius: 2px;
  background: rgb(var(--color-neutral-dark));
  box-shadow: 0 0 3px rgba(var(--color-neutral-dark), 0.2);
}
</style>
