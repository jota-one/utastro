<template>
  <div>
    <div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
      <h1 class="text-xl font-bold m-0">Sessions</h1>
      <div class="flex items-center gap-3 flex-wrap">
        <el-radio-group v-model="activeLang" size="small">
          <el-radio-button value="fr">FR</el-radio-button>
          <el-radio-button value="de">DE</el-radio-button>
          <el-radio-button value="en">EN</el-radio-button>
        </el-radio-group>
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
        <el-input
          v-model="search"
          placeholder="Rechercher..."
          clearable
          style="width: 200px"
          @input="onSearch"
          @clear="onSearch"
        />
        <el-button type="primary" @click="openCreate">+ Créer</el-button>
      </div>
    </div>

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
          <el-tag size="small" effect="plain">
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
      <el-table-column fixed="right" width="150" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">Modifier</el-button>
          <el-button size="small" type="danger" @click="onDelete(row)"
            >Suppr.</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <div class="flex justify-end mt-4">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="load"
        @current-change="load"
      />
    </div>

    <EventDialog v-model="dialogOpen" :item="editedItem" @saved="load" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pb } from '@/pb'
import EventDialog from '../components/EventDialog.vue'

const loading = ref(false)
const items = ref<Record<string, any>[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const search = ref('')
const showUpcoming = ref(true)
const activeLang = ref<'fr' | 'de' | 'en'>('fr')
const dialogOpen = ref(false)
const editedItem = ref<Record<string, any> | null>(null)

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
