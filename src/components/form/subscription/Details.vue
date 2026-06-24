<template>
  <FormFieldWrapper
    :label="t('subscriptionform_name_label')"
    required
    :filled="Boolean(model.name) && !errors.name"
    :error="errors.name"
  >
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
  <FormFieldWrapper
    :label="t('subscriptionform_zip_label')"
    required
    :filled="Boolean(model.zip) && !errors.zip"
    :error="errors.zip"
  >
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
  <FormFieldWrapper
    :label="t('subscriptionform_city_label')"
    required
    :filled="Boolean(model.city) && !errors.city"
    :error="errors.city"
  >
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
  <FormFieldWrapper
    :label="t('subscriptionform_country_label')"
    required
    :filled="Boolean(model.country)"
  >
    <select v-model="model.country" class="dropdown" required>
      <option
        v-for="country in countries"
        :key="country.value"
        :value="country.value"
      >
        {{ country.label }}
      </option>
    </select>
  </FormFieldWrapper>
  <FormFieldWrapper
    :label="t('subscriptionform_region_label')"
    :required="model.country === 'CH'"
    :filled="Boolean(model.regionId)"
  >
    <select
      v-model="model.regionId"
      class="dropdown"
      :required="model.country === 'CH'"
      :disabled="model.country !== 'CH'"
    >
      <option value="" disabled>
        {{ t('subscriptionform_region_placeholder') }}
      </option>
      <option
        v-for="canton in SWISS_CANTONS"
        :key="canton.value"
        :value="canton.value"
      >
        {{ canton.label }}
      </option>
    </select>
  </FormFieldWrapper>
  <FormFieldWrapper
    :label="t('subscriptionform_phone_label')"
    required
    :filled="Boolean(model.phone) && !errors.phone"
    :error="errors.phone"
  >
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
  <FormFieldWrapper
    :label="t('subscriptionform_gender_label')"
    required
    :filled="Boolean(model.gender)"
  >
    <select v-model="model.gender" class="dropdown" required>
      <option value="" disabled>
        {{ t('subscriptionform_gender_placeholder') }}
      </option>
      <option
        v-for="gender in genders"
        :key="gender.value"
        :value="gender.value"
      >
        {{ gender.label }}
      </option>
    </select>
  </FormFieldWrapper>
  <FormFieldWrapper
    :label="t('subscriptionform_birthdate_label')"
    required
    :filled="Boolean(model.birthdate) && !errors.birthdate"
    :error="errors.birthdate"
  >
    <input
      v-model="model.birthdate"
      type="number"
      required
      name="birthdate"
      autocomplete="on"
      class="input"
      :min="currentYear - 100"
      :max="currentYear - 5"
    />
  </FormFieldWrapper>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useI36n } from '@jota-one/i36n'
import FormFieldWrapper from '@/components/form/FieldWrapper.vue'
import AppErrorCode from '@/AppErrorCode'
import {
  validateName,
  validatePhone,
  validateBirthYear,
  validateCity,
  validateZip,
} from '@/utils/validate'
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
const errors = reactive<Record<string, string>>({})
const currentYear = computed(() => new Date().getFullYear())

const countries = computed(() => [
  { value: 'CH', label: t('subscriptionform_country_ch') },
  { value: 'AT', label: t('subscriptionform_country_at') },
  { value: 'DE', label: t('subscriptionform_country_de') },
  { value: 'FR', label: t('subscriptionform_country_fr') },
  { value: 'IT', label: t('subscriptionform_country_it') },
  { value: 'LI', label: t('subscriptionform_country_li') },
  { value: 'OTHER', label: t('subscriptionform_country_other') },
])

const genders = computed(() => [
  { label: t('subscriptionform_gender_female_label'), value: 'female' },
  { label: t('subscriptionform_gender_male_label'), value: 'male' },
  { label: t('subscriptionform_gender_other_label'), value: 'other' },
])

const applyError = (fn: () => void, key: string) => {
  try {
    fn()
    delete errors[key]
  } catch (e: any) {
    errors[key] = t(AppErrorCode[e.cause] as string)
  }
}

watch(
  () => model.value,
  value => {
    applyError(() => validateName(value.name || ''), 'name')
    applyError(() => validatePhone(value.phone || ''), 'phone')
    applyError(() => validateBirthYear(value.birthdate), 'birthdate')
    applyError(() => validateCity(value.city || ''), 'city')
    applyError(() => validateZip(value.zip), 'zip')
    emit('update:modelValue', value)
  },
  { deep: true },
)

watch(
  () => model.value.country,
  country => {
    if (country !== 'CH') {
      model.value.regionId = 'OUTSIDE'
    } else if (model.value.regionId === 'OUTSIDE') {
      model.value.regionId = undefined
    }
  },
)
</script>
