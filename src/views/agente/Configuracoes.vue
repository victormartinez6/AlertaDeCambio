<template>
  <div class="space-y-8">
    <!-- Cabeçalho -->
    <div class="sm:flex sm:items-center pt-4">
      <div class="sm:flex-auto">
        <h1 class="text-xl sm:text-2xl font-bold text-marinho">Configurações</h1>
        <p class="mt-2 text-xs sm:text-sm text-marinho/70">
          Gerencie as configurações do seu sistema de alertas.
        </p>
      </div>
    </div>

    <!-- Conteúdo -->
    <div class="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
      <!-- Seção de Cotações -->
      <div class="p-4 sm:p-6 border-b border-gray-200">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 class="text-base sm:text-lg font-medium text-marinho">Parametrização de Cotações (Turismo)</h2>
            <p class="text-xs sm:text-sm text-gray-500 mt-1">
              Configure o percentual a ser adicionado.
              O valor final será automaticamente atualizado na tabela de cotações.
            </p>
          </div>
          <div class="text-xs sm:text-sm text-gray-500 flex flex-col items-start sm:items-end gap-2">
            <!-- Timer -->
            <div class="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 sm:h-4 sm:w-4 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
              <span class="font-medium">
                Próxima atualização em: {{ Math.floor(segundosParaAtualizar / 60) }}:{{ String(segundosParaAtualizar % 60).padStart(2, '0') }}
              </span>
            </div>
            
            <!-- Status -->
            <div>
              <span v-if="atualizando" class="inline-flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Atualizando cotações...
              </span>
              <span v-else class="flex items-center gap-1">
                <svg class="h-3 w-3 sm:h-4 sm:w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                </svg>
                Cotações atualizadas
              </span>
            </div>
          </div>
        </div>

        <!-- Tabela com scroll horizontal no mobile -->
        <div class="overflow-x-auto -mx-4 sm:mx-0">
          <div class="inline-block min-w-full align-middle px-4 sm:px-0">
            <div class="overflow-hidden">
              <div class="min-w-[800px]">
                <!-- Cabeçalho da tabela -->
                <div class="grid grid-cols-6 gap-4 mb-4 text-xs sm:text-sm font-semibold text-gray-600">
                  <div>Moeda</div>
                  <div>Câmbio Comercial</div>
                  <div>% Compra (Com IOF)</div>
                  <div>Cotação Final (Compra)</div>
                  <div>% Venda (Com IOF)</div>
                  <div>Cotação Final (Venda)</div>
                </div>

                <!-- USD -->
                <div class="grid grid-cols-6 gap-4 py-2 border-b text-xs sm:text-sm">
                  <!-- Moeda -->
                  <div class="flex items-center gap-2">
                    <span class="fi fi-us w-4 h-4 sm:w-5 sm:h-5 rounded-sm"></span>
                    <div>
                      <span class="font-medium text-gray-700">USD</span>
                      <p class="text-xs text-gray-500">Dólar Americano</p>
                    </div>
                  </div>
                  <!-- Cotação Base -->
                  <div class="text-gray-700">
                    {{ formatarMoeda(cotacoes?.USD || 0) }}
                  </div>
                  <!-- % Compra -->
                  <div>
                    <input
                      type="number"
                      v-model="taxasForm.USD_COMPRA"
                      @input="() => simularCotacao('USD')"
                      class="w-16 sm:w-20 px-2 py-1 border rounded text-xs sm:text-sm"
                      step="0.01"
                    />
                  </div>
                  <!-- Cotação Final (Compra) -->
                  <div class="text-gray-700 font-medium">
                    {{ formatarMoeda(simulacoes.USD_COMPRA) }}
                  </div>
                  <!-- % Venda -->
                  <div>
                    <input
                      type="number"
                      v-model="taxasForm.USD"
                      @input="() => simularCotacao('USD')"
                      class="w-16 sm:w-20 px-2 py-1 border rounded text-xs sm:text-sm"
                      step="0.01"
                    />
                  </div>
                  <!-- Cotação Final (Venda) -->
                  <div class="text-gray-700 font-medium">
                    {{ formatarMoeda(simulacoes.USD) }}
                  </div>
                </div>

                <!-- EUR -->
                <div class="grid grid-cols-6 gap-4 py-2 border-b text-xs sm:text-sm">
                  <!-- Moeda -->
                  <div class="flex items-center gap-2">
                    <span class="fi fi-eu w-4 h-4 sm:w-5 sm:h-5 rounded-sm"></span>
                    <div>
                      <span class="font-medium text-gray-700">EUR</span>
                      <p class="text-xs text-gray-500">Euro</p>
                    </div>
                  </div>
                  <!-- Cotação Base -->
                  <div class="text-gray-700">
                    {{ formatarMoeda(cotacoes?.EUR || 0) }}
                  </div>
                  <!-- % Compra -->
                  <div>
                    <input
                      type="number"
                      v-model="taxasForm.EUR_COMPRA"
                      @input="() => simularCotacao('EUR')"
                      class="w-16 sm:w-20 px-2 py-1 border rounded text-xs sm:text-sm"
                      step="0.01"
                    />
                  </div>
                  <!-- Cotação Final (Compra) -->
                  <div class="text-gray-700 font-medium">
                    {{ formatarMoeda(simulacoes.EUR_COMPRA) }}
                  </div>
                  <!-- % Venda -->
                  <div>
                    <input
                      type="number"
                      v-model="taxasForm.EUR"
                      @input="() => simularCotacao('EUR')"
                      class="w-16 sm:w-20 px-2 py-1 border rounded text-xs sm:text-sm"
                      step="0.01"
                    />
                  </div>
                  <!-- Cotação Final (Venda) -->
                  <div class="text-gray-700 font-medium">
                    {{ formatarMoeda(simulacoes.EUR) }}
                  </div>
                </div>

                <!-- GBP -->
                <div class="grid grid-cols-6 gap-4 py-2 border-b text-xs sm:text-sm">
                  <!-- Moeda -->
                  <div class="flex items-center gap-2">
                    <span class="fi fi-gb w-4 h-4 sm:w-5 sm:h-5 rounded-sm"></span>
                    <div>
                      <span class="font-medium text-gray-700">GBP</span>
                      <p class="text-xs text-gray-500">Libra Esterlina</p>
                    </div>
                  </div>
                  <!-- Cotação Base -->
                  <div class="text-gray-700">
                    {{ formatarMoeda(cotacoes?.GBP || 0) }}
                  </div>
                  <!-- % Compra -->
                  <div>
                    <input
                      type="number"
                      v-model="taxasForm.GBP_COMPRA"
                      @input="() => simularCotacao('GBP')"
                      class="w-16 sm:w-20 px-2 py-1 border rounded text-xs sm:text-sm"
                      step="0.01"
                    />
                  </div>
                  <!-- Cotação Final (Compra) -->
                  <div class="text-gray-700 font-medium">
                    {{ formatarMoeda(simulacoes.GBP_COMPRA) }}
                  </div>
                  <!-- % Venda -->
                  <div>
                    <input
                      type="number"
                      v-model="taxasForm.GBP"
                      @input="() => simularCotacao('GBP')"
                      class="w-16 sm:w-20 px-2 py-1 border rounded text-xs sm:text-sm"
                      step="0.01"
                    />
                  </div>
                  <!-- Cotação Final (Venda) -->
                  <div class="text-gray-700 font-medium">
                    {{ formatarMoeda(simulacoes.GBP) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Botões de ação -->
        <div class="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            class="w-full sm:w-auto rounded-md bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            @click="resetarSimulacoes"
          >
            Resetar
          </button>
          <button
            type="button"
            class="w-full sm:w-auto rounded-md bg-primary-600 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            @click="salvarConfiguracoes"
            :disabled="atualizando"
          >
            <span v-if="!atualizando">Salvar Alterações</span>
            <span v-else class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Salvando...
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { db } from '@/firebase/config'
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
  USD_COMPRA: 0,
  EUR: 0,
  EUR_COMPRA: 0,
  GBP: 0,
  GBP_COMPRA: 0
})

