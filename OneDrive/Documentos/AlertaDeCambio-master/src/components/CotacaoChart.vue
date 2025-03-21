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
import { format, parseISO } from 'date-fns'
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
    type: Array as () => { timestamp: Date; ask: string; bid: string; high: string; low: string }[],
    required: true
  },
  isDark: {
    type: Boolean,
    default: false
  }
})

const chartData = computed(() => {
  // Formatar as datas para exibição
  const labels = props.historico.map(item => {
    // Se timestamp for uma string, converte para Date
    const date = item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp)
    return format(date, 'dd/MM', { locale: ptBR })
  })
  
  // Obter os valores de cotação
  const valores = props.historico.map(item => parseFloat(item.ask))
  
  return {
    labels,
    datasets: [
      {
        label: 'Cotação',
        data: valores,
        borderColor: '#654cf0',
        backgroundColor: 'rgba(101, 76, 240, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#654cf0',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#654cf0',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
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
      backgroundColor: props.isDark ? '#1e1b4b' : '#ffffff',
      titleColor: props.isDark ? '#ffffff' : '#654cf0',
      bodyColor: props.isDark ? '#ffffff' : '#654cf0',
      borderColor: props.isDark ? '#654cf0' : '#e5e7eb',
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
      beginAtZero: false,
      ticks: {
        color: props.isDark ? '#94a3b8' : '#64748b',
        callback: function(this: any, tickValue: number | string): string {
          return `R$ ${Number(tickValue).toFixed(4)}`
        }
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
        color: props.isDark ? '#334155' : '#e2e8f0',
        display: false
      }
    }
  }
}))
</script>
