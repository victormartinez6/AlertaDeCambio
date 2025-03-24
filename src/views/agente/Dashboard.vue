<template>
  <div class="space-y-6">
    <div class="md:flex md:items-center md:justify-between">
      <div class="min-w-0 flex-1">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Dashboard do Agente
        </h2>
      </div>
    </div>

    <!-- Cards de Estatísticas -->
    <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div class="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
        <dt>
          <div class="absolute rounded-md bg-primary-500 p-3">
            <BellAlertIcon class="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <p class="ml-16 truncate text-sm font-medium text-gray-500">Total de Alertas</p>
        </dt>
        <dd class="ml-16 flex items-baseline pb-6 sm:pb-7">
          <p class="text-2xl font-semibold text-gray-900">{{ totalAlertas }}</p>
        </dd>
      </div>

      <div class="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
        <dt>
          <div class="absolute rounded-md bg-primary-500 p-3">
            <BoltIcon class="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <p class="ml-16 truncate text-sm font-medium text-gray-500">Alertas Disparados Hoje</p>
        </dt>
        <dd class="ml-16 flex items-baseline pb-6 sm:pb-7">
          <p class="text-2xl font-semibold text-gray-900">{{ alertasDisparadosHoje }}</p>
        </dd>
      </div>

      <div class="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
        <dt>
          <div class="absolute rounded-md bg-primary-500 p-3">
            <CheckCircleIcon class="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <p class="ml-16 truncate text-sm font-medium text-gray-500">Alertas Ativos</p>
        </dt>
        <dd class="ml-16 flex items-baseline pb-6 sm:pb-7">
          <p class="text-2xl font-semibold text-gray-900">{{ alertasAtivos }}</p>
          <p class="ml-2 flex items-baseline text-sm font-semibold text-green-600">
            <span class="text-xs">{{ porcentagemAtivos }}%</span>
          </p>
        </dd>
      </div>

      <div class="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
        <dt>
          <div class="absolute rounded-md bg-primary-500 p-3">
            <ClockIcon class="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <p class="ml-16 truncate text-sm font-medium text-gray-500">Alertas Vencidos</p>
        </dt>
        <dd class="ml-16 flex items-baseline pb-6 sm:pb-7">
          <p class="text-2xl font-semibold text-gray-900">{{ alertasVencidos }}</p>
          <p class="ml-2 flex items-baseline text-sm font-semibold text-red-600">
            <span class="text-xs">{{ porcentagemVencidos }}%</span>
          </p>
        </dd>
      </div>
    </dl>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-base font-semibold leading-6 text-gray-900 mb-4">Evolução de Alertas</h3>
          <div class="h-[28rem]"> 
            <AlertasChart :alertas="alertas" />
          </div>
        </div>
      </div>

      <div class="bg-white shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-base font-semibold leading-6 text-gray-900">Alertas Recentes</h3>
          <div class="mt-4">
            <div v-if="alertasRecentes.length === 0" class="text-sm text-gray-500">
              Nenhum alerta recente para exibir.
            </div>
            <ul v-else role="list" class="divide-y divide-gray-200">
              <li v-for="alerta in alertasRecentes" :key="alerta.id" class="py-4">
                <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0">
                    <span class="inline-flex h-8 w-8 items-center justify-center rounded-full" :class="getStatusColor(alerta)">
                      <BellAlertIcon class="h-5 w-5 text-white" />
                    </span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-gray-900">
                      {{ alerta.nome }}
                    </p>
                    <p class="truncate text-sm text-gray-500">
                      {{ alerta.moeda }} - {{ formatarMoeda(alerta.cotacaoAlvo) }}
                    </p>
                  </div>
                  <div class="flex-shrink-0">
                    <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium" :class="getStatusBadgeClass(alerta)">
                      {{ getStatusText(alerta) }}
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { BellAlertIcon, BoltIcon, CheckCircleIcon, ClockIcon } from '@heroicons/vue/24/outline'
import { useAlertasStore } from '@/stores/alertas'
import type { AlertaData } from '@/stores/alertas'
import AlertasChart from '@/components/AlertasChart.vue'

const alertasStore = useAlertasStore()
const alertas = computed(() => {
  console.log('Alertas no dashboard:', alertasStore.alertas)
  return alertasStore.alertas
})

// Total de alertas
const totalAlertas = computed(() => alertas.value.length)

// Alertas disparados hoje
const alertasDisparadosHoje = computed(() => {
  const hoje = new Date().toISOString().split('T')[0]
  return alertas.value.filter(alerta => 
    alerta.horarioDisparo?.startsWith(hoje)
  ).length
})

// Alertas ativos
const alertasAtivos = computed(() => 
  alertas.value.filter(alerta => alerta.ativo).length
)

// Porcentagem de alertas ativos
const porcentagemAtivos = computed(() => 
  totalAlertas.value > 0 
    ? Math.round((alertasAtivos.value / totalAlertas.value) * 100) 
    : 0
)

// Alertas vencidos
const alertasVencidos = computed(() => {
  const hoje = new Date().toISOString().split('T')[0]
  return alertas.value.filter(alerta => 
    alerta.dataLimite && alerta.dataLimite < hoje
  ).length
})

// Porcentagem de alertas vencidos
const porcentagemVencidos = computed(() => 
  totalAlertas.value > 0 
    ? Math.round((alertasVencidos.value / totalAlertas.value) * 100) 
    : 0
)

// Alertas recentes (últimos 5)
const alertasRecentes = computed(() => {
  return [...alertas.value]
    .filter(alerta => alerta && alerta.criadoEm) // Garante que o alerta e criadoEm existem
    .sort((a, b) => {
      // Converte as datas para timestamps para comparação
      const timeA = new Date(a.criadoEm || '').getTime()
      const timeB = new Date(b.criadoEm || '').getTime()
      return timeB - timeA // Ordem decrescente
    })
    .slice(0, 5)
})

// Formatar moeda
const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

// Funções de estilo para os status
const getStatusColor = (alerta: AlertaData) => {
  if (!alerta.ativo) return 'bg-gray-500'
  if (alerta.webhookDisparado) return 'bg-green-500'
  return 'bg-indigo-500' // Mudado de primary para indigo para consistência
}

const getStatusBadgeClass = (alerta: AlertaData) => {
  if (!alerta.ativo) return 'bg-gray-100 text-gray-800'
  if (alerta.webhookDisparado) return 'bg-green-100 text-green-800'
  return 'bg-indigo-100 text-indigo-800' // Mudado de primary para indigo para melhor contraste
}

const getStatusText = (alerta: AlertaData) => {
  if (!alerta.ativo) return 'Inativo'
  if (alerta.webhookDisparado) return 'Disparado'
  return 'Ativo'
}

// Carregar dados
onMounted(async () => {
  await alertasStore.listarAlertas()
})
</script>
