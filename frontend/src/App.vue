<script setup>
import { RouterView } from 'vue-router'
import MainLayout from '@components/layout/MainLayout.vue'
</script>

<template>
  <MainLayout>
    <RouterView v-slot="{ Component }">
      <!-- <transition name="fade" mode="out-in"> -->
        <component :is="Component" />
      <!-- </transition> -->
    </RouterView>
  </MainLayout>
</template>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>
