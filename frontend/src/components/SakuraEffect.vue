<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const petals = ref([])
const petalCount = 15
let animationFrame = null

function createPetal() {
  return {
    id: Math.random(),
    left: Math.random() * 100,
    size: Math.random() * 10 + 8,
    duration: Math.random() * 5 + 8,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.5 + 0.3,
    rotation: Math.random() * 360
  }
}

function initPetals() {
  petals.value = Array.from({ length: petalCount }, createPetal)
}

function resetPetal(petal) {
  const index = petals.value.findIndex(p => p.id === petal.id)
  if (index !== -1) {
    petals.value[index] = createPetal()
  }
}

onMounted(() => {
  initPetals()
})

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
})
</script>

<template>
  <div class="sakura-container" v-if="true">
    <div 
      v-for="petal in petals" 
      :key="petal.id"
      class="sakura-petal"
      :style="{
        left: petal.left + '%',
        width: petal.size + 'px',
        height: petal.size + 'px',
        animationDuration: petal.duration + 's',
        animationDelay: petal.delay + 's',
        opacity: petal.opacity
      }"
      @animationend="resetPetal(petal)"
    ></div>
  </div>
</template>

<style scoped>
.sakura-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  overflow: hidden;
  z-index: 9999;
}

.sakura-petal {
  position: absolute;
  top: -20px;
  background: linear-gradient(135deg, #ffb7c5 0%, #ff69b4 50%, #ffb6c1 100%);
  border-radius: 50% 0 50% 50%;
  transform: rotate(45deg);
  animation: fall linear infinite;
}

.sakura-petal::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

@keyframes fall {
  0% {
    transform: translateY(-20px) rotate(0deg) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg) translateX(50px);
    opacity: 0;
  }
}
</style>
