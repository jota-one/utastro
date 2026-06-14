<template>
  <div class="agreements">
    <TipBox color-theme="info">
      {{ t('subscriptionform_agreements_tip') }}
    </TipBox>
    <ContentBlockSpace size="quarter" />
    <FormSubscriptionAgreement
      v-model="model.risks"
      name="risks"
      required
      :disabled="model.risks && Boolean(userProfile)"
    >
      <span v-html="t('subscriptionform_risks_agreement')" />
    </FormSubscriptionAgreement>
    <FormSubscriptionAgreement v-model="model.promo" name="promo">
      <span v-html="t('subscriptionform_promo_agreement')" />
    </FormSubscriptionAgreement>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI36n } from '@jota-one/i36n'
import TipBox from '@/components/TipBox.vue'
import ContentBlockSpace from '@components/content/BlockSpace.vue'
import FormSubscriptionAgreement from '@/components/form/subscription/Agreement.vue'
import type { UserProfile, UserProfileAgreements } from '@/types'

interface Props {
  modelValue: UserProfileAgreements
  userProfile?: UserProfile
}

const emit = defineEmits(['update:modelValue'])
const props = defineProps<Props>()
const model = ref(props.modelValue)

const { t } = useI36n()

watch(
  () => model.value,
  value => emit('update:modelValue', value),
)
</script>
