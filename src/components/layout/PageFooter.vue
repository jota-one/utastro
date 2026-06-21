<template>
  <!-- <LayoutCitySponsors v-if="isCityPage" /> -->
  <footer class="footer">
    <div class="container">
      <a :href="route('home')" class="homepage-link" no-prefetch>
        <Logo class="logo" />
      </a>
      <nav class="navigation">
        <a
          v-for="navItem in navigationItems"
          :key="navItem.path"
          no-prefetch
          :href="navItem.path"
          class="link"
        >
          {{ navItem.label }}
        </a>
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
          <a :href="route('contact')" no-prefetch>
            {{ t('common_main_credits') }}
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI36n } from '@jota-one/i36n'
import Logo from '@components/Logo.vue'
import Icon from '@components/Icon.vue'
import { useRoutes } from '@composables/useRoutes'

const { t } = useI36n()
const { route, navItems: navigationItems } = useRoutes()
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
