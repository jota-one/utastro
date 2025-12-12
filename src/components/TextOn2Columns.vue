<template>
  <div class="container slimmer">
    <div class="column">
      <div v-html="column1" />
    </div>
    <div class="column">
      <div v-html="column2" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  column1: string
  column2: string
}

defineProps<Props>()
</script>

<style lang="postcss" scoped>
@import '@styles/_mediaquery.pcss';
.container {
  display: flex;
  flex-direction: column;
  column-gap: var(--size-gap-110);

  @media (--m) {
    flex-direction: row;
  }
}
</style>
