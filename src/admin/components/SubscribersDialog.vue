<template>
  <el-dialog
    v-model="open"
    title="Inscrits à la session"
    width="620px"
    align-center
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <div class="flex items-center mb-2">
      <p class="flex-1 m-0">
        <el-tag hit round size="small" effect="plain">
          {{ item?.subscription_count ?? 0 }}
        </el-tag>
        sur
        <el-tag hit round size="small" effect="plain">
          {{ item?.max_subscriptions ?? 0 }}
        </el-tag>
        inscrit(s)
      </p>
      <span v-if="copied" class="pr-2">Copié !</span>
      <el-button
        size="small"
        round
        :icon="Download"
        :loading="exporting"
        :disabled="subscribers.length === 0"
        @click="onExport"
      >
        Exporter en CSV
      </el-button>
      <el-button
        v-if="isSupported"
        type="primary"
        size="small"
        round
        :disabled="subscribers.length === 0"
        @click="copy(emails)"
      >
        Copier les e-mails
      </el-button>
    </div>
    <el-table
      v-loading="loading"
      :data="subscribers"
      stripe
      style="width: 100%"
    >
      <el-table-column width="50">
        <template #default="{ row }">
          <el-icon
            v-if="row.is_event_admin"
            size="20"
            color="var(--el-color-primary)"
            title="Coach"
          >
            <Star />
          </el-icon>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="Nom" sortable />
      <el-table-column prop="email" label="E-mail" sortable>
        <template #default="{ row }">
          <el-link :href="`mailto:${row.email}`" type="primary">
            {{ row.email }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column width="50">
        <template #default="{ row }">
          <el-icon
            v-if="row.presence"
            color="var(--el-color-success)"
            size="20"
            title="Présent"
          >
            <Select />
          </el-icon>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Select, Star } from '@element-plus/icons-vue'
import { useClipboard } from '@vueuse/core'
import { pb } from '@/pb'
import { useEventExports } from '@/composables/useEventExports'

type Props = {
  modelValue?: boolean
  item?: Record<string, any> | null
}

type Subscriber = {
  name: string
  email: string
  is_event_admin: boolean
  presence: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  item: null,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { copy, copied, isSupported } = useClipboard({ legacy: true })
const eventExports = useEventExports()

const open = ref(props.modelValue)
const loading = ref(false)
const exporting = ref(false)
const subscribers = ref<Subscriber[]>([])

const onExport = async () => {
  exporting.value = true
  try {
    await eventExports.exportSubscribers(props.item!)
  } catch {
    ElMessage.error("Erreur lors de l'export")
  } finally {
    exporting.value = false
  }
}

const emails = computed(() =>
  subscribers.value.map(person => person.email).join('\n'),
)

const load = async () => {
  loading.value = true
  try {
    const subs = await pb.collection('ut_subscriptions').getFullList({
      filter: `event = "${props.item!.id}"`,
      expand: 'user',
    })
    subscribers.value = subs
      .filter(sub => sub.expand?.user)
      .map(sub => ({
        name: sub.expand!.user.name || '',
        email: sub.expand!.user.email || '',
        is_event_admin: Boolean(sub.is_event_admin),
        presence: Boolean(sub.presence),
      }))
      .sort(
        (a, b) =>
          Number(b.is_event_admin) - Number(a.is_event_admin) ||
          a.name.localeCompare(b.name),
      )
  } catch {
    ElMessage.error('Erreur lors du chargement des inscrits')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  value => {
    open.value = value
    if (value && props.item?.id) {
      subscribers.value = []
      load()
    }
  },
)
</script>
