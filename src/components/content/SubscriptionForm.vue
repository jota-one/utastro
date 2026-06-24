<template>
  <form @submit.prevent="submit">
    <div v-if="!userProfile" class="container superslim">
      <TipBox color-theme="info">
        <div v-html="t('subscriptionform_top_tip')" />
      </TipBox>
    </div>

    <ContentBlockSpace size="quarter" />

    <div class="container superslim block">
      <FormSubscriptionLogin
        v-model="model.login"
        :user-profile="userProfile"
        @show-update-password="makePasswordRequired"
        @hide-update-password="makePasswordOptional"
      />
    </div>

    <ContentBlockSpace size="quarter" />
    <ContentBlockTitle :text="t('subscriptionform_details_title')" />

    <div class="container superslim block">
      <FormSubscriptionDetails v-model="model.details" />
    </div>

    <ContentBlockSpace size="quarter" />

    <ContentBlockTitle :text="t('subscriptionform_validation_title')" />
    <div class="container superslim">
      <FormSubscriptionAgreements
        v-model="model.agreements"
        :user-profile="userProfile"
      />
    </div>

    <ContentBlockSpace size="quarter" />
    <div class="container superslim submit">
      <TipBox v-if="hasEmptyRequiredFields" color-theme="error">
        {{ t('subscriptionform_empty_required_fields') }}
      </TipBox>
      <TipBox v-if="submitError" color-theme="error">
        <div
          v-html="
            t('subscriptionform_subscription_not_sent', {
              error: submitError,
            })
          "
        />
      </TipBox>
      <template v-if="!userProfile && !submitted">
        <FormCaptcha
          v-if="hcaptcha.enabled"
          ref="captchaEl"
          v-model="model.captcha"
        />
        <button
          :class="['button primary', { loading: submitting }]"
          type="submit"
          :disabled="!canSubmit || submitting"
        >
          {{ t(submitButtonLabel) }}
        </button>
      </template>
      <button
        v-if="userProfile"
        :class="['button primary', { loading: submitting }]"
        type="submit"
        :disabled="!canSubmit || submitting"
      >
        {{ t(submitButtonLabel) }}
      </button>
      <TipBox v-if="submitted" color-theme="success">
        <div
          v-html="
            t(
              userProfile
                ? 'profile_update_success'
                : 'subscriptionform_success_text',
              {
                email: model.login.email,
              },
            )
          "
        />
      </TipBox>
      <TipBox color-theme="neutral">
        <div v-html="t('subscriptionform_legal_disclaimer')" />
      </TipBox>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useI36n } from '@jota-one/i36n'
import { pb } from '@/pb'
import TipBox from '@/components/TipBox.vue'
import ContentBlockSpace from '@components/content/BlockSpace.vue'
import ContentBlockTitle from '@components/content/BlockTitle.vue'
import FormSubscriptionLogin from '@/components/form/subscription/Login.vue'
import FormSubscriptionDetails from '@/components/form/subscription/Details.vue'
import FormSubscriptionAgreements from '@/components/form/subscription/Agreements.vue'
import FormCaptcha from '@/components/form/Captcha.vue'
import config from '@/config'
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateBirthYear,
  validateCity,
  validateZip,
} from '@/utils/validate'
import type {
  CaptchaModel,
  UserProfile,
  UserProfileAgreements,
  UserProfileDetails,
  UserProfileLogin,
} from '@/types'

interface Model {
  login: UserProfileLogin
  details: UserProfileDetails
  agreements: UserProfileAgreements
  captcha: CaptchaModel
}

interface Props {
  userProfile?: UserProfile
}

const props = defineProps<Props>()

const { t } = useI36n()
const hcaptcha = config.hcaptcha

const submitting = ref(false)
const submitted = ref(false)
const captchaEl = ref(null)
const submitError = ref('')
const model = reactive<Model>({
  login: {
    email: '',
    oldPassword: '',
    password: '',
    passwordConfirm: '',
  },
  details: {
    name: '',
    street: '',
    zip: undefined,
    city: '',
    regionId: undefined,
    country: 'CH',
    phone: '',
    gender: '',
    birthdate: undefined,
  },
  agreements: {
    risks: undefined,
    promo: undefined,
  },
  captcha: {
    verified: false,
    expired: false,
    token: '',
    eKey: '',
    error: '',
    isValid: false,
  },
})

const requiredFields = ref({
  login: ['email', 'password', 'passwordConfirm'],
  details: ['name', 'zip', 'city', 'regionId', 'phone', 'gender', 'birthdate'],
  agreements: ['risks'],
})

