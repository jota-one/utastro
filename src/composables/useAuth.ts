import { computed, ref } from 'vue'
import { useSessionStorage } from '@vueuse/core'
import { pb } from '@/pb'

const user = ref<Record<string, any> | null>(pb.authStore.record)
const userJwt = useSessionStorage('ut_jwt', '')

if (userJwt.value && !pb.authStore.isValid) {
  pb.authStore.save(userJwt.value, user.value as any)
}

export function useAuth() {
  const isAuthenticated = computed(
    () => userJwt.value.length > 0 && pb.authStore.isValid,
  )
  const isAdminUser = computed(() =>
    ['admin', 'superadmin'].includes(user.value?.role),
  )
  const isStaffUser = computed(
    () => user.value?.role === 'staff' || isAdminUser.value,
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
  }

  return {
    isAuthenticated,
    isAdminUser,
    isStaffUser,
    userId,
    login,
    logout,
    user,
    userJwt,
    pb,
  }
}
