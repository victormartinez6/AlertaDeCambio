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
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Cotação Alvo</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Válido Até</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Notificações</th>
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
                    {{ formatarMoeda(alerta.cotacaoAlvo) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ formatarData(alerta.validoAte) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span :class="[
                      statusClasses[alerta.status],
                      'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset'
                    ]">
                      {{ statusTexto[alerta.status] }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div class="flex gap-2">
                      <EnvelopeIcon 
                        v-if="alerta.canaisNotificacao.includes('email')" 
                        class="h-5 w-5 text-gray-400" 
                      />
                      <PhoneIcon 
                        v-if="alerta.canaisNotificacao.includes('whatsapp')" 
                        class="h-5 w-5 text-gray-400" 
                      />
                    </div>
                  </td>
                  <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      @click="excluirAlerta(alerta.id)"
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
import { ref } from 'vue'
import { BellIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/vue/24/outline'

interface Alerta {
  id: string
  moeda: string
  cotacaoAlvo: number
  validoAte: string
  status: 'ativo' | 'expirado' | 'atingido'
  canaisNotificacao: string[]
}

const statusClasses = {
  ativo: 'bg-green-50 text-green-700 ring-green-600/20',
  expirado: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  atingido: 'bg-blue-50 text-blue-700 ring-blue-600/20'
}

const statusTexto = {
  ativo: 'Ativo',
  expirado: 'Expirado',
  atingido: 'Atingido'
}

const alertas = ref<Alerta[]>([
  {
    id: '1',
    moeda: 'USD/BRL',
    cotacaoAlvo: 4.85,
    validoAte: '2024-02-28',
    status: 'ativo',
    canaisNotificacao: ['email', 'whatsapp']
  },
  {
    id: '2',
    moeda: 'EUR/BRL',
    cotacaoAlvo: 5.25,
    validoAte: '2024-02-15',
    status: 'atingido',
    canaisNotificacao: ['email']
  },
  {
    id: '3',
    moeda: 'GBP/BRL',
    cotacaoAlvo: 6.15,
    validoAte: '2024-01-30',
    status: 'expirado',
    canaisNotificacao: ['whatsapp']
  }
])

const formatarMoeda = (valor: number): string => {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

const formatarData = (data: string): string => {
  return new Date(data).toLocaleDateString('pt-BR')
}

const excluirAlerta = (id: string) => {
  if (confirm('Tem certeza que deseja excluir este alerta?')) {
    alertas.value = alertas.value.filter(alerta => alerta.id !== id)
  }
}
</script>
