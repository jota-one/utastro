<template>
  <div class="hero container wide">
    <AngledBoxesRow class="boxes" :boxes="['main', 'cta']">
      <template #box="{ item }">
        <div v-if="item === 'main'" class="main">
          <img class="bg-image" decoding="async" src="/img/hero.jpg" width="100%" height="100%" />
          <div class="bg-image-color" />
          <div class="bg-image-gradient" />
          <div class="headline">
            <div class="vignette">
              <svg width="126" height="126" viewBox="0 0 126 126">
                <path
                  d="M46.7292 2.5289C46.9452 1.80306 47.8582 1.57129 48.3942 2.10626L57.4259 11.1209C57.8678 11.5621 58.6015 11.4947 58.9558 10.9805L66.1958 0.472549C66.6255 -0.15104 67.5654 -0.0893256 67.9098 0.585089L73.7138 11.9495C73.9978 12.5056 74.7164 12.6683 75.2122 12.2887L85.3451 4.53235C85.9464 4.07205 86.8213 4.4212 86.9404 5.16905L88.9485 17.7708C89.0468 18.3874 89.6799 18.7642 90.2688 18.5564L102.303 14.3109C103.017 14.0589 103.741 14.6614 103.623 15.4094L101.639 28.0149C101.542 28.6317 102.027 29.1857 102.652 29.1701L115.408 28.851C116.165 28.832 116.668 29.6288 116.325 30.3038L110.542 41.6792C110.259 42.2358 110.55 42.9127 111.149 43.0908L123.38 46.7293C124.105 46.9453 124.337 47.8583 123.802 48.3943L114.787 57.426C114.346 57.8679 114.414 58.6016 114.928 58.9559L125.436 66.1959C126.059 66.6256 125.998 67.5655 125.323 67.9099L113.959 73.7139C113.403 73.9979 113.24 74.7165 113.62 75.2123L121.376 85.3451C121.836 85.9465 121.487 86.8214 120.739 86.9405L108.138 88.9486C107.521 89.0469 107.144 89.68 107.352 90.2689L111.598 102.303C111.849 103.017 111.247 103.741 110.499 103.623L97.8935 101.639C97.2767 101.542 96.7227 102.027 96.7383 102.652L97.0574 115.408C97.0764 116.165 96.2797 116.668 95.6046 116.325L84.2293 110.542C83.6726 110.259 82.9957 110.55 82.8176 111.149L79.1791 123.38C78.9631 124.105 78.0501 124.337 77.5141 123.802L68.4825 114.788C68.0405 114.346 67.3068 114.414 66.9525 114.928L59.7125 125.436C59.2829 126.06 58.3429 125.998 57.9985 125.323L52.1945 113.959C51.9105 113.403 51.1919 113.24 50.6961 113.62L40.5633 121.376C39.9619 121.836 39.0871 121.487 38.9679 120.739L36.9598 108.138C36.8615 107.521 36.2284 107.144 35.6395 107.352L23.6058 111.598C22.8916 111.85 22.1675 111.247 22.2852 110.499L24.2696 97.8936C24.3667 97.2768 23.881 96.7228 23.2567 96.7384L10.5 97.0575C9.74296 97.0765 9.2404 96.2797 9.58356 95.6047L15.3661 84.2294C15.649 83.6727 15.3583 82.9958 14.7598 82.8177L2.5288 79.1792C1.80296 78.9632 1.5712 78.0502 2.10617 77.5142L11.1208 68.4825C11.562 68.0406 11.4946 67.3069 10.9804 66.9526L0.472455 59.7126C-0.151135 59.2829 -0.08942 58.343 0.584994 57.9986L11.9494 52.1946C12.5055 51.9106 12.6682 51.192 12.2886 50.6962L4.53225 40.5634C4.07196 39.962 4.42111 39.0871 5.16895 38.968L17.7707 36.9599C18.3873 36.8616 18.7641 36.2285 18.5563 35.6396L14.3108 23.6059C14.0588 22.8917 14.6613 22.1676 15.4093 22.2853L28.0148 24.2697C28.6316 24.3668 29.1856 23.8811 29.17 23.2568L28.8509 10.5001C28.8319 9.74306 29.6287 9.2405 30.3037 9.58366L41.6791 15.3662C42.2357 15.6491 42.9126 15.3584 43.0907 14.7599L46.7292 2.5289Z"
                />
              </svg>
              <span class="text">{{ vignetteText }}</span>
            </div>
            <h1 class="slogan">
              <TextOnBg v-for="line in headlineTextLines" :key="line">
                {{ line }}
              </TextOnBg>
              <TextOnBg v-for="line in headlineHighlightTextLines" :key="line">
                <span class="highlight">{{ line }}</span>
              </TextOnBg>
            </h1>
            <button class="play-button" @click="viewVideo = true">
              <Icon class="icon" name="play" />
            </button>
          </div>
        </div>
        <div v-if="item === 'cta'" class="cta">
          <div class="wrapper">
            <img src="/img/map.jpg" class="map" />
            <a href="/" class="button primary" no-prefetch>
              {{ subscribeButtonText }}
              <Icon name="marker" class="icon" />
            </a>
          </div>
        </div>
      </template>
    </AngledBoxesRow>
    <div v-if="viewVideo" class="video-overlay">
      <iframe
        width="100%"
        height="100%"
        src="https://www.youtube.com/embed/VOSzfnBBnsc"
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
      <button class="close-button" tabindex="-1" @click="viewVideo = false">
        <Icon class="icon" name="close" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AngledBoxesRow from './AngledBoxesRow.vue';
