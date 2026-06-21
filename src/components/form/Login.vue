<template>
  <div class="login-form">
    <ContentBlockTitle :text="t('common_login')" />
    <form @submit.prevent="onLogin">
      <FormFieldWrapper :label="t('common_username')" :error="error">
        <input
          ref="loginField"
          v-model="credentials.email"
          type="email"
          name="email"
          autocomplete="on"
          required
          :placeholder="t('common_placeholder_email')"
          class="input"
        />
      </FormFieldWrapper>
      <FormFieldWrapper v-if="!passwordForgotten" :label="t('common_password')">
        <input
          v-model="credentials.password"
          type="password"
          name="password"
          autocomplete="on"
          required
          placeholder="******"
          class="input"
        />
      </FormFieldWrapper>
      <template v-if="passwordForgotten">
        <template v-if="passwordResetEmailSent">
          <TipBox color-theme="success">
            {{ t('login_tip_reset_password_sent') }}
          </TipBox>
          <div class="buttons">
            <button
              class="button tertiary"
              type="button"
              @click.prevent="close"
            >
              {{ t('common_close') }}
            </button>
          </div>
        </template>
        <template v-else-if="resetPasswordError">
          <TipBox color-theme="error">
            {{ resetPasswordError }}
          </TipBox>
          <div class="buttons">
            <button
              class="button tertiary"
              type="button"
              @click.prevent="close"
            >
              {{ t('common_close') }}
            </button>
          </div>
        </template>
        <template v-else>
          <TipBox color-theme="info">
            {{ t('login_tip_reset_password') }}
          </TipBox>
          <ContentBlockSpace size="quarter" />
          <div class="captcha-wrapper">
            <FormCaptcha
              v-if="hcaptcha.enabled"
              ref="captchaEl"
              v-model="captchaModel"
            />
          </div>
          <ContentBlockSpace size="quarter" />
          <div class="buttons">
            <button
              class="button tertiary"
              type="button"
              @click.prevent="toggleForgotPassword"
            >
              {{ t('common_cancel') }}
            </button>
            <button
              type="submit"
              class="button primary"
              :disabled="hcaptcha.enabled ? !captchaModel.isValid : false"
            >
              {{ t('login_action_reset_password') }}
            </button>
          </div>
        </template>
      </template>
      <div v-else class="buttons">
        <div class="row">
          <button
            class="button tertiary"
            type="button"
            @click.prevent="toggleForgotPassword"
          >
            {{ t('login_action_password_forgotten') }}
          </button>
          <div style="flex-grow: 1" />
          <button type="submit" class="button primary">
            {{ t('common_login') }}
          </button>
        </div>
        <div class="row">
          <ArrowLink
            :href="route('subscription-form')"
            :label="t('login_action_signup')"
            @click="$emit('signup')"
          />
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { useI36n } from '@jota-one/i36n'
import { useAuth } from '@composables/useAuth'
import AppErrorCode from '@/AppErrorCode'
import ContentBlockTitle from '@components/content/BlockTitle.vue'
import FormFieldWrapper from '@components/form/FieldWrapper.vue'
import TipBox from '@components/TipBox.vue'
import ContentBlockSpace from '@components/content/BlockSpace.vue'
import FormCaptcha from '@components/form/Captcha.vue'
import config from '@/config'
import ArrowLink from '@/components/ArrowLink.vue'

import { useRoutes } from '@composables/useRoutes'

const { hcaptcha } = config
const { t } = useI36n()
const { login } = useAuth()
const { route } = useRoutes()

const emit = defineEmits(['authenticated', 'signup', 'close'])

const loginField = ref<HTMLInputElement | null>(null)
const error = ref<string>('')
const passwordForgotten = ref(false)
const captchaEl = ref(null)
const passwordResetEmailSent = ref(false)
const resetPasswordError = ref('')

const credentials = reactive({
  email: '',
  password: '',
})

const captchaModel = ref({
  verified: false,
  expired: false,
  token: '',
  eKey: '',
  error: '',
  isValid: false,
})

const toggleForgotPassword = () => {
  error.value = ''
  passwordForgotten.value = !passwordForgotten.value
}

const close = () => {
  credentials.email = ''
  credentials.password = ''
  emit('close')
}

async function onLogin() {
  if (passwordForgotten.value) {
    try {
      // await generateResetPasswordLink(
      //   credentials.email,
      //   captchaModel.value.token,
      //   currentLangCode.value,
      // )
      passwordResetEmailSent.value = true
    } catch (e: any) {
      if (captchaEl.value) {
        ;(captchaEl.value as any).reset()
      }

      if (e.data?.data?.code) {
        const code = e.data?.data?.code
        resetPasswordError.value = t(AppErrorCode[code])
      }
    }
  } else {
    try {
      await login(credentials)
      emit('authenticated')
    } catch (e: any) {
      if (e.data?.data?.code) {
        error.value = t(AppErrorCode[e.data.data.code])
      } else {
        error.value = t('login_invalid_credentials')
      }
    }
  }
}

onMounted(() => {
  if (loginField.value) {
    nextTick(() => loginField.value?.focus())
  }
})
</script>

<style lang="postcss" scoped>
.login-form {
  margin: 0 auto;
  width: var(--size-content-width-tq);
  max-width: 100%;

  form {
    max-width: min(100%, 35rem);
    margin: 0 auto;
    padding: 0 var(--size-gap-20);
  }
}

.captcha-wrapper {
  display: flex;
  justify-content: center;
}
</style>
