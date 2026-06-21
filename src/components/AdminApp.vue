<template>
  <AdminSidebar>
    <router-view />
  </AdminSidebar>
</template>

<script setup lang="ts">
import { onBeforeMount, getCurrentInstance, type App } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from '../admin/router'
import AdminSidebar from '../admin/layouts/AdminSidebar.vue'

onBeforeMount(() => {
  const app = getCurrentInstance()?.appContext.app as App
  app.use(router)
  app.use(ElementPlus)
})
</script>
