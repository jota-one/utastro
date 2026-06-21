<template>
  <el-dialog
    v-model="open"
    :title="item ? 'Modifier la ville' : 'Créer une ville'"
    width="480px"
    align-center
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <el-form :model="form" label-position="right" label-width="100px">
      <el-form-item label="Nom" required>
        <el-input v-model="form.label" />
      </el-form-item>
      <el-form-item label="Slug">
        <el-input v-model="form.slug" placeholder="ex: geneve" />
      </el-form-item>
      <el-form-item label="Coords">
        <el-input v-model="form.coords" placeholder="46.2044,6.1432" />
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

const emptyForm = () => ({ label: '', slug: '', coords: '' })
const form = ref(emptyForm())

const formIsValid = computed(() => Boolean(form.value.label))

const load = async (id: string) => {
  const record = await pb.collection('ut_cities').getOne(id)
  form.value = {
    label: record.label || '',
    slug: record.slug || '',
    coords: record.coords || '',
  }
}

const save = async () => {
  saving.value = true
  try {
    if (props.item?.id) {
      await pb.collection('ut_cities').update(props.item.id, form.value)
    } else {
      await pb.collection('ut_cities').create({ ...form.value, enabled: true })
    }
    ElMessage.success(props.item?.id ? 'Ville mise à jour' : 'Ville créée')
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
    }
  },
)
</script>