import TextOnBg from './TextOnBg.vue';
import Icon from './Icon.vue';

// const { pages } = useNavigation()

defineProps({
  headlineHighlightTextLines: {
    type: Array<string>,
    default: () => [],
  },
  subscribeButtonText: {
    type: String,
    default: '',
  },
  vignetteText: {
    type: String,
    default: '',
  },
})

const headlineTextLines = ["Marche et exercices","en plein air"]
const headlineHighlightTextLines = ["pour tous"]
const subscribeButtonText = "Inscris-toi!"
const vignetteText = "Gratuit!"

const viewVideo = ref(false)
// const subscriptionPage = computed(() =>
//   Object.values(pages.value).find(page => page.name === 'subscription'),
// )
</script>

<style lang="postcss" scoped>
@import '@styles/_mediaquery.pcss';

.hero {
  position: relative;
  margin: 0 auto;

  @media (--l) {
    height: 35rem;
  }
}

.main {
  height: 25rem;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgb(var(--color-black));
  overflow: hidden;

  @media (--l) {
    height: 100%;
  }
}

.bg-image,
.bg-image-color,
.bg-image-gradient {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

.bg-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  mix-blend-mode: luminosity;
}

.bg-image-color {
  background: rgb(var(--color-primary));
  mix-blend-mode: overlay;
}

.bg-image-gradient {
  background-image: linear-gradient(
    0,
    rgba(var(--color-black), 0.7),
    transparent 50%
  );
  mix-blend-mode: multiply;
}

.headline {
  position: relative;
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.slogan {
  font-family: Michroma, sans-serif;
  font-size: 0.9rem;
  line-height: 0.8rem;
  text-transform: uppercase;
  transform: rotate(-1.5deg);

  @media (--m) {
    font-size: 1.5rem;
    line-height: 1.3rem;
  }

  .highlight {
    color: rgb(var(--color-primary));
  }
}

.vignette {
  position: absolute;
  bottom: calc(100% - 4rem);
  right: calc(100% - 4rem);
  fill: rgb(var(--color-highlight));
  transform: rotate(-15deg) scale(0.7);

  @media (--m) {
    bottom: calc(100% - 3.5rem);
    right: calc(100% - 3.5rem);
    transform: rotate(-15deg) scale(1);
  }

  .text {
    position: absolute;
    top: 1rem;
    left: 1rem;
    bottom: 1.3rem;
    right: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    line-height: 1.3rem;
    font-weight: 900;
    color: rgb(var(--color-white));
    text-shadow: 0 0 0.3rem rgba(var(--color-black), 0.5);

    @media (--m) {
      font-size: 1.3rem;
      line-height: 1.3rem;
    }
  }
}

.play-button {
  margin: 2rem 0 -4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(var(--color-white));
  transition: transform 0.05s ease-in-out;

  .icon {
    width: 3rem;
    height: 3rem;
  }

  &:hover {
    transform: scale(1.5);
    transform-origin: center;
    color: rgb(var(--color-highlight));
  }
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: rgb(var(--color-black));
  z-index: 2;

  .close-button {
    position: absolute;
    top: 1.2rem;
    right: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.8rem;
    border-radius: 100px;
    color: rgb(var(--color-white));
    background: rgb(var(--color-primary));
    opacity: 0.97;
    cursor: pointer;
    transform-origin: center;
    transition: transform 0.2s ease-in-out;

    &:hover {
      transform: rotate(90deg);
    }

    .icon {
      pointer-events: none;
    }
  }
}

.cta {
  height: 17rem;

  @media (--l) {
    height: 100%;
  }

  .wrapper {
    position: relative;
    height: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .map {
    position: absolute;
    top: -2p;
    right: 0;
    bottom: 0;
    left: 0;
    height: 100%;
    width: 100%;
    padding: 0;
    filter: grayscale();
    pointer-events: none;
    object-fit: cover;
  }

  .button {
    position: relative;
    font-size: 1.4rem;
    line-height: 2rem;

    overflow: visible;
    box-shadow: 0 0 1.2rem rgba(var(--color-black), 0.25);

    &:hover .icon {
      transform: rotate(5deg) scale(1.4) translate(-0.25rem, -0.75rem);
    }

    @media (--m) {
      font-size: 1.9rem;
      padding: 0.8rem 1.5rem 1.1rem;
    }

    .icon {
      width: 5rem;
      height: 5rem;
      position: absolute;
      top: -4rem;
      left: 37%;
      fill: rgb(var(--color-highlight));
      transform: rotate(10deg);
      transition: transform 0.1s ease-out;
      stroke-width: 0.8px;
      stroke: rgba(var(--color-white), 0.9);

      @media (--l) {
        width: 6.5rem;
        height: 6.5rem;
        top: -5rem;
        left: 37%;
      }
    }
  }
}
</style>
