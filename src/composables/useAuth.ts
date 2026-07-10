import { computed, ref } from 'vue'
import { useSessionStorage } from '@vueuse/core'
import { pb } from '@/pb'

const userJwt = useSessionStorage('ut_jwt', '')
// admin session backup while impersonating a user ("se connecter en tant que")
const impersonatorBackup = useSessionStorage('ut_impersonator', '')
const user = ref<Record<string, any> | null>(
  userJwt.value ? pb.authStore.record : null,
)

if (userJwt.value && !pb.authStore.isValid) {
  pb.authStore.save(userJwt.value, user.value as any)
} else if (!userJwt.value) {
  pb.authStore.clear()
}

export function useAuth() {
  const isAuthenticated = computed(
    () => userJwt.value.length > 0 && pb.authStore.isValid,
  )
  const isAdminUser = computed(() =>
    ['admin', 'superadmin'].includes(user.value?.role),
  )
  const isStaffUser = computed(
    () => user.value?.role === 'coach' || isAdminUser.value,
  )
  const userId = computed(() => user.value?.id)

  const login = async (credentials: { email: string; password: string }) => {
    const data = await pb.send('/api/custom/auth/login', {
      method: 'POST',
      body: credentials,
    })

    pb.authStore.save(data.token, data.record)
    userJwt.value = data.token
    user.value = data.record

    return data.token
  }

  const logout = () => {
    pb.authStore.clear()
    userJwt.value = ''
    user.value = null
    impersonatorBackup.value = ''
  }

  const isImpersonating = computed(() => impersonatorBackup.value.length > 0)

  const impersonate = async (impersonatedUserId: string) => {
    const data = await pb.send(
      `/api/custom/users/${impersonatedUserId}/impersonate`,
      { method: 'POST' },
    )
    impersonatorBackup.value = JSON.stringify({
      token: userJwt.value,
      record: user.value,
    })
    pb.authStore.save(data.token, data.record)
    userJwt.value = data.token
    user.value = data.record
  }

  const stopImpersonation = () => {
    if (!impersonatorBackup.value) {
      return
    }
    const { token, record } = JSON.parse(impersonatorBackup.value)
    impersonatorBackup.value = ''
    pb.authStore.save(token, record)
    userJwt.value = token
    user.value = record
  }

  return {
    isAuthenticated,
    isAdminUser,
    isImpersonating,
    isStaffUser,
    userId,
    impersonate,
    login,
    logout,
    stopImpersonation,
    user,
    userJwt,
    pb,
  }
}
