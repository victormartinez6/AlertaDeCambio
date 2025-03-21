<template>
  <div class="space-y-6">
    <!-- Componente de depuração (temporário) -->
    <div class="bg-gray-100 p-4 rounded-md mb-4">
      <h3 class="text-lg font-semibold mb-2">Depuração de Alertas</h3>
      <div v-for="(alerta, index) in alertas" :key="index" class="mb-2 p-2 border border-gray-300 rounded-md">
        <p><strong>ID:</strong> {{ alerta.id }}</p>
        <p><strong>Moeda:</strong> {{ alerta.moeda }}</p>
        <p><strong>Webhook Disparado:</strong> {{ alerta.webhookDisparado ? 'Sim' : 'Não' }}</p>
        <p><strong>Status:</strong> {{ getStatus(alerta) }}</p>
        <p><strong>Horário Disparo:</strong> {{ alerta.horarioDisparo || 'N/A' }}</p>
        <button 
          @click="simularDisparo(alerta)" 
          class="mt-2 bg-blue-500 text-white px-3 py-1 rounded-md text-sm"
        >
          Simular Disparo
        </button>
      </div>
    </div>

    <!-- Notificação de alerta disparado -->
    <div v-if="notificacaoAtiva" class="fixed top-4 right-4 z-50 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-lg flex items-start max-w-md animate-slide-in">
      <div class="flex-shrink-0 mr-3">
        <svg class="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <div>
        <p class="font-bold">Alerta disparado!</p>
        <p class="text-sm">{{ notificacaoMensagem }}</p>
      </div>
      <button @click="fecharNotificacao" class="ml-auto text-blue-500 hover:text-blue-700">
        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold leading-6 text-gray-900 flex items-center gap-2">
          <BellIcon class="h-5 w-5 text-primary-600" />
          Todos os Alertas
        </h1>
        <p class="mt-2 text-sm text-gray-700">
          Lista de todos os alertas de câmbio ativos no sistema
        </p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <router-link
          to="/novo-alerta"
          class="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          Novo Alerta
        </router-link>
      </div>
    </div>

    <div class="mt-8 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Moeda</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Produto</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Cotação Atual na Criação</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Cotação Alvo</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Válido Até</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Notificações</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Webhook Disparado</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Histórico de Disparos</th>
                  <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span class="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="alerta in alertas" :key="alerta.id" :class="{'bg-blue-50': alerta.webhookDisparado, 'highlight-row': alerta.novoDisparo}">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {{ alerta.moeda }}
                    <div v-if="alerta.webhookDisparado" class="mt-1">
                      <span class="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Alvo atingido!
                      </span>
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ alerta.produto === 'turismo' ? 'Turismo' : 'Remessa' }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ formatarMoeda(alerta.cotacaoAtualNaCriacao || 0, alerta.produto) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ formatarMoeda(alerta.cotacaoAlvo, alerta.produto) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ formatarData(alerta.dataLimite || '') }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span :class="[
                      statusClasses[getStatus(alerta)],
                      'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset'
                    ]">
                      {{ statusTexto[getStatus(alerta)] }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div class="flex gap-2">
                      <EnvelopeIcon 
                        v-if="alerta.notificarEmail" 
                        class="h-5 w-5 text-gray-400" 
                      />
                      <PhoneIcon 
                        v-if="alerta.notificarWhatsapp" 
                        class="h-5 w-5 text-gray-400" 
                      />
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div v-if="alerta.webhookDisparado" class="space-y-1">
                      <span class="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Webhook Enviado
                      </span>
                      <div v-if="alerta.cotacaoDisparo" class="text-xs text-blue-700">
                        Cotação no disparo: {{ formatarMoeda(alerta.cotacaoDisparo, alerta.produto) }}
                      </div>
                      <div v-if="alerta.horarioDisparo" class="text-xs text-blue-700">
                        Em: {{ formatarData(alerta.horarioDisparo) }}
                      </div>
                    </div>
                    <span v-else class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      Pendente
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div v-if="alerta.historicoDisparos && alerta.historicoDisparos.length > 0" class="mt-2">
                      <div class="flex items-center gap-1 mb-1 text-xs font-medium text-blue-800">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Histórico de Disparos
                      </div>
                      <div class="space-y-2 max-h-32 overflow-y-auto pr-2">
                        <div v-for="(disparo, index) in alerta.historicoDisparos" :key="index" 
                             class="text-xs p-2 rounded-md bg-blue-50 border border-blue-100">
                          <div class="flex items-center justify-between mb-1">
                            <span class="font-medium text-blue-700">{{ formatarData(disparo.horario) }}</span>
                            <span class="font-bold text-blue-800">{{ formatarMoeda(disparo.cotacao, alerta.produto) }}</span>
                          </div>
                          <p class="text-blue-600">{{ disparo.mensagem || 'Alerta disparado com sucesso' }}</p>
                        </div>
                      </div>
                    </div>
                    <span v-else class="text-xs text-gray-400">Nenhum disparo registrado</span>
                  </td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      @click="excluirAlerta(alerta.id!)"
                      class="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { BellIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/vue/24/outline'
import { useAlertasStore } from '../stores/alertas'
import type { AlertaData } from '../stores/alertas'

const alertasStore = useAlertasStore()
const alertas = ref<(AlertaData & { novoDisparo?: boolean })[]>([])
const notificacaoAtiva = ref(false)
const notificacaoMensagem = ref('')

const statusClasses = {
  ativo: 'text-green-700 bg-green-50 ring-green-600/20',
  expirado: 'text-red-700 bg-red-50 ring-red-600/20',
  alvoAtingido: 'text-blue-700 bg-blue-50 ring-blue-600/20'
}

const statusTexto = {
  ativo: 'Ativo',
  expirado: 'Expirado',
  alvoAtingido: 'Alvo Atingido'
}

const getStatus = (alerta: AlertaData) => {
  if (alerta.webhookDisparado) return 'alvoAtingido'
  if (!alerta.ativo) return 'expirado'
  return 'ativo'
}

// Função para formatar moeda
function formatarMoeda(valor: number, produto?: string): string {
  const precisao = produto === 'remessas' ? 4 : 2
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: precisao,
    maximumFractionDigits: precisao
  }).format(valor)
}

