<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const stars = ref([])
const starCount = 100
let animationFrame = null

function createStar() {
  return {
    id: Math.random(),
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.8 + 0.2,
    twinkle: Math.random() > 0.7
  }
}

function initStars() {
  stars.value = Array.from({ length: starCount }, createStar)
}

function resetStar(star) {
  const index = stars.value.findIndex(s => s.id === star.id)
  if (index !== -1) {
    stars.value[index] = createStar()
  }
}

onMounted(() => {
  initStars()
})

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
})
</script>

<template>
  <div class="stars-container">
    <div 
      v-for="star in stars" 
      :key="star.id"
      class="star"
      :class="{ twinkle: star.twinkle }"
      :style="{
        left: star.left + '%',
        top: star.top + '%',
        width: star.size + 'px',
        height: star.size + 'px',
        animationDuration: star.duration + 's',
        animationDelay: star.delay + 's',
        opacity: star.opacity
      }"
      @animationend="resetStar(star)"
    ></div>
    <div class="stars-shooting">
      <div class="shooting-star"></div>
      <div class="shooting-star" style="animation-delay: 3s"></div>
      <div class="shooting-star" style="animation-delay: 7s"></div>
    </div>
  </div>
</template>

<style scoped>
.stars-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  animation: star-glow linear infinite;
}

.star.twinkle {
  animation: star-twinkle linear infinite;
}

@keyframes star-glow {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes star-twinkle {
  0%, 100% {
    opacity: 0.2;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.5);
    box-shadow: 0 0 6px 2px rgba(255, 255, 255, 0.5);
  }
}

.stars-shooting {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shooting-star {
  position: absolute;
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.8), rgba(255,255,255,0));
  top: 15%;
  left: -100px;
  animation: shoot 8s linear infinite;
  transform: rotate(-15deg);
  opacity: 0;
}

.shooting-star:nth-child(2) {
  top: 35%;
  animation-delay: 3s;
  width: 60px;
}

.shooting-star:nth-child(3) {
  top: 55%;
  animation-delay: 7s;
  width: 80px;
}

@keyframes shoot {
  0% {
    left: -100px;
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  15% {
    left: 100%;
    opacity: 0;
  }
  100% {
    left: 100%;
    opacity: 0;
  }
}
</style>
