<template>
  <div>
    <!-- Cabeçalho com botão de novo webhook -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Webhooks</h2>
        <p class="mt-1 text-sm text-gray-600">Gerencie os endpoints que receberão as notificações dos eventos</p>
      </div>
      <button
        @click="showNewWebhookModal = true"
        class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
      >
        <PlusIcon class="h-5 w-5 mr-1.5" />
        Novo Webhook
      </button>
    </div>

    <!-- Lista de Webhooks -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Webhooks Configurados</h3>
      </div>
      
      <div class="divide-y divide-gray-200">
        <div v-for="webhook in webhooksStore.webhooks" :key="webhook.id" class="p-6">
          <div class="flex items-start justify-between">
            <div>
              <h4 class="text-lg font-medium text-gray-900">{{ webhook.name }}</h4>
              <p class="mt-1 text-sm text-gray-600">{{ webhook.url }}</p>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="editWebhook(webhook)"
                class="inline-flex items-center p-2 text-gray-500 hover:text-primary-600 rounded-lg"
              >
                <PencilIcon class="h-5 w-5" />
              </button>
              <button
                @click="deleteWebhook(webhook)"
                class="inline-flex items-center p-2 text-gray-500 hover:text-red-600 rounded-lg"
              >
                <TrashIcon class="h-5 w-5" />
              </button>
            </div>
          </div>

          <!-- Eventos inscritos -->
          <div class="mt-4 flex flex-wrap gap-2">
            <div class="text-sm font-medium text-gray-700 mr-2">Eventos:</div>
            <span
              v-for="event in webhook.events"
              :key="event"
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                getEventBadgeColor(event)
              ]"
            >
              {{ getEventDisplayName(event) }}
            </span>
          </div>
        </div>

        <!-- Estado de carregamento -->
        <div v-if="webhooksStore.loading" class="p-6 text-center text-gray-500">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p class="mt-2">Carregando webhooks...</p>
        </div>

        <!-- Mensagem de erro -->
        <div v-else-if="webhooksStore.error" class="p-6">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-600">Erro ao carregar webhooks. Tente novamente mais tarde.</p>
          </div>
        </div>

        <!-- Mensagem quando não há webhooks -->
        <div v-else-if="!webhooksStore.webhooks.length" class="p-6 text-center text-gray-500">
          Nenhum webhook configurado
        </div>
      </div>
    </div>

    <!-- Modal de Novo/Editar Webhook -->
    <TransitionRoot appear :show="showNewWebhookModal" as="template">
      <Dialog as="div" @close="closeModal" class="relative z-50">
        <TransitionChild
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div class="flex items-center justify-between mb-4">
                  <DialogTitle as="h3" class="text-lg font-medium text-gray-900">
                    {{ editingWebhook ? 'Editar Webhook' : 'Novo Webhook' }}
                  </DialogTitle>
                  <button
                    @click="closeModal"
                    class="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon class="h-6 w-6" />
                  </button>
                </div>

                <form @submit.prevent="saveWebhook" class="space-y-4">
                  <!-- Nome do Webhook -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Nome</label>
                    <input
                      v-model="webhookForm.name"
                      type="text"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Ex: Meu Sistema"
                      required
                    />
                  </div>

                  <!-- URL do Webhook -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700">URL</label>
                    <input
                      v-model="webhookForm.url"
                      type="url"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="https://exemplo.com/webhook"
                      required
                    />
                  </div>

                  <!-- Eventos -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Eventos</label>
                    <div class="space-y-2">
                      <div
                        v-for="event in availableEvents"
                        :key="event.id"
                        class="flex items-center"
                      >
                        <input
                          :id="event.id"
                          v-model="webhookForm.events"
                          :value="event.id"
                          type="checkbox"
                          class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label :for="event.id" class="ml-2 block text-sm text-gray-700">
                          {{ event.name }}
                          <span class="text-xs text-gray-500">{{ event.description }}</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div class="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      @click="closeModal"
                      class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
                      :disabled="webhooksStore.loading"
                    >
                      <span v-if="!webhooksStore.loading">
                        {{ editingWebhook ? 'Salvar' : 'Criar' }}
                      </span>
                      <span v-else class="flex items-center">
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processando...
                      </span>
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useWebhooksStore } from '@/stores/webhooks'

// Store
const webhooksStore = useWebhooksStore()

// Estado local
const showNewWebhookModal = ref(false)
const editingWebhook = ref(null)
const webhookForm = ref({
  name: '',
  url: '',
  events: []
})

// Lista de eventos disponíveis
const availableEvents = [
  {
    id: 'alert.created',
    name: 'Alerta Criado',
    description: 'Quando um novo alerta é criado',
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'alert.updated',
    name: 'Alerta Atualizado',
    description: 'Quando um alerta é modificado',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'alert.deleted',
    name: 'Alerta Removido',
    description: 'Quando um alerta é removido',
    color: 'bg-red-100 text-red-800'
  },
  {
    id: 'alert.triggered',
    name: 'Alerta Disparado',
    description: 'Quando a cotação atinge o valor desejado',
    color: 'bg-yellow-100 text-yellow-800'
  },
  {
    id: 'notification.email.sent',
    name: 'Email Enviado',
    description: 'Quando uma notificação por email é enviada',
    color: 'bg-indigo-100 text-indigo-800'
  },
  {
    id: 'notification.whatsapp.sent',
    name: 'WhatsApp Enviado',
    description: 'Quando uma notificação por WhatsApp é enviada',
    color: 'bg-green-100 text-green-800'
  }
]

// Funções auxiliares
function getEventDisplayName(eventId: string) {
  const event = availableEvents.find(e => e.id === eventId)
  return event ? event.name : eventId
}

function getEventBadgeColor(eventId: string) {
  const event = availableEvents.find(e => e.id === eventId)
  return event ? event.color : 'bg-gray-100 text-gray-800'
}

// Ações
function editWebhook(webhook) {
  editingWebhook.value = webhook
  webhookForm.value = {
    name: webhook.name,
    url: webhook.url,
    events: [...webhook.events]
  }
  showNewWebhookModal.value = true
}

async function deleteWebhook(webhook) {
  if (confirm('Tem certeza que deseja remover este webhook?')) {
    try {
      await webhooksStore.deleteWebhook(webhook.id)
    } catch (error) {
      console.error('Erro ao deletar webhook:', error)
    }
  }
}

function closeModal() {
  showNewWebhookModal.value = false
  editingWebhook.value = null
  webhookForm.value = {
    name: '',
    url: '',
    events: []
  }
}

async function saveWebhook() {
  try {
    const webhookData = {
      name: webhookForm.value.name,
      url: webhookForm.value.url,
      events: webhookForm.value.events
    }

    if (editingWebhook.value) {
      await webhooksStore.updateWebhook(editingWebhook.value.id, webhookData)
    } else {
      await webhooksStore.createWebhook(webhookData)
    }
    closeModal()
  } catch (error) {
    console.error('Erro ao salvar webhook:', error)
  }
}

onMounted(async () => {
  await webhooksStore.fetchWebhooks()
})
</script>
