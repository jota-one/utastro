<template>
  <div class="tabs">
    <slot />
    <div class="tab outer">
      <slot name="outer" />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.tabs {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem;
  background: rgb(var(--color-neutral-lightest));
  overflow-y: hidden;
  overflow-x: auto;
}

.outer {
  flex: 1;
  display: flex;
  align-self: center;
  justify-content: flex-end;
  padding: 0;

  .button {
    padding-top: 0.35rem;
    padding-bottom: 0.35rem;
  }
}
</style>