// Estado para simulações
const simulacoes = ref({
  USD: null as number | null,
  USD_COMPRA: null as number | null,
  EUR: null as number | null,
  EUR_COMPRA: null as number | null,
  GBP: null as number | null,
  GBP_COMPRA: null as number | null
})

// Calcular cotação final
const calcularCotacao = (moeda: string, operacao: 'venda' | 'compra' = 'venda') => {
  if (!cotacoes.value) return 0
  
  const cotacaoBase = operacao === 'venda' ? 
    cotacoes.value[moeda] : 
    cotacoes.value[`${moeda}_BID`]
  
  const taxa = operacao === 'venda' ? 
    Number(taxasForm.value[moeda] || 0) : 
    Number(taxasForm.value[`${moeda}_COMPRA`] || 0)
  
  if (operacao === 'venda') {
    return cotacaoBase * (1 + taxa / 100)
  } else {
    return cotacaoBase * (1 - taxa / 100)
  }
}

// Simular cotação com novo percentual
const simularCotacao = (moeda: 'USD' | 'EUR' | 'GBP') => {
  if (!cotacoes.value) return
  simulacoes.value[moeda] = calcularCotacao(moeda, 'venda')
  simulacoes.value[`${moeda}_COMPRA`] = calcularCotacao(moeda, 'compra')
}

// Resetar simulações
const resetarSimulacoes = () => {
  if (!cotacoes.value) return
  simularCotacao('USD')
  simularCotacao('EUR')
  simularCotacao('GBP')
}

// Atualizar simulações quando as cotações mudarem
watch(cotacoes, () => {
  resetarSimulacoes()
}, { deep: true })

// Inicializar valores do formulário quando as taxas forem carregadas
watch(taxas, (novasTaxas) => {
  if (novasTaxas && !taxasForm.value.USD) {
    taxasForm.value = {
      USD: novasTaxas.USD || 0,
      USD_COMPRA: novasTaxas.USD_COMPRA || 0,
      EUR: novasTaxas.EUR || 0,
      EUR_COMPRA: novasTaxas.EUR_COMPRA || 0,
      GBP: novasTaxas.GBP || 0,
      GBP_COMPRA: novasTaxas.GBP_COMPRA || 0
    }
    resetarSimulacoes()
  }
}, { immediate: true })

// Salvar configurações
const salvarConfiguracoes = async () => {
  if (salvando.value) return
  
  salvando.value = true
  try {
    // Mantém os valores exatos do formulário
    const taxasAtualizadas = { ...taxasForm.value }
    await salvarTaxas(taxasAtualizadas)
    resetarSimulacoes()
    alert('Configurações salvas com sucesso!')
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    alert(error instanceof Error ? error.message : 'Erro ao salvar configurações. Tente novamente.')
  } finally {
    salvando.value = false
  }
}
</script>
