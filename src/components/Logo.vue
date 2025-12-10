<template>
  <div :class="['logo', { boxed, corporate }]">
    <svg v-if="boxed" class="bg" viewBox="0 0 2488 163">
      <path d="M0 0L50.2449 163L2487.01 0H0Z" />
    </svg>
    <svg v-if="boxed" class="box" viewBox="0 0 297 111">
      <path d="M0.40625 0L34.6265 111L296.839 93.4623L293.014 0H0.40625Z" />
    </svg>
    <div class="text-wrapper">
      <img class="text" src="/img/logo/ut.svg" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  boxed: Boolean,
  corporate: Boolean,
})
</script>

<style lang="postcss" scoped>
.logo {
  display: inline-flex;
  align-items: flex-start;

  &.boxed {
    position: relative;
    height: 9.6rem;
    margin-left: -3.25rem;
    margin-bottom: -1rem;
  }
}

.bg {
  position: absolute;
  top: -1.24rem;
  left: calc(50% - 145rem / 3);
  width: 145rem;
  fill: rgb(var(--color-black));
  opacity: 0.1;
  z-index: -1;
}

.text-wrapper {
  .boxed & {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.box {
  width: 15rem;
  color: rgb(var(--color-black));
}

.text {
  width: 8.5rem;
}
</style>
