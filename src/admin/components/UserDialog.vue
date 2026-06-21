<template>
  <el-dialog
    v-model="open"
    :title="item ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'"
    width="560px"
    align-center
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <el-form :model="form" label-position="right" label-width="140px">
      <el-form-item label="Nom" required>
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="Email" required>
        <el-input v-model="form.email" type="email" />
      </el-form-item>
      <el-form-item :label="item ? 'Nouveau mdp' : 'Mot de passe'" :required="!item">
        <div class="flex items-center gap-2 w-full">
          <el-input v-model="form.password" :type="showPassword ? 'text' : 'password'" class="flex-1" />
          <el-button size="small" @click="showPassword = !showPassword">
            {{ showPassword ? 'Cacher' : 'Voir' }}
          </el-button>
        </div>
      </el-form-item>
      <el-form-item v-if="form.password" label="Confirmer">
        <el-input v-model="form.passwordConfirm" :type="showPassword ? 'text' : 'password'" />
      </el-form-item>
      <el-form-item label="Rôle">
        <el-select v-model="form.role" style="width: 180px">
          <el-option value="user" label="Utilisateur" />
          <el-option value="coach" label="Coach" />
          <el-option value="admin" label="Admin" />
          <el-option value="superadmin" label="Super Admin" />
        </el-select>
      </el-form-item>
      <el-form-item label="Vérifié">
        <el-switch v-model="form.verified" />
      </el-form-item>
      <el-form-item label="Téléphone">
        <el-input v-model="form.phone" />
      </el-form-item>
      <el-form-item label="Ville">
        <el-input v-model="form.city" />
      </el-form-item>
      <el-form-item label="Pays">
        <el-input v-model="form.country" />
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
const showPassword = ref(false)

const emptyForm = () => ({
  name: '', email: '', password: '', passwordConfirm: '',
  role: 'user', verified: false, phone: '', city: '', country: '',
})
const form = ref(emptyForm())

const formIsValid = computed(() => {
  if (!form.value.name || !form.value.email) {
    return false
  }
  if (!props.item && !form.value.password) {
    return false
  }
  if (form.value.password && form.value.password !== form.value.passwordConfirm) {
    return false
  }
  return true
})

const load = async (id: string) => {
  const record = await pb.collection('ut_users').getOne(id)
  form.value = {
    name: record.name || '',
    email: record.email || '',
    password: '',
    passwordConfirm: '',
    role: record.role || 'user',
    verified: record.verified || false,
    phone: record.phone || '',
    city: record.city || '',
    country: record.country || '',
  }
}

const save = async () => {
  saving.value = true
  try {
    const payload: Record<string, any> = {
      name: form.value.name,
      email: form.value.email,
      role: form.value.role,
      verified: form.value.verified,
      phone: form.value.phone,
      city: form.value.city,
      country: form.value.country,
    }
    if (form.value.password) {
      payload.password = form.value.password
      payload.passwordConfirm = form.value.passwordConfirm
    }
    if (props.item?.id) {
      await pb.collection('ut_users').update(props.item.id, payload)
    } else {
      await pb.collection('ut_users').create(payload)
    }
    ElMessage.success(props.item?.id ? 'Utilisateur mis à jour' : 'Utilisateur créé')
    emit('saved')
    emit('update:modelValue', false)
  } catch {
    ElMessage.error('Erreur lors de l\'enregistrement')
  } finally {
    saving.value = false
  }
}

watch(
  () => props.modelValue,
  (value) => {
    open.value = value
    showPassword.value = false
    if (value && props.item?.id) {
      load(props.item.id)
    } else {
      form.value = emptyForm()
    }
  },
)
</script>
