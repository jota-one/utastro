<template>
  <el-dialog
    v-model="open"
    title="Proposant (session)"
    width="460px"
    align-center
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <el-form :model="form" label-position="right" label-width="100px">
      <el-form-item label="Label" required>
        <el-input v-model="form.label" maxlength="100" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">Annuler</el-button>
      <el-button
        type="primary"
        :disabled="!form.label"
        :loading="saving"
        @click="save"
      >
        Enregistrer
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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
const form = ref({ label: '' })

const save = async () => {
  saving.value = true
  try {
    if (props.item?.id) {
      await pb
        .collection('ut_event_proposers')
        .update(props.item.id, { label: form.value.label })
    } else {
      await pb
        .collection('ut_event_proposers')
        .create({ label: form.value.label, enabled: true })
    }
    ElMessage.success(
      props.item?.id ? 'Proposant mis à jour' : 'Proposant créé',
    )
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
    form.value = { label: props.item?.label || '' }
  },
)
</script>
