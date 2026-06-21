<template>
  <div>
    <div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
      <h1 class="text-xl font-bold m-0">Types de sessions</h1>
      <div class="flex items-center gap-3 flex-wrap">
        <el-radio-group v-model="activeLang" size="small">
          <el-radio-button value="fr">FR</el-radio-button>
          <el-radio-button value="de">DE</el-radio-button>
          <el-radio-button value="en">EN</el-radio-button>
        </el-radio-group>
        <el-switch
          v-model="showEnabled"
          active-text="Actifs"
          inactive-text="Inactifs"
          style="--el-switch-on-color: var(--el-color-success); --el-switch-off-color: var(--el-color-info-light-3)"
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
      <el-table-column label="XID" prop="xid" sortable />
      <el-table-column label="Label">
        <template #default="{ row }">
          {{ row[`label_${activeLang}`] || row.label_fr || '—' }}
        </template>
      </el-table-column>
      <el-table-column label="Actif" width="80" align="center">
        <template #default="{ row }">
          <el-switch
            v-model="row.enabled"
            style="--el-switch-on-color: var(--el-color-success); --el-switch-off-color: var(--el-color-info-light-3)"
            @change="toggleEnabled(row)"
          />
        </template>
      </el-table-column>
      <el-table-column fixed="right" width="160" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">Modifier</el-button>
          <el-button size="small" type="danger" @click="onDelete(row)">Suppr.</el-button>
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

    <EventTypeDialog
      v-model="dialogOpen"
      :item="editedItem"
      @saved="load"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pb } from '@/pb'
import EventTypeDialog from '../components/EventTypeDialog.vue'

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
    parts.push(`(xid ~ "${s}" || label_fr ~ "${s}" || label_de ~ "${s}" || label_en ~ "${s}")`)
  }
  return parts.join(' && ')
}

const load = async () => {
  loading.value = true
  try {
    const result = await pb.collection('ut_event_types').getList(page.value, pageSize.value, {
      filter: buildFilter(),
      sort: 'xid',
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
    await pb.collection('ut_event_types').update(row.id, { enabled: row.enabled })
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
      `Supprimer le type "${row.xid}" ?`,
      'Confirmation',
      { confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler', type: 'warning' },
    )
    await pb.collection('ut_event_types').delete(row.id)
    ElMessage.success('Type supprimé')
    await load()
  } catch {
    // user cancelled
  }
}

onMounted(load)
</script>
