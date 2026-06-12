<template>
  <div class="session-unsubscribe-confirm">
    {{ t('sessions_unsubscribe_confirm_question') }}
    <div class="buttons">
      <button class="button secondary" @click="close()">
        {{ t('common_cancel') }}
      </button>
      <button class="button primary" @click="onConfirm()">
        {{ t('common_confirm') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI36n } from '@jota-one/i36n'
import useModal from '@/composables/useModal'
import { useSessions } from '@/composables/useSessions'

const { t } = useI36n()
const { closeModal, modalParams } = useModal()
const { unsubscribeFromSession } = useSessions()

const close = () => closeModal('session-unsubscribe')

const onConfirm = async () => {
  await unsubscribeFromSession(modalParams.value.sessionId, modalParams.value.asStaff)
  if (modalParams.value.cb) {
    modalParams.value.cb()
  }
  close()
}
</script>

<style lang="postcss" scoped>
.session-unsubscribe-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--size-gap-20);
  padding: var(--size-gap-20);
}

.buttons {
  display: flex;
  gap: var(--size-gap-20);
}
</style>
