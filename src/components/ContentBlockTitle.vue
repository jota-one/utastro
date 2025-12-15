<template>
  <div class="container">
    <div class="title">
      <component :is="'h1'">
        <TextOnBg v-for="(line, i) in text.split('\n')" :key="`line-${i}`" class="line">
          {{ line }}
        </TextOnBg>
      </component>
    </div>
  </div>
</template>

<script setup lang="ts">
import TextOnBg from './TextOnBg.vue';

defineProps({
  text: {
    type: String,
    default: '',
  },
})
</script>

<style lang="postcss" scoped>
.title {
  display: block;
  margin: 0 auto;
  padding-bottom: 3rem;
  max-width: var(--size-content-width);
}

.line {
  font-size: 1.8rem;
  line-height: 1.5rem;
  font-weight: 800;
}
</style>
