<template>
  <el-container class="sidebar-container">
    <el-aside width="220px" class="sidebar-aside">
      <el-menu :default-active="route.path" router class="sidebar-menu">
        <el-menu-item index="/">Dashboard</el-menu-item>
        <el-menu-item index="/events">Sessions</el-menu-item>
        <el-menu-item index="/cities">Villes</el-menu-item>
        <el-menu-item index="/locations">Lieux</el-menu-item>
        <el-menu-item index="/event-types">Types</el-menu-item>
        <el-menu-item index="/users">Utilisateurs</el-menu-item>
        <el-menu-item index="__back" @click="goToSite"
          >← Retour au site</el-menu-item
        >
      </el-menu>
    </el-aside>
    <el-main class="sidebar-main">
      <slot />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const goToSite = () => {
  window.location.href = '/fr/'
}
</script>

<style scoped>
.sidebar-container {
  height: 100%;
}

.sidebar-aside {
  height: 100%;
  border-right: 1px solid #e5e7eb;
  overflow: hidden;
}

.sidebar-menu {
  height: 100%;
  border-right: none !important;
}

.sidebar-main {
  padding: 24px;
  overflow-y: auto;
  height: 100%;
}
</style>
