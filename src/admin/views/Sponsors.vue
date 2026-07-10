<template>
  <EntityView
    title="Sponsors"
    v-model:search="search"
    v-model:page="page"
    v-model:page-size="pageSize"
    :total="total"
    @create="openCreate"
    @load="load"
    @search="onSearch"
  >
    <el-table v-loading="loading" :data="items" stripe style="width: 100%">
      <el-table-column label="Logo" width="120" align="center">
        <template #default="{ row }">
          <img
            v-if="row.logo"
            :src="pb.files.getURL(row, row.logo, { thumb: '100x100' })"
            class="h-10 max-w-24 object-contain inline-block"
          />
        </template>
      </el-table-column>
      <el-table-column label="Nom" prop="name" sortable />
      <el-table-column label="Lien">
        <template #default="{ row }">
          <a
            v-if="row.link"
            :href="row.link"
            target="_blank"
            class="text-blue-500 hover:underline"
            >{{ row.link }}</a
          >
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="Visibilité" width="200">
        <template #default="{ row }">
          <el-tag v-if="row.global" type="success" size="small">
            Global
          </el-tag>
          <el-tag v-else type="info" size="small">
            {{ row.cities?.length || 0 }} ville(s)
          </el-tag>
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

  <SponsorDialog v-model="dialogOpen" :item="editedItem" @saved="load" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Close, Delete, EditPen } from '@element-plus/icons-vue'
import { pb } from '@/pb'
import EntityView from '../components/EntityView.vue'
import SponsorDialog from '../components/SponsorDialog.vue'

const loading = ref(false)
const items = ref<Record<string, any>[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const search = ref('')
const dialogOpen = ref(false)
const editedItem = ref<Record<string, any> | null>(null)

const buildFilter = () => {
  if (search.value.trim()) {
    const s = search.value.trim().replace(/"/g, '\\"')
    return `name ~ "${s}"`
  }
  return ''
}

const load = async () => {
  loading.value = true
  try {
    const result = await pb
      .collection('ut_sponsors')
      .getList(page.value, pageSize.value, {
        filter: buildFilter(),
        sort: 'name',
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
    await pb.collection('ut_sponsors').update(row.id, { enabled: row.enabled })
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
      `Supprimer le sponsor "${row.name}" ?`,
      'Confirmation',
      {
        confirmButtonText: 'Supprimer',
        cancelButtonText: 'Annuler',
        type: 'warning',
      },
    )
    await pb.collection('ut_sponsors').delete(row.id)
    ElMessage.success('Sponsor supprimé')
    await load()
  } catch {
    // user cancelled
  }
}

onMounted(load)
</script>
