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
    type: Array as () => { timestamp: Date; valor: number }[],
    required: true
  },
  isDark: {
    type: Boolean,
    default: false
  }
})

const chartData = computed(() => {
  // Invertendo a ordem dos dados para que a data mais antiga fique à direita
  // e a mais recente à esquerda
  const historicoInvertido = [...props.historico].reverse();
  
  const labels = historicoInvertido.map(item => 
    format(new Date(item.timestamp), 'dd/MM', { locale: ptBR })
  )
  
  return {
    labels,
    datasets: [
      {
        label: 'Cotação',
        data: historicoInvertido.map(item => item.valor),
        borderColor: '#654cf0',
        backgroundColor: '#654cf0',
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
        title: (tooltipItems: any[]) => {
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
        callback: function(value: any) {
          return `R$ ${value.toFixed(4)}`
        },
        maxTicksLimit: 5 // Limita o número de ticks no eixo Y
      },
      grid: {
        color: props.isDark ? '#334155' : '#e2e8f0',
        drawBorder: false
      },
      beginAtZero: false // Não força o início em zero para melhor visualização da variação
    },
    x: {
      ticks: {
        color: props.isDark ? '#94a3b8' : '#64748b',
        maxRotation: 0, // Evita rotação das labels
        autoSkip: true,
        maxTicksLimit: 5 // Limita o número de ticks no eixo X
      },
      grid: {
        color: props.isDark ? '#334155' : '#e2e8f0',
        display: false // Remove as linhas de grade verticais
      }
    }
  },
  layout: {
    padding: {
      top: 5,
      right: 5,
      bottom: 5,
      left: 5
    }
  }
}))
</script>
