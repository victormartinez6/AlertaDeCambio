<template>
  <div class="h-full">
    <Line
      v-if="props.alertas.length > 0"
      :data="chartData"
      :options="chartOptions"
      class="h-full"
    />
    <div v-else class="text-sm text-gray-500 text-center py-8">
      Nenhum dado disponível para exibir no gráfico
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
import type { AlertaData } from '@/stores/alertas'

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
  alertas: AlertaData[]
}>()

const chartData = computed(() => {
  console.log('Alertas recebidos:', props.alertas)
  
  // Criar mapa de datas dos últimos 7 dias
  const hoje = new Date()
  const ultimos7Dias: Record<string, { criados: number, disparados: number }> = {}
  
  for (let i = 6; i >= 0; i--) {
    const data = new Date(hoje)
    data.setDate(data.getDate() - i)
    const dataStr = data.toISOString().split('T')[0]
    ultimos7Dias[dataStr] = { criados: 0, disparados: 0 }
  }

  console.log('Mapa inicial de datas:', ultimos7Dias)

  // Contar alertas por dia
  props.alertas.forEach(alerta => {
    try {
      // Processar data de criação
      if (alerta.criadoEm) {
        let dataStr: string
        try {
          const data = new Date(alerta.criadoEm)
          if (isNaN(data.getTime())) {
            console.log('Data de criação inválida:', alerta.criadoEm)
            return
          }
          dataStr = data.toISOString().split('T')[0]
          
          if (ultimos7Dias.hasOwnProperty(dataStr)) {
            ultimos7Dias[dataStr].criados++
          }
        } catch (error) {
          console.error('Erro ao processar data de criação:', error)
        }
      }

      // Processar data de disparo
      if (alerta.horarioDisparo) {
        let dataStr: string
        try {
          const data = new Date(alerta.horarioDisparo)
          if (isNaN(data.getTime())) {
            console.log('Data de disparo inválida:', alerta.horarioDisparo)
            return
          }
          dataStr = data.toISOString().split('T')[0]
          
          if (ultimos7Dias.hasOwnProperty(dataStr)) {
            ultimos7Dias[dataStr].disparados++
          }
        } catch (error) {
          console.error('Erro ao processar data de disparo:', error)
        }
      }
    } catch (error) {
      console.error('Erro ao processar alerta:', error, alerta)
    }
  })

  console.log('Contagem final por dia:', ultimos7Dias)

  const datas = Object.keys(ultimos7Dias).sort()
  const valoresCriados = datas.map(data => ultimos7Dias[data].criados)
  const valoresDisparados = datas.map(data => ultimos7Dias[data].disparados)

  return {
    labels: datas.map(data => {
      const [ano, mes, dia] = data.split('-')
      return `${dia}/${mes}`
    }),
    datasets: [
      {
        label: 'Alertas Criados',
        backgroundColor: '#654CF0',
        borderColor: '#654CF0',
        data: valoresCriados,
        tension: 0.4
      },
      {
        label: 'Alertas Disparados',
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        data: valoresDisparados,
        tension: 0.4
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        padding: 20,
        font: {
          size: 12
        }
      }
    },
    title: {
      display: true,
      text: 'Evolução de Alertas nos Últimos 7 Dias',
      padding: {
        top: 10,
        bottom: 20
      },
      font: {
        size: 14
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
        padding: 10
      }
    },
    x: {
      ticks: {
        padding: 10
      }
    }
  },
  layout: {
    padding: {
      left: 10,
      right: 10,
      top: 0,
      bottom: 10
    }
  }
}
</script>
