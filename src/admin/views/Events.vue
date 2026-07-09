<template>
  <EntityView
    title="Sessions"
    v-model:search="search"
    v-model:page="page"
    v-model:page-size="pageSize"
    v-model:lang="activeLang"
    :total="total"
    @create="openCreate"
    @load="load"
    @search="onSearch"
  >
    <template #extra-start>
      <el-switch
        v-model="showUpcoming"
        active-text="À venir"
        inactive-text="Passées"
        style="
          --el-switch-on-color: var(--el-color-success);
          --el-switch-off-color: var(--el-color-info-light-3);
        "
        @change="load"
      />
    </template>

    <template #extra-end>
      <el-button :icon="Upload" @click="importDialogOpen = true">
        Importer
      </el-button>
    </template>

    <el-table v-loading="loading" :data="items" stripe style="width: 100%">
      <el-table-column label="Lieu" width="200">
        <template #default="{ row }">
          <div class="text-xs text-gray-400">{{ row.expand?.city?.label }}</div>
          <div>
            {{
              row.expand?.location?.label_fr ||
              row.expand?.location?.label_de ||
              '—'
            }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Début" width="140" sortable prop="start_date">
        <template #default="{ row }">
          {{
            row.start_date
              ? dayjs(row.start_date).format('DD.MM.YYYY HH:mm')
              : '—'
          }}
        </template>
      </el-table-column>
      <el-table-column label="Titre">
        <template #default="{ row }">
          {{ row[`title_${activeLang}`] || row.title_fr || '—' }}
        </template>
      </el-table-column>
      <el-table-column label="Ouv. inscr." width="140">
        <template #default="{ row }">
          {{
            row.subscription_publish_date
              ? dayjs(row.subscription_publish_date).format('DD.MM.YYYY HH:mm')
              : '—'
          }}
        </template>
      </el-table-column>
      <el-table-column label="Inscrits" width="90" align="center">
        <template #default="{ row }">
          <el-tag
            size="small"
            effect="plain"
            :class="{ 'cursor-pointer': (row.subscription_count ?? 0) > 0 }"
            @click="onShowSubscribers(row)"
          >
            {{ row.subscription_count ?? 0 }} / {{ row.max_subscriptions ?? 0 }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Types" width="160">
        <template #default="{ row }">
          <el-tag
            v-for="type in row.expand?.types || []"
            :key="type.id"
            size="small"
            class="mr-1"
          >
            {{ type[`label_${activeLang}`] || type.label_fr || type.xid }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Statut" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="progressType(row.progress)" size="small">
            {{ progressLabel(row.progress) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" width="170" align="center">
        <template #default="{ row }">
          <el-button
            size="small"
            :icon="Download"
            :loading="exportingId === row.id"
            title="Exporter les inscrits"
            @click="exportSubscribers(row)"
          />
          <el-button size="small" :icon="EditPen" @click="openEdit(row)" />
          <el-button
            size="small"
            type="danger"
            :icon="Delete"
            @click="onDelete(row)"
          />
        </template>
      </el-table-column>
    </el-table>
  </EntityView>

  <EventDialog v-model="dialogOpen" :item="editedItem" @saved="load" />
  <EventsImportDialog v-model="importDialogOpen" @imported="load" />
  <SubscribersDialog v-model="subscribersDialogOpen" :item="subscribersItem" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Download, EditPen, Upload } from '@element-plus/icons-vue'
import { pb } from '@/pb'
import { useEventExports } from '@/composables/useEventExports'
import EntityView from '../components/EntityView.vue'
import EventDialog from '../components/EventDialog.vue'
import EventsImportDialog from '../components/EventsImportDialog.vue'
import SubscribersDialog from '../components/SubscribersDialog.vue'

const eventExports = useEventExports()

const loading = ref(false)
const exportingId = ref<string | null>(null)
const items = ref<Record<string, any>[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const search = ref('')
const showUpcoming = ref(true)
const activeLang = ref<'fr' | 'de' | 'en'>('fr')
const dialogOpen = ref(false)
const importDialogOpen = ref(false)
const subscribersDialogOpen = ref(false)
const editedItem = ref<Record<string, any> | null>(null)
const subscribersItem = ref<Record<string, any> | null>(null)

const progressLabel = (p: string) =>
  ({
    open: 'Ouvert',
    running: 'En cours',
    paused: 'Suspendu',
    cancelled: 'Annulé',
    over: 'Terminé',
  })[p] ?? p

const progressType = (
  p: string,
): '' | 'success' | 'warning' | 'danger' | 'info' =>
  (({
    open: 'success',
    running: '',
    paused: 'warning',
    cancelled: 'danger',
    over: 'info',
  })[p] as any) ?? ''

const buildFilter = () => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const parts: string[] = [
    showUpcoming.value ? `start_date >= "${now}"` : `start_date < "${now}"`,
  ]
  if (search.value.trim()) {
    const s = search.value.trim().replace(/"/g, '\\"')
    parts.push(`(title_fr ~ "${s}" || title_de ~ "${s}" || title_en ~ "${s}")`)
  }
  return parts.join(' && ')
}

const load = async () => {
  loading.value = true
  try {
    const result = await pb
      .collection('ut_events')
      .getList(page.value, pageSize.value, {
        filter: buildFilter(),
        sort: showUpcoming.value ? 'start_date' : '-start_date',
        expand: 'location,city,types',
      })
    items.value = result.items
    total.value = result.totalItems
  } catch {
    ElMessage.error('Erreur lors du chargement')
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  page.value = 1
  load()
}

const exportSubscribers = async (row: Record<string, any>) => {
  exportingId.value = row.id
  try {
    await eventExports.exportSubscribers(row)
  } catch {
    ElMessage.error("Erreur lors de l'export")
  } finally {
    exportingId.value = null
  }
}

const onShowSubscribers = (row: Record<string, any>) => {
  if ((row.subscription_count ?? 0) > 0) {
    subscribersItem.value = row
    subscribersDialogOpen.value = true
  }
}

const openCreate = () => {
  editedItem.value = null
  dialogOpen.value = true
}

const openEdit = (row: Record<string, any>) => {
  editedItem.value = row
  dialogOpen.value = true
}

const onDelete = async (row: Record<string, any>) => {
  try {
    await ElMessageBox.confirm(
      `Supprimer la session "${row.title_fr || row.title_de || row.id}" ?`,
      'Confirmation',
      {
        confirmButtonText: 'Supprimer',
        cancelButtonText: 'Annuler',
        type: 'warning',
      },
    )
    await pb.collection('ut_events').delete(row.id)
    ElMessage.success('Session supprimée')
    await load()
  } catch {
    // user cancelled
  }
}

onMounted(load)
</script>
