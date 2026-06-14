<template>
  <FormFieldWrapper :label="t('subscriptionform_name_label')" required>
    <input
      v-model="model.name"
      type="text"
      required
      name="name"
      autocomplete="name"
      class="input"
      :placeholder="t('subscriptionform_name_placeholder')"
    />
  </FormFieldWrapper>
  <FormFieldWrapper :label="t('subscriptionform_street_label')">
    <input
      v-model="model.street"
      type="text"
      name="street"
      autocomplete="on"
      class="input"
      :placeholder="t('subscriptionform_street_placeholder')"
    />
  </FormFieldWrapper>
  <FormFieldWrapper :label="t('subscriptionform_zip_label')" required>
    <input
      v-model="model.zip"
      type="text"
      required
      name="zip"
      autocomplete="on"
      class="input"
      :placeholder="t('subscriptionform_zip_placeholder')"
    />
  </FormFieldWrapper>
  <FormFieldWrapper :label="t('subscriptionform_city_label')" required>
    <input
      v-model="model.city"
      type="text"
      required
      name="city"
      autocomplete="on"
      class="input"
      :placeholder="t('subscriptionform_city_placeholder')"
    />
  </FormFieldWrapper>
  <FormFieldWrapper :label="t('subscriptionform_region_label')" required>
    <select v-model="model.regionId" class="dropdown" required>
      <option v-for="canton in SWISS_CANTONS" :key="canton.value" :value="canton.value">
        {{ canton.label }}
      </option>
    </select>
  </FormFieldWrapper>
  <FormFieldWrapper :label="t('subscriptionform_country_label')">
    <input
      v-model="model.country"
      type="text"
      name="country"
      autocomplete="on"
      class="input"
      :placeholder="t('subscriptionform_country_placeholder')"
    />
  </FormFieldWrapper>
  <FormFieldWrapper :label="t('subscriptionform_phone_label')" required>
    <input
      v-model="model.phone"
      type="text"
      name="phone"
      autocomplete="on"
      class="input"
      :placeholder="t('subscriptionform_phone_placeholder')"
      required
    />
  </FormFieldWrapper>
  <FormFieldWrapper :label="t('subscriptionform_gender_label')" required>
    <select v-model="model.gender" class="dropdown" required>
      <option v-for="gender in genders" :key="gender.value" :value="gender.value">
        {{ gender.label }}
      </option>
    </select>
  </FormFieldWrapper>
  <FormFieldWrapper :label="t('subscriptionform_birthdate_label')" required>
    <input
      v-model="model.birthdate"
      type="number"
      required
      name="birthdate"
      autocomplete="on"
      class="input"
      min="1900"
      max="2020"
    />
  </FormFieldWrapper>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI36n } from '@jota-one/i36n'
import FormFieldWrapper from '@/components/form/FieldWrapper.vue'
import type { UserProfileDetails } from '@/types'

const SWISS_CANTONS = [
  { value: 'AG', label: 'Aargau' },
  { value: 'AI', label: 'Appenzell Innerrhoden' },
  { value: 'AR', label: 'Appenzell Ausserrhoden' },
  { value: 'BE', label: 'Bern' },
  { value: 'BL', label: 'Basel-Landschaft' },
  { value: 'BS', label: 'Basel-Stadt' },
  { value: 'FR', label: 'Fribourg' },
  { value: 'GE', label: 'Genève' },
  { value: 'GL', label: 'Glarus' },
  { value: 'GR', label: 'Graubünden' },
  { value: 'JU', label: 'Jura' },
  { value: 'LU', label: 'Luzern' },
  { value: 'NE', label: 'Neuchâtel' },
  { value: 'NW', label: 'Nidwalden' },
  { value: 'OW', label: 'Obwalden' },
  { value: 'SG', label: 'St. Gallen' },
  { value: 'SH', label: 'Schaffhausen' },
  { value: 'SO', label: 'Solothurn' },
  { value: 'SZ', label: 'Schwyz' },
  { value: 'TG', label: 'Thurgau' },
  { value: 'TI', label: 'Ticino' },
  { value: 'UR', label: 'Uri' },
  { value: 'VD', label: 'Vaud' },
  { value: 'VS', label: 'Valais / Wallis' },
  { value: 'ZH', label: 'Zürich' },
].sort((a, b) => a.label.localeCompare(b.label))

interface Props {
  modelValue: UserProfileDetails
}

const { t } = useI36n()

const emit = defineEmits(['update:modelValue'])
const props = defineProps<Props>()
const model = ref(props.modelValue)
const genders = [
  { label: t('subscriptionform_gender_female_label'), value: 'female' },
  { label: t('subscriptionform_gender_male_label'), value: 'male' },
  { label: t('subscriptionform_gender_other_label'), value: 'other' },
]

watch(
  () => model.value,
  value => emit('update:modelValue', value),
)
</script>
