<template>
  <div ref="container" class="fb-widget">
    <iframe
      :src="src"
      width="100%"
      height="100%"
      style="border: none; overflow: hidden"
      scrolling="no"
      frameborder="0"
      allowfullscreen="true"
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const width = ref(250)
const height = ref(500)
const tabs = ref('timeline')

const src = computed(
  () =>
    `https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FUrban-Training-Gratuit-373926256119280%2F&tabs=${tabs.value}&width=${width.value}&height=${height.value}&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`,
)

onMounted(() => {
  const mediaQuery = window.matchMedia('(max-width: 1024px)')

  function handleTabletChange(e: MediaQueryList | MediaQueryListEvent) {
    if (e.matches) {
      width.value = 500
      height.value = 250
    } else {
      width.value = 250
      height.value = 500
    }
  }
  // Register event listener
  mediaQuery.addEventListener('change', handleTabletChange)

  // Initial check
  handleTabletChange(mediaQuery)
})
</script>

<style lang="postcss" scoped>
@import '@styles/_mediaquery.pcss';

.fb-widget {
  margin: 0 auto;
  max-width: 500px;
  height: 130px;
  box-shadow: 0 0 0.5rem rgb(var(--color-neutral), 0.2);

  @media (--l) {
    width: 250px;
    height: 500px;
  }
}
</style>
