<template>
  <div class="space-y-8">
    <!-- Cabeçalho -->
    <div class="sm:flex sm:items-center pt-4">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-bold text-marinho">Configurações</h1>
        <p class="mt-2 text-sm text-marinho/70">
          Gerencie as configurações do seu sistema de alertas.
        </p>
      </div>
    </div>

    <!-- Conteúdo -->
    <div class="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
      <!-- Seção de Cotações -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-medium text-marinho">Parametrização de Cotações (Turismo)</h2>
            <p class="text-sm text-gray-500 mt-1">
              Configure o percentual a ser adicionado.
              O valor final será automaticamente atualizado na tabela de cotações.
            </p>
          </div>
          <div class="text-sm text-gray-500 flex flex-col items-end gap-2">
            <!-- Timer -->
            <div class="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
              <span class="font-medium">
                Próxima atualização em: {{ Math.floor(segundosParaAtualizar / 60) }}:{{ String(segundosParaAtualizar % 60).padStart(2, '0') }}
              </span>
            </div>
            
            <!-- Status -->
            <div>
              <span v-if="atualizando" class="inline-flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Atualizando cotações...
              </span>
              <span v-else class="flex items-center gap-1">
                <svg class="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                </svg>
                Cotações atualizadas
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <!-- Cabeçalho da tabela -->
          <div class="grid grid-cols-4 gap-4 pb-2 border-b border-gray-200">
            <div class="text-sm font-medium text-gray-500">Moeda</div>
            <div class="text-sm font-medium text-gray-500">Percentual</div>
            <div class="text-sm font-medium text-gray-500">Cotação Base</div>
            <div class="text-sm font-medium text-gray-500">Cotação Final</div>
          </div>

          <!-- USD -->
          <div class="grid grid-cols-4 gap-4 items-center">
            <div class="flex items-center gap-2">
              <span class="fi fi-us w-5 h-5 rounded-sm"></span>
              <div>
                <span class="font-medium text-gray-700">USD</span>
                <p class="text-sm text-gray-500">Dólar Americano</p>
              </div>
            </div>
            <div>
              <div class="relative mt-1 rounded-md shadow-sm max-w-[160px]">
                <input
                  type="number"
                  v-model="taxasForm.USD"
                  step="0.01"
                  min="0"
                  class="block w-full rounded-md border-0 py-2.5 pl-3 pr-12 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  placeholder="0.00"
                  @input="simularCotacao('USD')"
                />
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span class="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>
            <div class="text-gray-700 font-medium">
              <div class="flex items-center gap-2">
                {{ formatarMoeda(cotacoes?.USD || 0) }}
                <span v-if="atualizando" class="text-xs text-primary-600">
                  <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-medium" :class="{'text-green-600': simulacoes.USD > (cotacoes?.USD || 0), 'text-red-600': simulacoes.USD < (cotacoes?.USD || 0)}">
                {{ formatarMoeda(simulacoes.USD || calcularCotacaoFinal('USD')) }}
              </span>
              <span v-if="simulacoes.USD !== calcularCotacaoFinal('USD')" class="text-xs text-gray-500">(simulação)</span>
            </div>
          </div>

          <!-- EUR -->
          <div class="grid grid-cols-4 gap-4 items-center">
            <div class="flex items-center gap-2">
              <span class="fi fi-eu w-5 h-5 rounded-sm"></span>
              <div>
                <span class="font-medium text-gray-700">EUR</span>
                <p class="text-sm text-gray-500">Euro</p>
              </div>
            </div>
            <div>
              <div class="relative mt-1 rounded-md shadow-sm max-w-[160px]">
                <input
                  type="number"
                  v-model="taxasForm.EUR"
                  step="0.01"
                  min="0"
                  class="block w-full rounded-md border-0 py-2.5 pl-3 pr-12 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  placeholder="0.00"
                  @input="simularCotacao('EUR')"
                />
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span class="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>
            <div class="text-gray-700 font-medium">
              <div class="flex items-center gap-2">
                {{ formatarMoeda(cotacoes?.EUR || 0) }}
                <span v-if="atualizando" class="text-xs text-primary-600">
                  <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-medium" :class="{'text-green-600': simulacoes.EUR > (cotacoes?.EUR || 0), 'text-red-600': simulacoes.EUR < (cotacoes?.EUR || 0)}">
                {{ formatarMoeda(simulacoes.EUR || calcularCotacaoFinal('EUR')) }}
              </span>
              <span v-if="simulacoes.EUR !== calcularCotacaoFinal('EUR')" class="text-xs text-gray-500">(simulação)</span>
            </div>
          </div>

          <!-- GBP -->
          <div class="grid grid-cols-4 gap-4 items-center">
            <div class="flex items-center gap-2">
              <span class="fi fi-gb w-5 h-5 rounded-sm"></span>
              <div>
                <span class="font-medium text-gray-700">GBP</span>
                <p class="text-sm text-gray-500">Libra Esterlina</p>
              </div>
            </div>
            <div>
              <div class="relative mt-1 rounded-md shadow-sm max-w-[160px]">
                <input
                  type="number"
                  v-model="taxasForm.GBP"
                  step="0.01"
                  min="0"
                  class="block w-full rounded-md border-0 py-2.5 pl-3 pr-12 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  placeholder="0.00"
                  @input="simularCotacao('GBP')"
                />
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span class="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>
            <div class="text-gray-700 font-medium">
              <div class="flex items-center gap-2">
                {{ formatarMoeda(cotacoes?.GBP || 0) }}
                <span v-if="atualizando" class="text-xs text-primary-600">
                  <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-medium" :class="{'text-green-600': simulacoes.GBP > (cotacoes?.GBP || 0), 'text-red-600': simulacoes.GBP < (cotacoes?.GBP || 0)}">
                {{ formatarMoeda(simulacoes.GBP || calcularCotacaoFinal('GBP')) }}
              </span>
              <span v-if="simulacoes.GBP !== calcularCotacaoFinal('GBP')" class="text-xs text-gray-500">(simulação)</span>
            </div>
          </div>
        </div>

        <!-- Botões de ação -->
        <div class="mt-8 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            @click="resetarSimulacoes"
            :disabled="salvando"
          >
            Cancelar Alterações
          </button>
          <button
            type="button"
            class="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            @click="salvarConfiguracoes"
            :disabled="salvando"
          >
            {{ salvando ? 'Salvando...' : 'Salvar Configurações' }}
          </button>
        </div>
      </div>

      <!-- Botão Salvar -->
      <div class="p-6 flex justify-end">
        <button
          type="button"
          :disabled="salvando"
          class="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="salvarConfiguracoes"
        >
          <span v-if="salvando">Salvando...</span>
          <span v-else>Salvar Alterações</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { db } from '@/config/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { useCotacoesTempoReal, formatarMoeda } from '@/utils/cotacoes'

