<template>
  <Teleport to="body">
    <LayoutOverlay v-if="openedModal === id" active>
      <div :class="['modal', colorTheme]">
        <button class="button close" tabindex="-1" @click="close">
          <Icon class="icon" name="close" />
        </button>
        <div class="body">
          <slot :close-modal="close" />
        </div>
      </div>
    </LayoutOverlay>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, watch, type PropType } from 'vue'

import type { ColorTheme } from '../../'
import useModal from '../composables/useModal'
import Icon from './Icon.vue'
import LayoutOverlay from './LayoutOverlay.vue'

const { registerModal, openedModal, closeModal } = useModal()

const emit = defineEmits(['opened'])
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  colorTheme: {
    type: String as PropType<ColorTheme>,
    default: '',
  },
})

const close = () => {
  document.removeEventListener('keydown', onEscape)
  closeModal(props.id)
}

const onEscape = (e: KeyboardEvent) => {
  if (e.key?.toLowerCase() === 'escape') {
    close()
  }
}

onMounted(() => {
  registerModal(props.id)

  watch(
    () => openedModal.value,
    value => {
      if (props.id === value) {
        document.addEventListener('keydown', onEscape)
        emit('opened')
      }
    },
  )
})
</script>

<style lang="postcss" scoped>
@import '@styles/_mediaquery.pcss';

.modal {
  max-width: 100%;
  max-height: calc(100vh - 4rem);
  position: relative;
  padding: 2.5rem 1rem 2rem;
  background: rgb(var(--color-bg));
  border-radius: 2px;
  box-shadow: 0 0 1.2rem rgba(var(--color-black), 0.1);

  @media (--l) {
    padding: 3.3rem 3rem;
  }

  &.success {
    color: rgb(var(--color-white));
    background: rgb(var(--color-success));
  }
}
.close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: rgb(var(--color-neutral));

  &:hover {
    color: rgb(var(--color-black));
  }

  .success & {
    color: rgb(var(--color-white));
    opacity: 0.7;

    &:hover {
      opacity: 1;
    }
  }

  .icon {
    width: 1.4rem;
    height: 1.4rem;
  }
}

.body {
  max-height: calc(100vh - 8rem);
  overflow: auto;
}
</style>
