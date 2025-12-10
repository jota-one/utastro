<template>
  <!-- <LayoutCitySponsors v-if="isCityPage" /> -->
  <footer class="footer">
    <div class="container">
      <NuxtLink :href="homePage?.path" class="homepage-link" no-prefetch>
        <Logo class="logo" />
      </NuxtLink>
      <nav class="navigation">
        <NuxtLink
          v-for="navItem in navigationItems"
          :key="navItem.path"
          no-prefetch
          :href="navItem.path"
          class="link"
        >
          {{ navItem.label }}
        </NuxtLink>
      </nav>
      <div class="bottom">
        <div class="social">
          <a
            href="https://www.youtube.com/channel/UC253drkLYXxi-Il0StN_qxg"
            target="_blank"
          >
            <Icon class="yt" name="youtube" />
          </a>
          <a
            href="https://www.facebook.com/Urban-Training-Gratuit-373926256119280/"
            target="_blank"
          >
            <Icon class="fb" name="facebook" />
          </a>
          <a
            class="jota"
            href="https://jota.one"
            target="_blank"
            rel="noopener"
            title="Crafted by Jota"
            aria-label="Crafted by Jota"
          >
            <img src="/img/logo/jota.svg" class="jota" />
          </a>
        </div>
        <div class="credits">
          &copy; 2010 - {{ new Date().getFullYear() }}
          <NuxtLink to="/fr/contact" no-prefetch>
            {{ t('common_main_credits') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// const { getI36n } = useI36n()
// const { currentPage, homePage, navigation, pages } = useNavigation()
// const { $label: t } = getI36n()
const homePage = computed(() => ({
  path: '/',
}))

const navigationItems = computed(() =>
  // navigation.value
  //   .filter(page => page.show !== 'never')
  //   .sort((ni1, ni2) =>
  //     ni1.sort > ni2.sort ? 1 : ni1.sort === ni2.sort ? 0 : -1,
  //   ),
  [{
    label: 'About',
    path: '/about',
  }, {
    label: 'Contact',
    path: '/contact',
  }]
)

const t = (key: string) => {
  const translations: Record<string, string> = {
    common_main_credits: 'All rights reserved.',
  }
  return translations[key] || key
}

// const cityPage = computed(() =>
//   Object.values(pages.value).find(page => page.name === 'city'),
// )

// const isCityPage = computed(() => currentPage.value?.id === cityPage.value?.id)
</script>

<style lang="postcss" scoped>
@import '@styles/_mediaquery.pcss';

.footer {
  font-size: 0.9rem;
  background: rgb(var(--color-secondary));
}

.container {
  padding-top: var(--size-gap-60);
  padding-bottom: var(--size-gap-40);
  display: flex;
  flex-direction: column;
  gap: var(--size-gap-30);
}

.homepage-link {
  align-self: flex-start;
}

.logo {
  filter: grayscale(1);
  opacity: 0.7;

  &:hover {
    opacity: 0.85;
  }
}

.navigation {
  display: flex;
  flex-direction: column;
  column-gap: var(--size-gap-20);
  row-gap: var(--size-gap-10);
  padding-bottom: var(--size-gap-20);

  @media (--m) {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

.link {
  padding: 0.2rem;
  font-size: 0.9rem;
  font-weight: 300;
  color: rgba(var(--color-secondary-text), 0.8);

  &:hover {
    color: rgb(var(--color-primary-hover));
  }

  @media (--l) {
    font-weight: 500;
  }
}

.bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--size-gap-20);
}

.social {
  display: flex;
  flex-wrap: wrap;
  gap: var(--size-gap-20);
  align-items: center;
  color: rgb(var(--color-primary));

  * > :hover {
    color: rgb(var(--color-primary-hover));
  }
}

.yt {
  width: 2rem;
  height: 2rem;
}

.fb {
  width: 1.7rem;
  height: 1.7rem;
}

.credits {
  font-size: 0.8rem;
  color: rgba(var(--color-secondary-text), 0.5);
}

.jota {
  flex-basis: 100%;

  @media (--m) {
    flex-basis: auto;
  }
}
</style>
