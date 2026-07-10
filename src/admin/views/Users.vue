<template>
  <EntityView
    title="Utilisateurs"
    v-model:search="search"
    v-model:page="page"
    v-model:page-size="pageSize"
    :total="total"
    @create="openCreate"
    @load="load"
    @search="onSearch"
  >
    <template #extra-start>
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
    </template>

    <template #extra-end>
      <el-button :icon="Download" :loading="exporting" @click="exportAllUsers">
        Exporter
      </el-button>
    </template>

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
      <el-table-column fixed="right" width="170" align="center">
        <template #default="{ row }">
          <el-button
            size="small"
            :icon="Service"
            title="Se connecter en tant que cet utilisateur"
            @click="onImpersonate(row)"
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

  <UserDialog v-model="dialogOpen" :item="editedItem" @saved="load" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Download, EditPen, Service } from '@element-plus/icons-vue'
import { pb } from '@/pb'
import { useAuth } from '@/composables/useAuth'
import { downloadCsv, type CsvRow } from '@/utils/csv'
import EntityView from '../components/EntityView.vue'
import UserDialog from '../components/UserDialog.vue'

const loading = ref(false)
const exporting = ref(false)
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

const exportAllUsers = async () => {
  exporting.value = true
  try {
    const records = await pb.collection('ut_users').getFullList({
      filter: buildFilter(),
      sort: 'name',
    })

    const emailCounts = records.reduce<Record<string, number>>(
      (acc, record) => {
        acc[record.email] = (acc[record.email] || 0) + 1
        return acc
      },
      {},
    )

    const rows: CsvRow[] = records.map(record => ({
      email: record.email,
      role: record.role || 'user',
      name: record.name,
      npa: record.npa,
      city: record.city,
      region: record.region,
      gender: record.gender,
      birthdate: record.birthdate,
      accept_newsletter: record.accept_newsletter,
      accept_promo: record.accept_promo,
      duplicates: emailCounts[record.email],
    }))

    downloadCsv(`${dayjs().format('YYYY-MM-DD_HH-mm-ss')}-users.csv`, rows)
  } catch {
    ElMessage.error("Erreur lors de l'export")
  } finally {
    exporting.value = false
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

const onImpersonate = async (row: Record<string, any>) => {
  try {
    await useAuth().impersonate(row.id)
    window.location.href = '/fr/'
  } catch {
    ElMessage.error("Erreur lors de l'impersonation")
  }
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
