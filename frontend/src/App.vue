<script setup>
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import MainLayout from '@components/layout/MainLayout.vue'
import SakuraEffect from '@components/SakuraEffect.vue'
import StarsEffect from '@components/StarsEffect.vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const showSakura = computed(() => themeStore.isFox)
const showStars = computed(() => !themeStore.isFox)
</script>

<template>
  <div id="app-wrapper">
    <Teleport to="body">
      <SakuraEffect v-if="showSakura" />
      <StarsEffect v-if="showStars" />
    </Teleport>
    <MainLayout>
      <RouterView v-slot="{ Component }">
        <!-- <transition name="fade" mode="out-in"> -->
          <component :is="Component" />
        <!-- </transition> -->
      </RouterView>
    </MainLayout>
  </div>
</template>

<style>
body {
  min-height: 100vh;
}

#app-wrapper {
  width: 100%;
  min-height: 100vh;
  position: relative;
}

#app {
  width: 100%;
  min-height: 100vh;
}
</style>
