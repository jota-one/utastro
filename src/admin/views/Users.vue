<template>
  <div>
    <div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
      <h1 class="text-xl font-bold m-0">Utilisateurs</h1>
      <div class="flex items-center gap-3 flex-wrap">
        <el-select
          v-model="roleFilter"
          placeholder="Tous les rôles"
          clearable
          style="width: 160px"
          @change="load"
        >
          <el-option value="user" label="Utilisateur" />
          <el-option value="coach" label="Coach" />
          <el-option value="admin" label="Admin" />
          <el-option value="superadmin" label="Super Admin" />
        </el-select>
        <el-input
          v-model="search"
          placeholder="Rechercher..."
          clearable
          style="width: 220px"
          @input="onSearch"
          @clear="onSearch"
        />
        <el-button type="primary" @click="openCreate">+ Créer</el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="items" stripe style="width: 100%">
      <el-table-column label="Rôle" width="110" align="center">
        <template #default="{ row }">
          <el-tag
            :type="roleTagType(row.role)"
            size="small"
            effect="dark"
            round
          >
            {{ row.role || 'user' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Nom" prop="name" sortable />
      <el-table-column label="Email" sortable>
        <template #default="{ row }">
          <a
            :href="`mailto:${row.email}`"
            class="text-blue-500 hover:underline"
            >{{ row.email }}</a
          >
        </template>
      </el-table-column>
      <el-table-column label="Vérifié" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.verified ? 'success' : 'warning'" size="small">
            {{ row.verified ? '✓' : '✗' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Tél." prop="phone" width="130" />
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

    <UserDialog v-model="dialogOpen" :item="editedItem" @saved="load" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pb } from '@/pb'
import UserDialog from '../components/UserDialog.vue'

const loading = ref(false)
const items = ref<Record<string, any>[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const search = ref('')
const roleFilter = ref('')
const dialogOpen = ref(false)
const editedItem = ref<Record<string, any> | null>(null)

const roleTagType = (
  role: string,
): '' | 'success' | 'warning' | 'danger' | 'info' =>
  (({
    superadmin: 'danger',
    admin: 'warning',
    coach: 'success',
    user: 'info',
  })[role] as any) ?? ''

const buildFilter = () => {
  const parts: string[] = ['soft_deleted = false']
  if (roleFilter.value) {
    parts.push(`role = "${roleFilter.value}"`)
  }
  if (search.value.trim()) {
    const s = search.value.trim().replace(/"/g, '\\"')
    parts.push(`(name ~ "${s}" || email ~ "${s}")`)
  }
  return parts.join(' && ')
}

const load = async () => {
  loading.value = true
  try {
    const result = await pb
      .collection('ut_users')
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
      `Supprimer l'utilisateur "${row.name || row.email}" ? Cette action est irréversible.`,
      'Confirmation',
      {
        confirmButtonText: 'Supprimer',
        cancelButtonText: 'Annuler',
        type: 'warning',
      },
    )
    await pb.collection('ut_users').delete(row.id)
    ElMessage.success('Utilisateur supprimé')
    await load()
  } catch {
    // user cancelled
  }
}

onMounted(load)
</script>
