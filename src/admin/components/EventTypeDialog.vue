<template>
  <el-dialog
    v-model="open"
    :title="item ? 'Modifier le type' : 'Créer un type'"
    width="500px"
    align-center
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <el-form :model="form" label-position="right" label-width="120px">
      <el-form-item label="XID" required>
        <el-input v-model="form.xid" placeholder="ex: yoga, crossfit" />
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
  prefill?: Record<string, any> | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  item: null,
  prefill: null,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const open = ref(props.modelValue)
const saving = ref(false)

const emptyForm = () => ({ xid: '', label_fr: '', label_de: '', label_en: '' })
const form = ref(emptyForm())

const formIsValid = computed(
  () =>
    Boolean(form.value.xid) &&
    Boolean(form.value.label_fr || form.value.label_de || form.value.label_en),
)

const load = async (id: string) => {
  const record = await pb.collection('ut_event_types').getOne(id)
  form.value = {
    xid: record.xid || '',
    label_fr: record.label_fr || '',
    label_de: record.label_de || '',
    label_en: record.label_en || '',
  }
}

const save = async () => {
  saving.value = true
  try {
    if (props.item?.id) {
      await pb.collection('ut_event_types').update(props.item.id, form.value)
    } else {
      await pb
        .collection('ut_event_types')
        .create({ ...form.value, enabled: true })
    }
    ElMessage.success(props.item?.id ? 'Type mis à jour' : 'Type créé')
    emit('saved')
    emit('update:modelValue', false)
  } catch (e) {
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
      form.value = { ...emptyForm(), ...props.prefill }
    }
  },
)
</script>
