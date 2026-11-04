<template>
  <TipBox v-if="sent" color-theme="success">
    {{ t('activation_resend_sent') }}
  </TipBox>
  <TipBox v-else-if="failed" color-theme="error">
    {{ t('ERROR_UT_EMAIL_COULD_NOT_BE_SENT') }}
  </TipBox>
  <button
    v-else
    :class="['button primary small', { loading: sending }]"
    type="button"
    :disabled="sending"
    @click="resend"
  >
    {{ t('activation_resend_button') }}
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI36n } from '@jota-one/i36n'
import { pb } from '@/pb'
import TipBox from '@/components/TipBox.vue'

type Props = {
  email: string
}

const props = defineProps<Props>()

const { t } = useI36n()

const sending = ref(false)
const sent = ref(false)
const failed = ref(false)

const resend = async () => {
  sending.value = true
  try {
    await pb.collection('ut_users').requestVerification(props.email)
    sent.value = true
  } catch {
    failed.value = true
  } finally {
    sending.value = false
  }
}
</script>
