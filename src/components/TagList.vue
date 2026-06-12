<template>
  <div class="tag-list">
    <slot />
  </div>
</template>

<style lang="postcss" scoped>
.tag-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--size-gap-10);
}
</style>
