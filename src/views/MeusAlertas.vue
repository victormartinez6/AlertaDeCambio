<template>
  <div class="space-y-6">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-base font-semibold leading-6 text-gray-900 flex items-center gap-2">
          <BellIcon class="h-5 w-5 text-primary-600" />
          Meus Alertas
        </h1>
        <p class="mt-2 text-sm text-gray-700">
          Lista de todos os seus alertas de câmbio ativos e histórico
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
                <tr v-for="alerta in alertas" :key="alerta.id">
                  <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {{ alerta.moeda }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ alerta.produto === 'turismo' ? 'Turismo' : 'Remessa' }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ formatarMoeda(alerta.cotacaoAtualNaCriacao || 0) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ formatarMoeda(alerta.cotacaoAlvo) }}
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
                    <span v-if="alerta.webhookDisparado" class="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      Enviado
                    </span>
                    <span v-else class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      Pendente
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div v-if="alerta.historicoDisparos && alerta.historicoDisparos.length > 0" class="mt-4">
                      <h3 class="font-semibold mb-2">Histórico de Disparos:</h3>
                      <div v-for="(disparo, index) in alerta.historicoDisparos" :key="index" class="text-sm mb-2">
                        <div class="flex items-center gap-2">
                          <span class="badge badge-info">{{ formatarData(disparo.horario) }}</span>
                          <span>Cotação: {{ formatarMoeda(disparo.cotacao) }}</span>
                        </div>
                        <p class="text-gray-600">{{ disparo.mensagem }}</p>
                      </div>
                    </div>
                    <span v-else class="text-gray-400">Nenhum disparo</span>
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
import { ref, onMounted } from 'vue'
import { BellIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/vue/24/outline'
import { useAlertasStore } from '@/stores/alertas'
import type { AlertaData } from '@/stores/alertas'

const alertasStore = useAlertasStore()
const alertas = ref<AlertaData[]>([])

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
function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
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
    alertas.value = alertasStore.alertas
  } catch (error) {
    console.error('Erro ao carregar alertas:', error)
  }
}

// Carregar alertas ao montar o componente
onMounted(() => {
  carregarAlertas()
})
</script>
