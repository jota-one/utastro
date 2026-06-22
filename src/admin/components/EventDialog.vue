<template>
  <el-dialog
    v-model="open"
    :title="item ? 'Modifier la session' : 'Créer une session'"
    width="620px"
    align-center
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <el-form :model="form" label-position="right" label-width="160px">
      <el-form-item label="Titre FR">
        <el-input v-model="form.title_fr" />
      </el-form-item>
      <el-form-item label="Titre DE">
        <el-input v-model="form.title_de" />
      </el-form-item>
      <el-form-item label="Titre EN">
        <el-input v-model="form.title_en" />
      </el-form-item>
      <el-form-item label="Description FR">
        <el-input v-model="form.description_fr" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item label="Description DE">
        <el-input v-model="form.description_de" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item label="Description EN">
        <el-input v-model="form.description_en" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item label="Dates" required>
        <el-date-picker
          v-model="dates"
          type="datetimerange"
          range-separator="→"
          format="DD.MM.YYYY HH:mm"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="Début"
          end-placeholder="Fin"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="Ouv. inscriptions">
        <el-date-picker
          v-model="form.subscription_publish_date"
          type="datetime"
          format="DD.MM.YYYY HH:mm"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="Max inscriptions">
        <el-input-number v-model="form.max_subscriptions" :min="0" />
      </el-form-item>
      <el-form-item label="Lieu" required>
        <el-select
          v-model="form.location"
          filterable
          placeholder="Sélectionner un lieu"
          style="width: 100%"
          @change="onLocationChange"
        >
          <el-option
            v-for="loc in locations"
            :key="loc.id"
            :label="`${loc.cityLabel} — ${loc.label}`"
            :value="loc.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Types">
        <el-select
          v-model="form.types"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="Sélectionner des types"
          style="width: 100%"
        >
          <el-option
            v-for="et in eventTypes"
            :key="et.id"
            :label="`${et.xid}${et.label_fr ? ` (${et.label_fr})` : ''}`"
            :value="et.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Statut">
        <el-select v-model="form.progress" style="width: 200px">
          <el-option value="open" label="Ouvert" />
          <el-option value="running" label="En cours" />
          <el-option value="paused" label="Suspendu" />
          <el-option value="cancelled" label="Annulé" />
          <el-option value="over" label="Terminé" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">Annuler</el-button>
      <el-button
        type="primary"
        :disabled="!formIsValid"
        :loading="saving"
        @click="save"
      >
        Enregistrer
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { pb } from '@/pb'

type Props = {
  modelValue?: boolean
  item?: Record<string, any> | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  item: null,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const open = ref(props.modelValue)
const saving = ref(false)
const locations = ref<
  { id: string; label: string; cityLabel: string; cityId: string }[]
>([])
const eventTypes = ref<Record<string, any>[]>([])
const dates = ref<string[]>([])

const emptyForm = () => ({
  title_fr: '',
  title_de: '',
  title_en: '',
  description_fr: '',
  description_de: '',
  description_en: '',
  start_date: '',
  end_date: '',
  subscription_publish_date: '',
  max_subscriptions: 0,
  location: '',
  city: '',
  types: [] as string[],
  progress: 'open',
})
const form = ref(emptyForm())

const formIsValid = computed(
  () => Boolean(form.value.location) && dates.value?.length === 2,
)

const loadOptions = async () => {
  const [locs, types] = await Promise.all([
    pb.collection('ut_locations').getFullList({
      filter: 'enabled = true',
      sort: 'label_fr',
      expand: 'city',
    }),
    pb
      .collection('ut_event_types')
      .getFullList({ filter: 'enabled = true', sort: 'xid' }),
  ])
  locations.value = locs.map(r => ({
    id: r.id,
    label: r.label_fr || r.label_de || r.xid || '',
    cityLabel: r.expand?.city?.label || '',
    cityId: r.city || '',
  }))
  eventTypes.value = types
}

const onLocationChange = (locationId: string) => {
  const loc = locations.value.find(l => l.id === locationId)
  if (loc) {
    form.value.city = loc.cityId
  }
}

const load = async (id: string) => {
  const record = await pb
    .collection('ut_events')
    .getOne(id, { expand: 'location,types' })

  if (record.location && !locations.value.find(l => l.id === record.location)) {
    const loc = record.expand?.location
    if (loc) {
      const cityRec = loc.city
        ? await pb.collection('ut_cities').getOne(loc.city)
        : null
      locations.value.unshift({
        id: loc.id,
        label: loc.label_fr || loc.label_de || loc.xid || '',
        cityLabel: cityRec?.label || '',
        cityId: loc.city || '',
      })
    }
  }

  form.value = {
    title_fr: record.title_fr || '',
    title_de: record.title_de || '',
    title_en: record.title_en || '',
    description_fr: record.description_fr || '',
    description_de: record.description_de || '',
    description_en: record.description_en || '',
    start_date: record.start_date || '',
    end_date: record.end_date || '',
    subscription_publish_date: record.subscription_publish_date || '',
    max_subscriptions: record.max_subscriptions || 0,
    location: record.location || '',
    city: record.city || '',
    types: (record.expand?.types || []).map((t: any) => t.id),
    progress: record.progress || 'open',
  }
  dates.value = [record.start_date || '', record.end_date || '']
}

const save = async () => {
  saving.value = true
  try {
    const payload = {
      ...form.value,
      start_date: dates.value[0] || '',
      end_date: dates.value[1] || '',
    }
    if (props.item?.id) {
      await pb.collection('ut_events').update(props.item.id, payload)
    } else {
      await pb.collection('ut_events').create(payload)
    }
    ElMessage.success(props.item?.id ? 'Session mise à jour' : 'Session créée')
    emit('saved')
    emit('update:modelValue', false)
  } catch {
    ElMessage.error("Erreur lors de l'enregistrement")
  } finally {
    saving.value = false
  }
}

watch(
  () => props.modelValue,
  value => {
    open.value = value
    if (value && props.item?.id) {
      load(props.item.id)
    } else {
      form.value = emptyForm()
      dates.value = []
    }
  },
)

onMounted(loadOptions)
</script>