// Estado das taxas e cotações
const { 
  cotacoes, 
  taxas, 
  calcularCotacaoFinal, 
  atualizarDados, 
  atualizando, 
  segundosParaAtualizar,
  atualizarTaxaTemporaria,
  salvarTaxas
} = useCotacoesTempoReal()

// Estado local para controle do formulário
const salvando = ref(false)
const taxasForm = ref({
  USD: 0,
  EUR: 0,
  GBP: 0
})

// Estado para simulações
const simulacoes = ref({
  USD: 0,
  EUR: 0,
  GBP: 0
})

// Resetar simulações
const resetarSimulacoes = () => {
  simulacoes.value = {
    USD: 0,
    EUR: 0,
    GBP: 0
  }
}

// Simular cotação com novo percentual
const simularCotacao = (moeda: 'USD' | 'EUR' | 'GBP') => {
  if (!cotacoes.value) return
  const taxa = Number(taxasForm.value[moeda] || 0)
  // Atualiza a taxa temporária imediatamente
  atualizarTaxaTemporaria(moeda, taxa)
  // Atualiza a simulação
  const cotacaoBase = cotacoes.value[moeda] || 0
  simulacoes.value[moeda] = cotacaoBase * (1 + taxa / 100)
}

// Inicializar valores do formulário quando as taxas forem carregadas
watch(taxas, (novasTaxas) => {
  if (novasTaxas) {
    taxasForm.value = {
      USD: novasTaxas.USD || 0,
      EUR: novasTaxas.EUR || 0,
      GBP: novasTaxas.GBP || 0
    }
    resetarSimulacoes()
  }
}, { immediate: true })

// Salvar configurações
const salvarConfiguracoes = async () => {
  if (salvando.value) return
  
  salvando.value = true
  try {
    const dados = {
      USD: Number(taxasForm.value.USD || 0),
      EUR: Number(taxasForm.value.EUR || 0),
      GBP: Number(taxasForm.value.GBP || 0)
    }

    // Validar valores
    for (const [moeda, valor] of Object.entries(dados)) {
      if (isNaN(valor) || valor < 0) {
        throw new Error(`Valor inválido para ${moeda}. Por favor, insira um número positivo.`)
      }
    }
    
    // Salvar no Firestore
    const sucesso = await salvarTaxas(dados)
    if (sucesso) {
      // Resetar simulações após atualização bem-sucedida
      resetarSimulacoes()
      // Feedback visual
      alert('Configurações salvas com sucesso!')
    } else {
      throw new Error('Erro ao salvar configurações')
    }
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    alert(error instanceof Error ? error.message : 'Erro ao salvar configurações. Tente novamente.')
  } finally {
    salvando.value = false
  }
}
</script>
