<template>
  <div class="relative group rounded-xl shadow-sm">
    <!-- Glow effect -->
    <div
      class="absolute -inset-0.5 rounded-xl blur-sm transition-all duration-700 ease-in-out"
      :style="{
        backgroundColor: glowColor,
        opacity: isUpdating ? '0.8' : '0.3'
      }"
    />

    <!-- Card content -->
    <div
      :class="[
        isDark ? 'bg-gray-900' : 'bg-white',
        'relative rounded-xl p-6',
        isDark ? 'ring-1 ring-gray-800' : 'ring-1 ring-gray-900/5'
      ]"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps({
  isDark: {
    type: Boolean,
    default: false
  },
  highlight: {
    type: Boolean,
    default: false
  },
  cardType: {
    type: String,
    default: 'turismo'
  },
  variacao: {
    type: Number,
    default: 0
  }
})

const isUpdating = ref(false)

// Observa mudanças na variação para ativar o efeito de brilho
watch(() => props.variacao, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    isUpdating.value = true
    setTimeout(() => {
      isUpdating.value = false
    }, 2000)
  }
})

// Calcula a cor do glow baseado na variação
const glowColor = computed(() => {
  if (props.variacao > 0) return 'rgb(34, 197, 94)' // verde
  if (props.variacao < 0) return 'rgb(239, 68, 68)' // vermelho
  return props.isDark ? 'rgb(107, 114, 128)' : 'rgb(30, 58, 138)' // cinza ou marinho
})

// Calcula a opacidade do glow
const glowOpacity = computed(() => {
  if (props.highlight) return '0.5'
  return '0.3'
})
</script>

<style scoped>
.group:hover .blur-sm {
  opacity: 0.6;
  transition: opacity 300ms ease-in-out;
}
</style>
