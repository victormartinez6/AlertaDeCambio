<template>
  <div class="space-y-8">
    <!-- Cabeçalho -->
    <div class="sm:flex sm:items-center pt-4">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-bold text-marinho">Cotações</h1>
        <p class="mt-2 text-sm text-marinho/70">
          Acompanhe as principais cotações em tempo real e crie alertas personalizados.
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <RouterLink 
          :to="{ name: 'novo-alerta' }" 
          class="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#D6FC49] to-[#E5FD8B] px-4 py-2 text-sm font-semibold text-[#654CF0] shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 hover:from-[#E5FD8B] hover:to-[#D6FC49] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6FC49] active:scale-95 backdrop-blur-sm"
        >
          <BellAlertIcon class="h-5 w-5 text-[#654CF0]" />
          Criar Alerta
        </RouterLink>
      </div>
    </div>

    <!-- Estado de Carregamento -->
    <div v-if="loading" class="text-center py-12">
      <ArrowPathIcon class="mx-auto h-8 w-8 text-primary-500 animate-spin" />
      <p class="mt-2 text-sm text-gray-600">Carregando cotações...</p>
    </div>

    <!-- Mensagem de Erro -->
    <div v-else-if="error" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <ExclamationCircleIcon class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Erro ao carregar cotações</h3>
          <p class="mt-2 text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <div v-else>
      <!-- Grid responsivo para os blocos -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Câmbio Turismo -->
        <section :class="[turismoDark ? 'bg-gray-900' : 'bg-white', 'rounded-xl shadow-sm col-span-1 lg:col-span-4']">
          <div class="flex items-center justify-between p-6 pb-0">
            <div class="flex items-center gap-2">
              <CurrencyDollarIcon 
                :class="[turismoDark ? 'text-white' : 'text-marinho', 'h-7 w-7']"
              />
              <h2 :class="[turismoDark ? 'text-white' : 'text-marinho', 'text-xl font-bold']">
                Câmbio Turismo
              </h2>
            </div>
            <div class="flex items-center gap-4">
              <!-- Timer -->
              <div class="flex items-center gap-2">
                <div :class="[turismoDark ? 'text-gray-300' : 'text-gray-500', 'text-sm flex items-center gap-2']">
                  <svg xmlns="http://www.w3.org/2000/svg" :class="[turismoDark ? 'text-gray-300' : 'text-primary-600', 'h-4 w-4']" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                  </svg>
                  <span :class="[turismoDark ? 'text-gray-300' : 'text-gray-600', 'font-medium']">
                    {{ timerDisplay }}
                  </span>
                </div>
                <!-- Loading Spinner -->
                <div v-if="loadingTurismo" class="ml-2">
                  <ArrowPathIcon class="w-4 h-4 animate-spin text-primary-600" />
                </div>
              </div>
              <ThemeToggle v-model="turismoDark" />
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 gap-6">
              <div v-for="moeda in Object.values(cotacoesTurismo)" :key="moeda.code" class="relative">
                <GlowCard 
                  :is-dark="turismoDark"
                  :highlight="deveDestacar(moeda)"
                  card-type="turismo"
                  :variacao="moeda.variacao"
                >
                  <div class="flex items-center gap-3 mb-4">
                    <CurrencyFlag 
                      :code="moeda.code"
                      :currencyName="moeda.name"
                      class="w-8 h-8"
                    />
                    <div>
                      <h3 :class="[turismoDark ? 'text-gray-100' : 'text-marinho', 'text-lg font-semibold']">
                        {{ moeda.name }}
                      </h3>
                      <p :class="[turismoDark ? 'text-gray-400' : 'text-marinho/70', 'text-sm']">
                        {{ moeda.code }}/BRL
                      </p>
                    </div>
                  </div>

                  <div class="mt-6">
                    <div class="flex items-center justify-between">
                      <span :class="[turismoDark ? 'text-gray-100' : 'text-marinho', 'text-4xl font-bold']">
                        {{ formatarCotacao(moeda.venda) }}
                      </span>
                      <span :class="[
                        moeda.variacao > 0 
                          ? (turismoDark ? 'bg-green-900 text-green-300 ring-green-400/20' : 'bg-green-50 text-green-700 ring-green-600/20')
                          : (turismoDark ? 'bg-red-900 text-red-300 ring-red-400/20' : 'bg-red-50 text-red-700 ring-red-600/20'),
                        'inline-flex items-center rounded-md px-4 py-2 text-base font-semibold ring-1 ring-inset'
                      ]">
                        <component :is="moeda.variacao > 0 ? ArrowUpIcon : ArrowDownIcon" 
                                 class="h-5 w-5 mr-1.5" />
                        {{ moeda.variacao.toFixed(2) }}%
                      </span>
                    </div>
                  </div>
                </GlowCard>
              </div>
            </div>
          </div>
        </section>

        <!-- Câmbio Comercial -->
        <section :class="[comercialDark ? 'bg-gray-900' : 'bg-white', 'rounded-xl shadow-sm col-span-1 lg:col-span-8']">
          <div class="flex items-center justify-between p-6 pb-0">
            <div class="flex items-center gap-2">
              <GlobeEuropeAfricaIcon 
                :class="[comercialDark ? 'text-white' : 'text-marinho', 'h-7 w-7']"
              />
              <h2 :class="[comercialDark ? 'text-white' : 'text-marinho', 'text-xl font-bold']">
                Câmbio Comercial
              </h2>
            </div>
            <div class="flex items-center gap-4">
              <!-- Timer -->
              <div class="flex items-center gap-2">
                <div :class="[comercialDark ? 'text-gray-300' : 'text-gray-500', 'text-sm flex items-center gap-2']">
                  <svg xmlns="http://www.w3.org/2000/svg" :class="[comercialDark ? 'text-gray-300' : 'text-primary-600', 'h-4 w-4']" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                  </svg>
                  <span :class="[comercialDark ? 'text-gray-300' : 'text-gray-600', 'font-medium']">
                    {{ timerDisplayComercial }}
                  </span>
                </div>
                <!-- Loading Spinner -->
                <div v-if="loadingComercial" class="ml-2">
                  <ArrowPathIcon class="w-4 h-4 animate-spin text-primary-600" />
                </div>
              </div>
              <ThemeToggle v-model="comercialDark" />
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
              <div v-for="moeda in Object.values(cotacoes)" :key="moeda.code" class="relative">
                <GlowCard 
                  :is-dark="comercialDark"
                  :highlight="deveDestacar(moeda)"
                  card-type="remessa"
                  :variacao="parseFloat(moeda.pctChange)"
                  class="cursor-pointer"
                  @click="toggleCard(moeda.code)"
                >
                  <!-- Cabeçalho do Card -->
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                      <CurrencyFlag 
                        :code="moeda.code"
                        :currencyName="moeda.name"
                        class="w-8 h-8"
                      />
                      <h3 class="text-2xl font-bold" :class="comercialDark ? 'text-white' : 'text-gray-900'">
                        {{ moeda.code }}/BRL
                      </h3>
                    </div>
                    <span class="text-4xl font-bold tracking-tight" :class="comercialDark ? 'text-white' : 'text-gray-900'">
                      {{ formatarCotacao(parseFloat(moeda.ask), 'comercial') }}
                    </span>
                  </div>

                  <!-- Informações Adicionais -->
                  <div class="flex justify-between items-center">
                    <div class="space-y-1">
                      <p class="text-sm" :class="comercialDark ? 'text-gray-400' : 'text-gray-500'">
                        {{ moeda.name }}
                      </p>
                      <div class="flex gap-4">
                        <p class="text-sm" :class="comercialDark ? 'text-gray-400' : 'text-gray-500'">
                          Máx: {{ formatarCotacao(parseFloat(moeda.high), 'comercial') }}
                        </p>
                        <p class="text-sm" :class="comercialDark ? 'text-gray-400' : 'text-gray-500'">
                          Mín: {{ formatarCotacao(parseFloat(moeda.low), 'comercial') }}
                        </p>
                      </div>
                    </div>

                    <span :class="[
                      parseFloat(moeda.pctChange) > 0 
                        ? (comercialDark ? 'bg-green-900 text-green-300 ring-green-400/20' : 'bg-green-50 text-green-700 ring-green-600/20')
                        : (comercialDark ? 'bg-red-900 text-red-300 ring-red-400/20' : 'bg-red-50 text-red-700 ring-red-600/20'),
                      'inline-flex items-center rounded-md px-4 py-2 text-base font-semibold ring-1 ring-inset'
                    ]">
                      <component :is="parseFloat(moeda.pctChange) > 0 ? ArrowUpIcon : ArrowDownIcon" 
                               class="h-5 w-5 mr-1.5" />
                      {{ parseFloat(moeda.pctChange).toFixed(2) }}%
                    </span>
                  </div>

                  <!-- Ícone de expandir -->
                  <div class="flex justify-end mt-2">
                    <ChevronDownIcon 
                      class="h-5 w-5 transition-transform duration-200"
                      :class="[
                        comercialDark ? 'text-gray-400' : 'text-gray-500',
                        expandedCards[moeda.code] ? 'rotate-180' : ''
                      ]"
                    />
                  </div>

                  <!-- Conteúdo do Acordeon -->
                  <div v-if="expandedCards[moeda.code]" class="mt-4 pt-4 border-t" :class="comercialDark ? 'border-gray-700' : 'border-gray-200'">
                    <div class="h-64">
                      <CotacaoChart
                        v-if="historicoCotacoes[moeda.code]"
                        :historico="historicoCotacoes[moeda.code]"
                        :is-dark="comercialDark"
                      />
                      <div v-else class="flex items-center justify-center h-full">
                        <ArrowPathIcon class="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    </div>
                  </div>
                </GlowCard>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { 
  BanknotesIcon, 
  GlobeEuropeAfricaIcon,
  BellAlertIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/vue/24/outline'
import { useCambioStore } from '@/stores/cambioStore'
import { useCotacoesTempoReal } from '@/utils/cotacoes'
import { storeToRefs } from 'pinia'
import CurrencyFlag from '@/components/CurrencyFlag.vue'
import GlowCard from '@/components/GlowCard.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import CotacaoChart from '@/components/CotacaoChart.vue'
import CurrencyChart from '@/components/CurrencyChart.vue'
import type { CurrencyCode } from '@/types'

const store = useCambioStore()
const { loading, loadingTurismo, loadingComercial, error, cotacoesTurismo, cotacoes, historicoCotacoes, segundosParaAtualizarComercial } = storeToRefs(store)
const { segundosParaAtualizar } = useCotacoesTempoReal()

// Tema escuro
const turismoDark = ref(false)
const comercialDark = ref(false)
const expandedCards = ref<Record<string, boolean>>({})

// Computed para evitar re-renderizações desnecessárias
const timerDisplay = computed(() => {
  const minutos = Math.floor(segundosParaAtualizar.value / 60)
  const segundos = segundosParaAtualizar.value % 60
  return `${minutos}:${String(segundos).padStart(2, '0')}`
})

const timerDisplayComercial = computed(() => {
  const minutos = Math.floor(segundosParaAtualizarComercial.value / 60)
  const segundos = segundosParaAtualizarComercial.value % 60
  return `${minutos}:${String(segundos).padStart(2, '0')}`
})

// Inicializar dados
onMounted(() => {
  const cleanup = store.iniciarAtualizacoesAutomaticas()
  onUnmounted(cleanup)
})

// Toggle para expandir/colapsar cards
const toggleCard = async (code: string) => {
  if (!expandedCards.value[code]) {
    await store.buscarHistoricoCotacao(code)
  }
  expandedCards.value[code] = !expandedCards.value[code]
}

// Formatação
const formatarCotacao = (valor: number, tipo: 'comercial' | 'turismo' = 'turismo') => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: tipo === 'comercial' ? 4 : 2
  }).format(valor)
}

const formatarDataHora = (data: Date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(data)
}

const deveDestacar = (moeda: any) => {
  return moeda.code === 'USD' || moeda.code === 'EUR'
}

const deveDestacarTurismo = (moeda: string) => {
  return moeda === 'USD' || moeda === 'EUR'
}
</script>
