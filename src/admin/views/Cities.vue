<template>
  <EntityView
    title="Villes"
    v-model:search="search"
    v-model:page="page"
    v-model:page-size="pageSize"
    :total="total"
    @create="openCreate"
    @load="load"
    @search="onSearch"
  >
    <template #extra-start>
      <el-switch
        v-model="showEnabled"
        active-text="Activée(s)"
        inactive-text="Désactivée(s)"
        style="
          --el-switch-on-color: var(--el-color-success);
          --el-switch-off-color: var(--el-color-info-light-3);
        "
        @change="load"
      />
    </template>

    <template #extra-end>
      <el-dropdown trigger="click" @command="runGlobalExport">
        <el-button :icon="Download" :loading="exporting">
          Exporter<el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="allWatchers">
              Tous les observateurs
            </el-dropdown-item>
            <el-dropdown-item command="allSubscribers">
              Tous les inscrits
            </el-dropdown-item>
            <el-dropdown-item command="allWatchersOrSubscribers">
              Tous les observateurs ou inscrits
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>

    <el-table v-loading="loading" :data="items" stripe style="width: 100%">
      <el-table-column label="Nom" prop="label" sortable />
      <el-table-column label="Slug" prop="slug" width="160" />
      <el-table-column label="Coords" width="180">
        <template #default="{ row }">
          <a
            v-if="row.coords"
            :href="`https://www.google.com/maps/place/${row.coords}`"
            target="_blank"
            class="text-blue-500 hover:underline"
            >{{ row.coords }}</a
          >
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column fixed="right" width="230" align="center">
        <template #default="{ row }">
          <el-switch
            v-model="row.enabled"
            class="mr-2"
            inline-prompt
            :active-icon="Check"
            :inactive-icon="Close"
            style="
              --el-switch-on-color: var(--el-color-success);
              --el-switch-off-color: var(--el-color-info-light-3);
            "
            @change="toggleEnabled(row)"
          />
          <el-dropdown
            trigger="click"
            class="mr-2"
            style="vertical-align: middle"
            @command="(cmd: string) => runCityExport(cmd, row)"
          >
            <el-button size="small" :icon="Download" :loading="exporting" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="watchers">
                  Observateurs
                </el-dropdown-item>
                <el-dropdown-item command="subscribers">
                  Inscrits
                </el-dropdown-item>
                <el-dropdown-item command="watchersOrSubscribers">
                  Observateurs ou inscrits
                </el-dropdown-item>
                <el-dropdown-item command="statistics">
                  Statistiques de présence
                </el-dropdown-item>
                <el-dropdown-item command="all">
                  Inscriptions détaillées
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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

  <CityDialog v-model="dialogOpen" :item="editedItem" @saved="load" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  Check,
  Close,
  Delete,
  Download,
  EditPen,
} from '@element-plus/icons-vue'
import { pb } from '@/pb'
import { useCityExports } from '@/composables/useCityExports'
import EntityView from '../components/EntityView.vue'
import CityDialog from '../components/CityDialog.vue'

const cityExports = useCityExports()
const exporting = ref(false)

const loading = ref(false)
const items = ref<Record<string, any>[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const search = ref('')
const showEnabled = ref(true)
const dialogOpen = ref(false)
const editedItem = ref<Record<string, any> | null>(null)

const buildFilter = () => {
  const parts: string[] = [`enabled = ${showEnabled.value}`]
  if (search.value.trim()) {
    const s = search.value.trim().replace(/"/g, '\\"')
    parts.push(`(label ~ "${s}" || slug ~ "${s}")`)
  }
  return parts.join(' && ')
}

const load = async () => {
  loading.value = true
  try {
    const result = await pb
      .collection('ut_cities')
      .getList(page.value, pageSize.value, {
        filter: buildFilter(),
        sort: 'label',
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

const withExporting = async (task: () => Promise<void>) => {
  exporting.value = true
  try {
    await task()
  } catch {
    ElMessage.error("Erreur lors de l'export")
  } finally {
    exporting.value = false
  }
}

const runGlobalExport = (command: string) => {
  const actions: Record<string, () => Promise<void>> = {
    allWatchers: cityExports.exportAllWatchers,
    allSubscribers: cityExports.exportAllSubscribers,
    allWatchersOrSubscribers: cityExports.exportAllWatchersOrSubscribers,
  }
  return withExporting(actions[command])
}

const runCityExport = (command: string, row: Record<string, any>) => {
  const actions: Record<string, () => Promise<void>> = {
    watchers: () => cityExports.exportWatchers(row.id, row.slug),
    subscribers: () => cityExports.exportSubscribers(row.id, row.slug),
    watchersOrSubscribers: () =>
      cityExports.exportWatchersOrSubscribers(row.id, row.slug),
    statistics: () =>
      cityExports.exportSubscriptionsStatistics(row.id, row.slug),
    all: () => cityExports.exportSubscriptionsAll(row.id, row.slug),
  }
  return withExporting(actions[command])
}

const toggleEnabled = async (row: Record<string, any>) => {
  try {
    await pb.collection('ut_cities').update(row.id, { enabled: row.enabled })
  } catch {
    row.enabled = !row.enabled
    ElMessage.error('Erreur lors de la mise à jour')
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
      `Supprimer la ville "${row.label}" ?`,
      'Confirmation',
      {
        confirmButtonText: 'Supprimer',
        cancelButtonText: 'Annuler',
        type: 'warning',
      },
    )
    await pb.collection('ut_cities').delete(row.id)
    ElMessage.success('Ville supprimée')
    await load()
  } catch {
    // user cancelled
  }
}

onMounted(load)
</script>
