<template>
  <div class="container superslim">
    <ContentBlockTitle :text="t('reset_password_title')" />
    <form
      v-if="token && !submitted"
      class="reset-password-form"
      @submit.prevent="onSubmit"
    >
      <FormFieldWrapper
        :label="t('reset_password_new_label')"
        :error="errors.password"
      >
        <input
          v-model="model.password"
          type="password"
          name="password"
          autocomplete="new-password"
          required
          placeholder="******"
          class="input"
        />
      </FormFieldWrapper>
      <FormFieldWrapper
        :label="t('reset_password_confirm_label')"
        :error="errors.passwordConfirm"
      >
        <input
          v-model="model.passwordConfirm"
          type="password"
          name="passwordConfirm"
          autocomplete="new-password"
          required
          placeholder="******"
          class="input"
        />
      </FormFieldWrapper>
      <TipBox v-if="submitError" color-theme="error">
        {{ submitError }}
      </TipBox>
      <button type="submit" class="button primary" :disabled="!canSubmit">
        {{ t('reset_password_submit') }}
      </button>
    </form>
    <TipBox v-if="submitted" color-theme="success">
      {{ t('reset_password_success') }}
      <div class="button-wrapper">
        <a href="/" class="button primary">
          {{ t('common_login') }}
        </a>
      </div>
    </TipBox>
    <TipBox v-else-if="!token" color-theme="error">
      {{ t('ERROR_HC_USER_ACTIVATION_TOKEN_EXPIRED') }}
    </TipBox>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI36n } from '@jota-one/i36n'
import { pb } from '@/pb'
import AppErrorCode from '@/AppErrorCode'
import { validatePassword } from '@/utils/validate'
import ContentBlockTitle from '@components/content/BlockTitle.vue'
import FormFieldWrapper from '@components/form/FieldWrapper.vue'
import TipBox from '@components/TipBox.vue'

const { t } = useI36n()

const token = ref('')
const submitted = ref(false)
const submitError = ref('')

const model = reactive({ password: '', passwordConfirm: '' })
const errors = reactive<Record<string, string>>({})

const canSubmit = computed(
  () =>
    model.password &&
    model.passwordConfirm &&
    Object.keys(errors).length === 0,
)

watch([() => model.password, () => model.passwordConfirm], ([pw, pc]) => {
  delete errors.password
  delete errors.passwordConfirm
  try {
    validatePassword(pw, pc)
  } catch (e: any) {
    if (e.cause === AppErrorCode.ERROR_HC_PASSWORD_POLICY_NOT_MATCHED) {
      errors.password = t('ERROR_HC_PASSWORD_POLICY_NOT_MATCHED')
    }
    if (e.cause === AppErrorCode.ERROR_HC_PASSWORD_CONFIRMATION_NOT_MATCHED) {
      errors.passwordConfirm = t('ERROR_HC_PASSWORD_CONFIRMATION_NOT_MATCHED')
    }
  }
})

onMounted(() => {
  token.value =
    new URLSearchParams(window.location.search).get('token') ?? ''
})

const onSubmit = async () => {
  if (!canSubmit.value) return
  submitError.value = ''
  try {
    await pb
      .collection('ut_users')
      .confirmPasswordReset(token.value, model.password, model.passwordConfirm)
    submitted.value = true
  } catch {
    submitError.value = t('ERROR_HC_ACCOUNT_CREATION_FAILED')
  }
}
</script>

<style lang="postcss">
.reset-password-form {
  padding: 0 var(--size-gap-40);
  display: flex;
  flex-direction: column;
  gap: var(--size-gap-20);

  .button {
    align-self: center;
  }
}

.button-wrapper {
  padding-top: var(--size-gap-30);
  display: flex;
  justify-content: center;
}
</style>