const hasEmptyRequiredFields = computed(() => {
  return Object.entries(requiredFields.value).reduce(
    (acc, [fieldGroup, keys]) => {
      for (const key of keys) {
        const isEmpty = [undefined, '', false].includes(
          (model as any)[fieldGroup][key],
        )
        acc = acc || isEmpty
      }
      return acc
    },
    false,
  )
})

const hasLoginErrors = computed(() => {
  try {
    validateEmail(model.login.email || '')
    validatePassword(
      model.login.password || '',
      model.login.passwordConfirm || '',
    )
    return false
  } catch {
    return true
  }
})

const hasDetailsErrors = computed(() => {
  try {
    validateName(model.details.name || '')
    validatePhone(model.details.phone || '')
    validateBirthYear(model.details.birthdate)
    validateCity(model.details.city || '')
    validateZip(model.details.zip)
    return false
  } catch {
    return true
  }
})

const canSubmit = computed(
  () =>
    !hasEmptyRequiredFields.value &&
    !hasLoginErrors.value &&
    !hasDetailsErrors.value &&
    (props.userProfile
      ? true
      : hcaptcha.enabled
        ? model.captcha.isValid
        : true),
)

const submitButtonLabel = computed(() =>
  submitting.value
    ? 'subscriptionform_submit_button_loading'
    : 'subscriptionform_submit_button',
)

const makePasswordRequired = () => {
  requiredFields.value.login = ['email', 'oldPassword', 'password', 'passwordConfirm']
}

const makePasswordOptional = () => {
  requiredFields.value.login = ['email']
}

const submit = async () => {
  submitError.value = ''

  if (!canSubmit.value) {
    return
  }

  try {
    submitting.value = true

    const pbData = {
      name: model.details.name,
      street: model.details.street,
      npa: model.details.zip,
      city: model.details.city,
      country: model.details.country,
      phone: model.details.phone,
      gender: model.details.gender,
      birthdate: model.details.birthdate,
      region: model.details.regionId,
      accept_risks: model.agreements.risks,
      accept_promo: model.agreements.promo,
    }

    if (props.userProfile) {
      const updateData: Record<string, unknown> = { ...pbData }
      if (model.login.password) {
        updateData.oldPassword = model.login.oldPassword
        updateData.password = model.login.password
        updateData.passwordConfirm = model.login.passwordConfirm
      }
      await pb
        .collection('ut_users')
        .update(String(props.userProfile.id), updateData)
    } else {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      const id = Array.from(crypto.getRandomValues(new Uint8Array(15)))
        .map(n => chars[n % chars.length])
        .join('')

      try {
        await pb.collection('ut_users').create({
          id,
          ...pbData,
          email: model.login.email,
          emailVisibility: true,
          password: model.login.password,
          passwordConfirm: model.login.passwordConfirm,
          role: 'user',
        })
      } catch (createErr: any) {
        if (createErr?.data?.email?.code === 'validation_not_unique') {
          throw new Error(t('ERROR_HC_USER_ALREADY_EXISTS'))
        }
        throw new Error(t('ERROR_HC_ACCOUNT_CREATION_FAILED'))
      }

      try {
        await pb.collection('ut_users').requestVerification(model.login.email)
      } catch {
        throw new Error(t('ERROR_UT_EMAIL_COULD_NOT_BE_SENT'))
      }
    }

    submitted.value = true
  } catch (e: any) {
    if (captchaEl.value) {
      ;(captchaEl.value as any).reset()
    }
    submitError.value = e?.message || t('ERROR_HC_ACCOUNT_CREATION_FAILED')
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.userProfile,
  value => {
    if (value) {
      model.login.email = value.email
      model.details.name = value.name
      model.details.street = value.street
      model.details.zip = value.zip
      model.details.city = value.city
      model.details.regionId = value.regionId
      model.details.country = value.country
      model.details.phone = value.phone
      model.details.gender = value.gender
      model.details.birthdate = value.birthdate
      model.agreements.risks = Boolean(value.risks)
      model.agreements.promo = Boolean(value.promo)
      makePasswordOptional()
    }
  },
  { immediate: true },
)
</script>

<style lang="postcss" scoped>
@import '@/assets/styles/_mediaquery.pcss';

.block {
  flex: 1;
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

    &.empty {
      display: none;

      @media (--m) {
        display: block;
      }
    }
  }
}

.submit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--size-gap-40);
}
</style>
