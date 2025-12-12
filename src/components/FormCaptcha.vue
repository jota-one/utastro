<template>
  <VueHcaptcha
    ref="captchaEl"
    class="form-captcha"
    :sitekey="hcaptcha.sitekey"
    @verify="onVerify"
    @expired="onExpire"
    @challenge-expired="onExpire"
    @error="onError"
  />
</template>

<script setup lang="ts">
import VueHcaptcha from '@hcaptcha/vue3-hcaptcha'

import type { CaptchaModel } from '../../'
import { computed, reactive, ref } from 'vue';
import config from '../config';

const { hcaptcha } = config

interface Props {
  modelValue: CaptchaModel
}

defineProps<Props>()

const emit = defineEmits(['update:modelValue'])

const captchaEl = ref(null)

const model = reactive({
  verified: false,
  expired: false,
  token: '',
  eKey: '',
  error: '',
})

const isValid = computed(
  () =>
    model.verified &&
    !model.expired &&
    !model.error &&
    model.token &&
    model.eKey,
)

const onExpire = () => {
  model.verified = false
  model.expired = true
  model.token = ''
  model.eKey = ''
  emit('update:modelValue', getModel())
}

const onVerify = (token: string, eKey: string) => {
  model.token = token
  model.eKey = eKey
  model.verified = true
  model.expired = false
  model.error = ''
  emit('update:modelValue', getModel())
}

const onError = (err: string) => {
  model.token = ''
  model.eKey = ''
  model.error = err
  model.verified = false
  emit('update:modelValue', getModel())
}

const getModel = () => ({ ...model, isValid: isValid.value })

const reset = () => {
  if (captchaEl.value) {
    ;(captchaEl.value as any).reset()
  }
}

defineExpose({ reset })
</script>

<style lang="postcss" scoped>
.form-captcha {
  min-height: 78px;
}
</style>
