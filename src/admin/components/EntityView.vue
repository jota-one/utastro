<template>
  <div class="entity-view">
    <div class="header">
      <h1 class="text-xl font-bold m-0">{{ title }}</h1>
      <slot name="extra-start" />
      <div style="flex: 1" />
      <el-radio-group v-if="lang !== undefined" v-model="lang" size="small">
        <el-radio-button value="fr">fr</el-radio-button>
        <el-radio-button value="de">de</el-radio-button>
        <el-radio-button value="en">en</el-radio-button>
      </el-radio-group>
      <slot name="extra-end" />
      <el-button type="primary" :icon="Plus" @click="emit('create')">
        Créer
      </el-button>
    </div>

    <el-input
      v-model="search"
      class="mb-4"
      clearable
      :placeholder="`Rechercher des ${title}`"
      :prefix-icon="Search"
    />

    <slot />

    <div class="flex justify-end mt-4">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="emit('load')"
        @current-change="emit('load')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'

type Props = {
  title: string
  total?: number
}

withDefaults(defineProps<Props>(), {
  total: 0,
})

const emit = defineEmits<{
  create: []
  load: []
  search: []
}>()

const search = defineModel<string>('search', { default: '' })
const page = defineModel<number>('page', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 50 })
const lang = defineModel<'fr' | 'de' | 'en' | undefined>('lang', {
  default: undefined,
})

let searchTimeout: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => emit('search'), 300)
})
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
</style>
