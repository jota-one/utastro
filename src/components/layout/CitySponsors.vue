<template>
  <div v-if="citySponsors.length" class="city-sponsors">
    <div class="container">
      <h3 class="title">
        Sponsors
        <span class="hide-shadow" />
      </h3>
      <div class="list-wrapper">
        <div class="list">
          <component
            :is="linkedSponsors && sponsor.link ? 'a' : 'div'"
            v-for="sponsor in citySponsors"
            :key="sponsor.id"
            :href="(linkedSponsors && sponsor.link) || undefined"
            :target="linkedSponsors && sponsor.link ? '_blank' : undefined"
            rel="noopener"
            class="sponsor-teaser"
          >
            <img class="logo" :src="sponsor.logoUrl" :alt="sponsor.name" />
          </component>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { pb } from '@/pb'
import config from '@/config'

type Props = {
  cityId: string
}

const props = defineProps<Props>()

// production historically shows plain logos: clickable sponsor logos stay
// behind a feature flag
const linkedSponsors = config.sponsorLinks

type SponsorItem = {
  id: string
  name: string
  link: string
  logoUrl: string
}

const citySponsors = ref<SponsorItem[]>([])

onMounted(async () => {
  // Only the sponsors linked to the city — global sponsors belonged to the
  // legacy home band / sponsors page, which are not part of the new site.
  const records = await pb.collection('ut_sponsors').getFullList({
    filter: 'enabled = true',
    sort: 'name',
  })
  citySponsors.value = records
    .filter(r => (r.cities || []).includes(props.cityId))
    .map(r => ({
      id: r.id,
      name: r.name,
      link: r.link || '',
      logoUrl: pb.files.getURL(r, r.logo),
    }))
})
</script>

<style lang="postcss" scoped>
.city-sponsors {
  position: sticky;
  bottom: 0;
  background: rgb(var(--color-white));
  box-shadow: 0 0 1rem rgba(var(--color-neutral), 0.1);
  z-index: var(--z-index-main-sponsors);
}

.title {
  position: absolute;
  bottom: calc(100% - 1px);
  left: 8%;
  padding: 0.7rem 0.9rem;
  font-size: 1rem;
  font-weight: 500;
  color: rgb(var(--color-neutral-light));
  background: rgb(var(--color-white));
  border-radius: 2px;
  box-shadow: 0 0 1rem rgba(var(--color-neutral), 0.2);

  .hide-shadow {
    display: block;
    position: absolute;
    bottom: -1rem;
    left: 0;
    width: 100%;
    height: 1.5rem;
    background: inherit;
  }
}

.list-wrapper {
  position: relative;
  height: 8rem;
  max-width: 100%;
  display: flex;

  &:before,
  &:after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 6rem;
    z-index: 1;
    pointer-events: none;
  }

  &:before {
    left: 0;
    background-image: linear-gradient(90deg, white, transparent);
  }

  &:after {
    right: 0;
    background-image: linear-gradient(270deg, white, transparent);
  }
}

.list {
  height: inherit;
  align-self: center;
  display: inline-flex;
  align-items: center;
  margin: 0 auto;
  overflow: auto;

  & > * {
    flex-shrink: 0;
  }
}

.sponsor-teaser {
  height: inherit;
  position: relative;
  padding: var(--size-gap-20);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgb(var(--color-neutral-lightest));

    .logo {
      mix-blend-mode: multiply;
      filter: grayscale(1);
    }
  }
}

.logo {
  height: min(12vw, calc(100% - var(--size-gap-10)));
  width: auto;
}
</style>
