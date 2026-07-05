<template>
  <EntityView
    title="Lieux"
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
        v-model="showEnabled"
        active-text="Activé(s)"
        inactive-text="Désactivé(s)"
        style="
          --el-switch-on-color: var(--el-color-success);
          --el-switch-off-color: var(--el-color-info-light-3);
        "
        @change="load"
      />
    </template>

    <el-table v-loading="loading" :data="items" stripe style="width: 100%">
      <el-table-column label="Ville" width="140">
        <template #default="{ row }">
          {{ row.expand?.city?.label || '—' }}
        </template>
      </el-table-column>
      <el-table-column label="Label" sortable>
        <template #default="{ row }">
          {{ row[`label_${activeLang}`] || row.label_fr || '—' }}
        </template>
      </el-table-column>
      <el-table-column label="Code (imports)" prop="xid" width="160" />
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
      <el-table-column fixed="right" width="180" align="center">
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

  <LocationDialog v-model="dialogOpen" :item="editedItem" @saved="load" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Close, Delete, EditPen } from '@element-plus/icons-vue'
import { pb } from '@/pb'
import EntityView from '../components/EntityView.vue'
import LocationDialog from '../components/LocationDialog.vue'

const loading = ref(false)
const items = ref<Record<string, any>[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const search = ref('')
const showEnabled = ref(true)
const activeLang = ref<'fr' | 'de' | 'en'>('fr')
const dialogOpen = ref(false)
const editedItem = ref<Record<string, any> | null>(null)

const buildFilter = () => {
  const parts: string[] = [`enabled = ${showEnabled.value}`]
  if (search.value.trim()) {
    const s = search.value.trim().replace(/"/g, '\\"')
    parts.push(
      `(xid ~ "${s}" || label_fr ~ "${s}" || label_de ~ "${s}" || address ~ "${s}")`,
    )
  }
  return parts.join(' && ')
}

const load = async () => {
  loading.value = true
  try {
    const result = await pb
      .collection('ut_locations')
      .getList(page.value, pageSize.value, {
        filter: buildFilter(),
        sort: 'label_fr',
        expand: 'city',
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

const toggleEnabled = async (row: Record<string, any>) => {
  try {
    await pb.collection('ut_locations').update(row.id, { enabled: row.enabled })
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
      `Supprimer le lieu "${row.label_fr || row.xid}" ?`,
      'Confirmation',
      {
        confirmButtonText: 'Supprimer',
        cancelButtonText: 'Annuler',
        type: 'warning',
      },
    )
    await pb.collection('ut_locations').delete(row.id)
    ElMessage.success('Lieu supprimé')
    await load()
  } catch {
    // user cancelled
  }
}

onMounted(load)
</script>