// Função para formatar data
function formatarData(data: string): string {
  if (!data) return '-'
  return new Date(data).toLocaleDateString('pt-BR')
}

// Função para excluir alerta
async function excluirAlerta(id: string) {
  try {
    await alertasStore.excluirAlerta(id)
    await carregarAlertas()
  } catch (error) {
    console.error('Erro ao excluir alerta:', error)
  }
}

// Função para carregar alertas
async function carregarAlertas() {
  try {
    await alertasStore.listarAlertas()
    const novaListaAlertas = alertasStore.alertas
    
    // Verificar se há alertas recém-disparados
    if (alertas.value.length > 0) {
      novaListaAlertas.forEach(novoAlerta => {
        const alertaAntigo = alertas.value.find(a => a.id === novoAlerta.id)
        if (alertaAntigo && !alertaAntigo.webhookDisparado && novoAlerta.webhookDisparado) {
          // Alerta foi disparado desde a última atualização
          mostrarNotificacao(`O alerta para ${novoAlerta.moeda} atingiu a cotação alvo de ${formatarMoeda(novoAlerta.cotacaoAlvo, novoAlerta.produto)}!`)
          novoAlerta.novoDisparo = true
          setTimeout(() => {
            novoAlerta.novoDisparo = false
          }, 2000)
        }
      })
    }
    
    alertas.value = novaListaAlertas
  } catch (error) {
    console.error('Erro ao carregar alertas:', error)
  }
}

// Função para mostrar notificação
function mostrarNotificacao(mensagem: string) {
  notificacaoAtiva.value = true
  notificacaoMensagem.value = mensagem
  setTimeout(() => {
    notificacaoAtiva.value = false
  }, 5000)
}

// Função para fechar notificação
function fecharNotificacao() {
  notificacaoAtiva.value = false
}

// Função para simular disparo de alerta
async function simularDisparo(alerta: AlertaData & { novoDisparo?: boolean }) {
  try {
    // Atualizar localmente
    alerta.webhookDisparado = true
    alerta.cotacaoDisparo = alerta.cotacaoAlvo
    alerta.horarioDisparo = new Date().toISOString()
    
    // Adicionar ao histórico de disparos
    if (!alerta.historicoDisparos) {
      alerta.historicoDisparos = []
    }
    
    alerta.historicoDisparos.push({
      horario: alerta.horarioDisparo,
      cotacao: alerta.cotacaoAlvo,
      mensagem: 'Disparo simulado manualmente'
    })
    
    // Atualizar no Firestore
    if (alerta.id) {
      await alertasStore.atualizarAlerta(alerta.id, {
        webhookDisparado: true,
        horarioDisparo: alerta.horarioDisparo,
        cotacaoDisparo: alerta.cotacaoAlvo,
        historicoDisparos: alerta.historicoDisparos
      })
      
      // Destacar o alerta com animação
      alerta.novoDisparo = true
      setTimeout(() => {
        alerta.novoDisparo = false
      }, 2000)
      
      mostrarNotificacao(`O alerta para ${alerta.moeda} foi disparado com sucesso!`)
    }
  } catch (error) {
    console.error('Erro ao simular disparo:', error)
    alert('Erro ao simular disparo. Verifique o console para mais detalhes.')
  }
}

// Carregar alertas ao montar o componente
onMounted(() => {
  carregarAlertas()
})
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out forwards;
}

@keyframes highlight {
  0% {
    background-color: rgba(219, 234, 254, 0.3);
  }
  50% {
    background-color: rgba(219, 234, 254, 1);
  }
  100% {
    background-color: rgba(219, 234, 254, 0.5);
  }
}

.highlight-row {
  animation: highlight 2s ease-out;
}

/* Adicionar uma transição suave para o fundo do card */
tr {
  transition: background-color 0.3s ease;
}

/* Destacar a linha quando passar o mouse */
tr:hover {
  background-color: rgba(243, 244, 246, 0.5);
}

/* Destacar ainda mais quando for um alerta disparado */
tr.bg-blue-50:hover {
  background-color: rgba(219, 234, 254, 0.7);
}
</style>
