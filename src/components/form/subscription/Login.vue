<template>
  <FormFieldWrapper
    :label="t('subscriptionform_email_label')"
    required
    :filled="Boolean(model.email) && !errors.email"
    :error="errors.email || emailError || requiredError(model.email)"
  >
    <input
      v-model="model.email"
      type="text"
      inputmode="email"
      autocapitalize="none"
      autocorrect="off"
      spellcheck="false"
      required
      name="email"
      autocomplete="email"
      class="input"
      :disabled="Boolean(userProfile)"
      :placeholder="t('subscriptionform_email_placeholder')"
    />
  </FormFieldWrapper>
  <button
    v-if="userProfile"
    class="button tertiary update-password"
    @click.prevent="onUpdatePasswordClick"
  >
    {{
      updatePassword
        ? t('profile_update_password_button_cancel')
        : t('profile_update_password_button')
    }}
  </button>
  <div v-else class="empty" />
  <template v-if="!userProfile || updatePassword">
    <FormFieldWrapper
      v-if="updatePassword"
      :label="t('profile_old_password_label')"
      required
      :filled="Boolean(model.oldPassword)"
      :error="requiredError(model.oldPassword)"
    >
      <input
        v-model="model.oldPassword"
        type="password"
        required
        name="old_password"
        autocomplete="current-password"
        class="input"
        placeholder="******"
      />
    </FormFieldWrapper>
    <FormFieldWrapper
      :label="
        t(
          updatePassword
            ? 'reset_password_new_label'
            : 'subscriptionform_password_label',
        )
      "
      :error="errors.password || requiredError(model.password)"
      required
      :filled="Boolean(model.password) && !errors.password"
    >
      <input
        v-model="model.password"
        type="password"
        required
        name="password"
        autocomplete="new-password"
        class="input"
        :placeholder="t('subscriptionform_password_placeholder')"
      />
    </FormFieldWrapper>
    <FormFieldWrapper
      :label="
        t(
          updatePassword
            ? 'reset_password_confirm_label'
            : 'subscriptionform_password_confirm_label',
        )
      "
      :error="errors.passwordConfirm || requiredError(model.passwordConfirm)"
      required
      :filled="Boolean(model.passwordConfirm) && !errors.passwordConfirm"
    >
      <input
        v-model="model.passwordConfirm"
        type="password"
        required
        name="password_confirm"
        autocomplete="on"
        class="input"
        placeholder="******"
      />
    </FormFieldWrapper>
  </template>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useI36n } from '@jota-one/i36n'
import FormFieldWrapper from '@/components/form/FieldWrapper.vue'
import AppErrorCode from '@/AppErrorCode'
import { isEmpty, validateEmail, validatePassword } from '@/utils/validate'
import type { UserProfile, UserProfileLogin } from '@/types'

interface Props {
  modelValue: UserProfileLogin
  userProfile?: UserProfile
  showRequired?: boolean
  emailError?: string
}

const emit = defineEmits([
  'update:modelValue',
  'show-update-password',
  'hide-update-password',
])
const props = defineProps<Props>()

const { t } = useI36n()

const model = ref(props.modelValue)
const updatePassword = ref(false)
const errors = reactive<any>({})

const requiredError = (value: unknown) =>
  props.showRequired && isEmpty(value)
    ? t('subscriptionform_field_required')
    : ''

const onUpdatePasswordClick = () => {
  updatePassword.value = !updatePassword.value

  if (updatePassword.value) {
    emit('show-update-password')
  } else {
    emit('hide-update-password')
    model.value.oldPassword = undefined
    model.value.password = undefined
    model.value.passwordConfirm = undefined
  }
}

watch(
  () => model.value,
  value => emit('update:modelValue', value),
)

watch(
  () => model.value,
  value => {
    delete errors.email
    delete errors.password
    delete errors.passwordConfirm

    try {
      validateEmail(value.email || '')
    } catch {
      errors.email = t('ERROR_HC_INVALID_EMAIL_ADDRESS')
    }

    try {
      validatePassword(value.password || '', value.passwordConfirm || '')
    } catch (e: any) {
      if (e.cause === AppErrorCode.ERROR_HC_PASSWORD_POLICY_NOT_MATCHED) {
        errors.password = t('ERROR_HC_PASSWORD_POLICY_NOT_MATCHED')
      }

      if (e.cause === AppErrorCode.ERROR_HC_PASSWORD_CONFIRMATION_NOT_MATCHED) {
        errors.passwordConfirm = t('ERROR_HC_PASSWORD_CONFIRMATION_NOT_MATCHED')
      }
    }
  },
  { deep: true, immediate: true },
)
</script>

<style lang="postcss" scoped>
.update-password {
  margin-top: 0.5rem;
  justify-self: flex-start;
  align-self: center;
}
</style>
