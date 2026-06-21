<template>
  <el-dialog
    v-model="open"
    :title="item ? 'Modifier le lieu' : 'Créer un lieu'"
    width="540px"
    align-center
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <el-form :model="form" label-position="right" label-width="120px">
      <el-form-item label="Ville" required>
        <el-select v-model="form.city" placeholder="Sélectionner une ville" class="w-full">
          <el-option
            v-for="city in cities"
            :key="city.id"
            :label="city.label"
            :value="city.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Label FR">
        <el-input v-model="form.label_fr" />
      </el-form-item>
      <el-form-item label="Label DE">
        <el-input v-model="form.label_de" />
      </el-form-item>
      <el-form-item label="Label EN">
        <el-input v-model="form.label_en" />
      </el-form-item>
      <el-form-item label="XID">
        <el-input v-model="form.xid" placeholder="ex: geneve-plainpalais" />
      </el-form-item>
      <el-form-item label="Coords">
        <el-input v-model="form.coords" placeholder="46.2044,6.1432" />
      </el-form-item>
      <el-form-item label="Adresse">
        <el-input v-model="form.address" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">Annuler</el-button>
      <el-button type="primary" :disabled="!formIsValid" :loading="saving" @click="save">
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
const cities = ref<{ id: string; label: string; slug: string }[]>([])

const emptyForm = () => ({ city: '', label_fr: '', label_de: '', label_en: '', xid: '', coords: '', address: '' })
const form = ref(emptyForm())

const formIsValid = computed(() => Boolean(form.value.city) && Boolean(form.value.label_fr || form.value.label_de || form.value.label_en))

const loadCities = async () => {
  const result = await pb.collection('ut_cities').getFullList({ sort: 'label', filter: 'enabled = true' })
  cities.value = result.map(r => ({ id: r.id, label: r.label, slug: r.slug }))
}

const load = async (id: string) => {
  const record = await pb.collection('ut_locations').getOne(id)
  form.value = {
    city: record.city || '',
    label_fr: record.label_fr || '',
    label_de: record.label_de || '',
    label_en: record.label_en || '',
    xid: record.xid || '',
    coords: record.coords || '',
    address: record.address || '',
  }
}

const save = async () => {
  saving.value = true
  try {
    if (props.item?.id) {
      await pb.collection('ut_locations').update(props.item.id, form.value)
    } else {
      await pb.collection('ut_locations').create({ ...form.value, enabled: true })
    }
    ElMessage.success(props.item?.id ? 'Lieu mis à jour' : 'Lieu créé')
    emit('saved')
    emit('update:modelValue', false)
  } catch {
    ElMessage.error('Erreur lors de l\'enregistrement')
  } finally {
    saving.value = false
  }
}

watch(
  () => form.value.city,
  (cityId, prevCityId) => {
    const city = cities.value.find(c => c.id === cityId)
    const prevCity = cities.value.find(c => c.id === prevCityId)
    if (city && (form.value.xid === '' || form.value.xid === `${prevCity?.slug}-`)) {
      form.value.xid = `${city.slug}-`
    }
  },
)

watch(
  () => props.modelValue,
  (value) => {
    open.value = value
    if (value && props.item?.id) {
      load(props.item.id)
    } else {
      form.value = emptyForm()
    }
  },
)

onMounted(loadCities)
</script>
