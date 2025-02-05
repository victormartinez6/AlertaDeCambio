<template>
  <div class="mt-4">
    <button 
      @click="toggleChart"
      class="w-full flex items-center justify-between py-2 text-left text-xs sm:text-sm font-medium transition-colors duration-200"
      :class="[
        isDark 
          ? 'text-gray-300 hover:text-gray-100' 
          : 'text-marinho/70 hover:text-marinho'
      ]"
    >
      <span>Variação no último mês</span>
      <ChevronDownIcon 
        class="h-4 w-4 sm:h-5 sm:w-5 transform transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <div
      v-show="isOpen"
      class="mt-2 transition-all duration-200"
    >
      <div v-if="loading" class="h-48 sm:h-64 w-full flex items-center justify-center">
        <ArrowPathIcon class="h-6 w-6 animate-spin" :class="isDark ? 'text-gray-400' : 'text-marinho/50'" />
      </div>
      <div v-else class="h-48 sm:h-64 w-full">
        <Line
          v-if="chartData"
          :data="chartData"
          :options="chartOptions"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ChevronDownIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useCambioStore } from '../stores/cambioStore'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const props = defineProps<{
  code: string
  isDark: boolean
}>()

const store = useCambioStore()
const isOpen = ref(false)
const loading = ref(false)
const historico = ref<any[]>([])

const chartData = computed(() => {
  if (!historico.value.length) return null
  
  const labels = historico.value.map(item => 
    format(new Date(item.timestamp), 'dd/MM', { locale: ptBR })
  )
  
  return {
    labels,
    datasets: [
      {
        label: 'Cotação',
        data: historico.value.map(item => parseFloat(item.ask)),
        borderColor: props.isDark ? '#94a3b8' : '#1e40af',
        backgroundColor: props.isDark ? '#94a3b8' : '#1e40af',
        tension: 0.4
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: props.isDark ? '#1e293b' : '#ffffff',
      titleColor: props.isDark ? '#ffffff' : '#000000',
      bodyColor: props.isDark ? '#ffffff' : '#000000',
      borderColor: props.isDark ? '#334155' : '#e2e8f0',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
      callbacks: {
        title: (tooltipItems: any) => {
          return tooltipItems[0].label
        },
        label: (context: any) => {
          return `R$ ${context.raw.toFixed(4)}`
        }
      }
    }
  },
  scales: {
    y: {
      ticks: {
        color: props.isDark ? '#94a3b8' : '#64748b',
        callback: (value: number) => `R$ ${value.toFixed(4)}`
      },
      grid: {
        color: props.isDark ? '#334155' : '#e2e8f0'
      }
    },
    x: {
      ticks: {
        color: props.isDark ? '#94a3b8' : '#64748b'
      },
      grid: {
        color: props.isDark ? '#334155' : '#e2e8f0'
      }
    }
  }
}))

async function carregarHistorico() {
  loading.value = true
  try {
    historico.value = await store.buscarHistoricoCotacao(props.code)
  } catch (error) {
    console.error('Erro ao carregar histórico:', error)
  } finally {
    loading.value = false
  }
}

function toggleChart() {
  isOpen.value = !isOpen.value
  if (isOpen.value && !historico.value.length) {
    carregarHistorico()
  }
}

// Atualizar o gráfico quando o tema mudar
watch(() => props.isDark, () => {
  if (chartData.value) {
    const chart = (chartData.value as any)._chart
    if (chart) {
      chart.update()
    }
  }
})

// Atualizar o gráfico quando a janela for redimensionada
let resizeTimeout: number
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = window.setTimeout(() => {
    const chart = (chartData.value as any)?._chart
    if (chart) {
      chart.resize()
    }
  }, 250)
})
</script>
