import { computed, ref } from "vue"

interface Modal {
  open: boolean
  params?: any
}

interface Modals {
  [modal_id: string]: Modal
}

const modals = ref<Modals>({})

export default function useModal() {
  const modalParams = ref<any>({})
  
  const registerModal = (id: string) => {
    if (!modals.value[id]) {
      modals.value[id] = { open: false }
    }
  }

  const openModal = (id: string, params?: any) => {
    if (!modals.value[id]) {
      registerModal(id)
    }

    modals.value[id].open = true
    modalParams.value = params || {}
  }

  const closeModal = (id: string) => {
    modals.value[id].open = false
  }

  return {
    registerModal,
    openModal,
    closeModal,
    modals: computed(() => modals.value),
    openedModal: computed(
      () =>
        Object.entries(modals.value)
          .filter(([, { open }]) => open)
          .map(([id]) => id)[0],
    ),
    modalParams,
  }
}
