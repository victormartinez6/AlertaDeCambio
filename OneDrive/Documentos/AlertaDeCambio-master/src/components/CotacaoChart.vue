<template>
  <div class="relative">
    <Line
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { Line } from 'vue-chartjs'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const props = defineProps({
  historico: {
    type: Array as () => { timestamp: string; ask: string }[],
    required: true
  },
  isDark: {
    type: Boolean,
    default: false
  }
})

const chartData = computed(() => {
  const labels = props.historico.map(item => 
    format(new Date(item.timestamp), 'dd/MM', { locale: ptBR })
  )
  
  return {
    labels,
    datasets: [
      {
        label: 'Cotação',
        data: props.historico.map(item => parseFloat(item.ask)),
        borderColor: '#2563eb',
        backgroundColor: '#2563eb',
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
</script>
