<template>
  <el-dialog
    v-model="open"
    :title="item ? 'Modifier le sponsor' : 'Créer un sponsor'"
    width="560px"
    align-center
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <el-form :model="form" label-position="right" label-width="120px">
      <el-form-item label="Nom" required>
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="Logo" :required="!item">
        <div class="flex items-center gap-4">
          <img
            v-if="logoPreview"
            :src="logoPreview"
            class="h-12 max-w-32 object-contain"
          />
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            :on-change="onLogoChange"
          >
            <el-button :icon="Upload">
              {{ logoPreview ? 'Remplacer' : 'Choisir un fichier' }}
            </el-button>
          </el-upload>
        </div>
      </el-form-item>
      <el-form-item label="Lien">
        <el-input v-model="form.link" placeholder="https://…" />
      </el-form-item>
      <el-form-item label="Global">
        <el-switch v-model="form.global" />
        <span class="ml-3 text-xs text-gray-400">
          Sponsor national, non lié à des villes (pas affiché sur les pages
          ville)
        </span>
      </el-form-item>
      <el-form-item v-if="!form.global" label="Villes">
        <el-select
          v-model="form.cities"
          multiple
          filterable
          placeholder="Sélectionner des villes"
          style="width: 100%"
        >
          <el-option
            v-for="city in cityOptions"
            :key="city.id"
            :value="city.id"
            :label="city.label"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Activé">
        <el-switch v-model="form.enabled" />
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
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
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
const logoFile = ref<File | null>(null)
const logoPreview = ref('')
const cityOptions = ref<{ id: string; label: string }[]>([])

const emptyForm = () => ({
  name: '',
  link: '',
  global: false,
  cities: [] as string[],
  enabled: true,
})
const form = ref(emptyForm())

const formIsValid = computed(
  () => !!form.value.name && (!!props.item || !!logoFile.value),
)

const onLogoChange = (file: UploadFile) => {
  if (!file.raw) {
    return
  }
  logoFile.value = file.raw
  logoPreview.value = URL.createObjectURL(file.raw)
}

const loadCities = async () => {
  if (cityOptions.value.length) {
    return
  }
  const records = await pb.collection('ut_cities').getFullList({
    sort: 'label',
    fields: 'id,label',
  })
  cityOptions.value = records.map(r => ({ id: r.id, label: r.label }))
}

const save = async () => {
  saving.value = true
  try {
    const payload: Record<string, any> = {
      name: form.value.name,
      link: form.value.link,
      global: form.value.global,
      cities: form.value.global ? [] : form.value.cities,
      enabled: form.value.enabled,
    }
    if (logoFile.value) {
      payload.logo = logoFile.value
    }
    if (props.item?.id) {
      await pb.collection('ut_sponsors').update(props.item.id, payload)
    } else {
      await pb.collection('ut_sponsors').create(payload)
    }
    ElMessage.success(props.item?.id ? 'Sponsor mis à jour' : 'Sponsor créé')
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
    if (!value) {
      return
    }
    loadCities()
    logoFile.value = null
    if (props.item) {
      form.value = {
        name: props.item.name || '',
        link: props.item.link || '',
        global: props.item.global || false,
        cities: props.item.cities || [],
        enabled: props.item.enabled || false,
      }
      logoPreview.value = props.item.logo
        ? pb.files.getURL(props.item, props.item.logo, { thumb: '100x100' })
        : ''
    } else {
      form.value = emptyForm()
      logoPreview.value = ''
    }
  },
)
</script>
