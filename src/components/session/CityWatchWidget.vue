<template>
  <SessionAsideWidget
    :title="t(`${labelsBase}_title`)"
    :subscribed="subscribed"
    :collapsed="!uncollapsed"
  >
    <template v-if="city">
      <template v-if="subscribed">
        <div v-html="t(`${labelsBase}_text_1`, { city: city.label })" />
        <p v-html="t(`${labelsBase}_text_2`)" />
      </template>
      <template v-else>
        <slot name="sub-title" />
        <div v-html="t(`${labelsBase}_text`, { city: city.label })" />
      </template>
    </template>
    <template #footer>
      <div class="footer">
        <Icon v-if="subscribed" name="success" class="subscribed-icon" />
        <button
          :class="['button primary', { subscribed }]"
          @click="onButtonClick"
        >
          {{ t(`${labelsBase}_button`) }}
        </button>
      </div>
    </template>
  </SessionAsideWidget>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI36n } from '@jota-one/i36n'
import { useAuth } from '@/composables/useAuth'
import { useUserProfile } from '@/composables/useUserProfile'
import { useSessions } from '@/composables/useSessions'
import useModal from '@/composables/useModal'
import SessionAsideWidget from '@/components/session/AsideWidget.vue'
import Icon from '@/components/Icon.vue'
import type { City } from '@/types'

type Props = {
  city: City
  uncollapsed?: boolean
}

const props = defineProps<Props>()
const { t } = useI36n()
const { watchCities, unwatchCity } = useSessions()
const { watchingCities } = useUserProfile()
const { isAuthenticated } = useAuth()
const { openedModal, openModal } = useModal()

const subscribeAfterLogin = ref(false)

const labelsBase = computed(
  () =>
    'sessions_aside_city_' + (subscribed.value ? 'subscribed' : 'subscription'),
)

const subscribed = computed(
  () =>
    isAuthenticated.value &&
    props.city &&
    watchingCities.value.map(c => c.cityId).includes(props.city?.id),
)

const onButtonClick = () => {
  if (!isAuthenticated.value) {
    subscribeAfterLogin.value = true
    openModal('login')
  } else if (props.city) {
    if (subscribed.value) {
      unwatchCity(props.city.id)
    } else {
      watchCities([props.city.id])
    }
  }
}

watch(
  () => openedModal.value,
  value => {
    if (
      !value &&
      isAuthenticated.value &&
      !subscribed.value &&
      props.city?.id &&
      subscribeAfterLogin.value
    ) {
      watchCities([props.city.id])
      subscribeAfterLogin.value = false
    }
  },
)
</script>

<style lang="postcss" scoped>
.footer {
  display: flex;
  align-items: center;
  gap: var(--size-gap-10);
}

.subscribed-icon {
  width: 1.75rem;
  height: 1.75rem;
  color: rgb(var(--color-white));
}
</style>
