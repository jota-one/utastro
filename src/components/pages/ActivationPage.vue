<template>
  <div class="container superslim">
    <ContentBlockTitle :text="t('activate_user_title')" />
    <TipBox v-if="success" color-theme="success">
      {{ t('activate_user_success') }}
      <div class="button-wrapper">
        <a href="/" class="button primary">
          {{ t('common_login') }}
        </a>
      </div>
    </TipBox>
    <TipBox v-else-if="error" color-theme="error">
      {{ error }}
    </TipBox>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI36n } from '@jota-one/i36n'
import { pb } from '@/pb'
import ContentBlockTitle from '@components/content/BlockTitle.vue'
import TipBox from '@components/TipBox.vue'

const { t } = useI36n()

const success = ref(false)
const error = ref('')

onMounted(async () => {
  const token = new URLSearchParams(window.location.search).get('token')

  if (!token) {
    error.value = t('ERROR_HC_USER_ACTIVATION_TOKEN_EXPIRED')
    return
  }

  try {
    await pb.collection('ut_users').confirmVerification(token)
    success.value = true
  } catch {
    error.value = t('ERROR_HC_USER_ACTIVATION_TOKEN_EXPIRED')
  }
})
</script>

<style lang="postcss">
.button-wrapper {
  padding-top: var(--size-gap-30);
  display: flex;
  justify-content: center;
}
</style>
