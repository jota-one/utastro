<template>
  <form @submit.prevent="submit">
    <ContentBlockSpace size="quarter" />
    <div class="container superslim block">
      <FormFieldWrapper :label="t('subscriptionform_firstname_label')">
        <input
          v-model="model.firstName"
          type="text"
          required
          name="firstname"
          autocomplete="given-name"
          class="input"
          :placeholder="t('subscriptionform_firstname_placeholder')"
        />
      </FormFieldWrapper>
      <FormFieldWrapper :label="t('subscriptionform_lastname_label')">
        <input
          v-model="model.lastName"
          type="text"
          required
          name="lastname"
          autocomplete="family-name"
          class="input"
          :placeholder="t('subscriptionform_lastname_placeholder')"
        />
      </FormFieldWrapper>
      <FormFieldWrapper :label="t('subscriptionform_email_label')" class="full">
        <input
          v-model="model.email"
          type="email"
          required
          name="email"
          autocomplete="email"
          class="input"
          :placeholder="t('subscriptionform_email_placeholder')"
        />
      </FormFieldWrapper>
    </div>
    <div class="container superslim">
      <FormFieldWrapper :label="t('coachsubscriptionform_message_label')">
        <textarea
          v-model="model.message"
          name="message"
          class="input"
          :placeholder="t('coachsubscriptionform_message_placeholder')"
        />
      </FormFieldWrapper>
      <ContentBlockSpace size="quarter" />
      <FormFieldWrapper :label="t('coachsubscriptionform_document_label')">
        <label
          :class="['file-drop', { dragging }]"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <input
            type="file"
            multiple
            class="file-input"
            @change="onFilesChange"
          />
          <svg class="upload-icon" viewBox="0 0 24 24" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" fill="currentColor"/>
          </svg>
          <div class="file-drop-text" v-html="t('coachsubscriptionform_document_dropzone')" />
          <ul v-if="fileList.length" class="file-list">
            <li v-for="f in fileList" :key="f.name">{{ f.name }}</li>
          </ul>
        </label>
        <div class="file-tip">{{ t('coachsubscriptionform_document_tip') }}</div>
      </FormFieldWrapper>
      <ContentBlockSpace size="quarter" />
      <TipBox v-if="submitted" color-theme="success">
        <div v-html="t('coachsubscriptionform_success_text', { email: model.email })" />
      </TipBox>
      <template v-else>
        <FormCaptcha v-if="hcaptcha.enabled" ref="captchaEl" v-model="captchaModel" />
        <ContentBlockSpace size="quarter" />
        <button
          class="button primary"
          type="submit"
          :disabled="submitting || (hcaptcha.enabled && !captchaModel.isValid)"
        >
          {{ t('subscriptionform_submit_button') }}
        </button>
      </template>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI36n } from '@jota-one/i36n'
import config from '@/config'
import FormFieldWrapper from '@components/FormFieldWrapper.vue'
import FormCaptcha from '@components/FormCaptcha.vue'
import ContentBlockSpace from '@components/ContentBlockSpace.vue'
import TipBox from '@components/TipBox.vue'
import type { CaptchaModel } from '@/types'

const { t } = useI36n()
const { hcaptcha } = config

const submitted = ref(false)
const submitting = ref(false)
const dragging = ref(false)
const fileList = ref<File[]>([])
const captchaEl = ref<InstanceType<typeof FormCaptcha> | null>(null)

const model = reactive({
  firstName: '',
  lastName: '',
  email: '',
  message: '',
})

const captchaModel = ref<CaptchaModel>({
  verified: false,
  expired: false,
  token: '',
  eKey: '',
  error: '',
  isValid: false,
})

const onFilesChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  fileList.value = input.files ? Array.from(input.files) : []
}

const onDrop = (e: DragEvent) => {
  dragging.value = false
  const dropped = e.dataTransfer?.files
  if (dropped?.length) {
    fileList.value = [...fileList.value, ...Array.from(dropped)]
  }
}

const submit = async () => {
  if (submitting.value) { return }
  submitting.value = true

  try {
    const formData = new FormData()
    formData.append('firstName', model.firstName)
    formData.append('lastName', model.lastName)
    formData.append('email', model.email)
    formData.append('message', model.message)
    formData.append('captchaToken', captchaModel.value.token)
    fileList.value.forEach(f => formData.append('files', f))

    const res = await fetch('/app/coaches', { method: 'POST', body: formData })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    submitted.value = true
  } catch (err) {
    console.error(err)
    captchaEl.value?.reset()
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="postcss" scoped>
@import '@/assets/styles/_mediaquery.pcss';

.block {
  display: flex;
  flex-wrap: wrap;
  gap: var(--size-gap-20);

  & > :deep(*) {
    flex-basis: 100%;

    @media (--m) {
      flex-basis: calc(50% - var(--size-gap-10));
    }

    &.full {
      flex-basis: 100%;
    }
  }
}

textarea.input {
  min-height: 8rem;
  resize: vertical;
}

.file-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1.5rem;
  background: rgb(var(--color-white));
  border: 1px solid rgb(var(--color-neutral-light));
  border-radius: 0.4rem;
  cursor: pointer;
  transition: border-color 0.1s linear;

  &:hover,
  &.dragging {
    border-color: rgb(var(--color-primary));
    background: rgb(var(--color-primary), 0.04);
  }
}

.file-input {
  display: none;
}

.upload-icon {
  color: rgb(var(--color-neutral));
}

.file-drop-text {
  color: rgb(var(--color-neutral-dark));
  font-size: 0.9rem;
  text-align: center;

  :deep(em) {
    font-style: normal;
    color: rgb(var(--color-primary));
  }
}

.file-list {
  list-style: disc;
  padding-left: 1.5rem;
  font-size: 0.85rem;
  color: rgb(var(--color-primary));
  align-self: flex-start;
}

.file-tip {
  margin-top: 0.4rem;
  font-size: 0.8rem;
  color: rgb(var(--color-neutral));
}
</style>
