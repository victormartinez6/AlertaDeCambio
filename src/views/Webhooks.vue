<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Webhooks</h1>
      <button
        @click="openModal"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Novo Webhook
      </button>
    </div>

    <!-- Lista de Webhooks -->
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200">
        <li v-for="webhook in webhooks" :key="webhook.id" class="px-6 py-4 hover:bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center">
                <h3 class="text-lg font-medium text-gray-900">{{ webhook.name }}</h3>
                <span
                  :class="[
                    'ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                    webhook.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ webhook.active ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
              <p class="mt-1 text-sm text-gray-500 truncate">{{ webhook.url }}</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="event in webhook.events"
                  :key="event"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {{ event }}
                </span>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <button
                @click="editWebhook(webhook)"
                class="text-primary-600 hover:text-primary-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                @click="deleteWebhook(webhook.id)"
                class="text-red-600 hover:text-red-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-500">
            <p>Última execução: {{ webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleString() : 'Nunca' }}</p>
            <p v-if="webhook.failureCount > 0" class="text-red-600">
              Falhas: {{ webhook.failureCount }}
            </p>
          </div>
        </li>
      </ul>
    </div>

    <!-- Modal de Webhook -->
    <div v-if="showModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h2 class="text-xl font-semibold mb-4">
          {{ editingWebhook ? 'Editar Webhook' : 'Novo Webhook' }}
        </h2>
        <form @submit.prevent="saveWebhook" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Nome</label>
            <input
              v-model="webhookForm.name"
              type="text"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">URL</label>
            <input
              v-model="webhookForm.url"
              type="url"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">Secret (Opcional)</label>
            <input
              v-model="webhookForm.secret"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Deixe em branco se não precisar de autenticação"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Eventos</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  v-model="webhookForm.events"
                  type="checkbox"
                  value="lead.created"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700">Lead Criado</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="webhookForm.events"
                  type="checkbox"
                  value="lead.updated"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700">Lead Atualizado</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="webhookForm.events"
                  type="checkbox"
                  value="exchange.alert.created"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700">Alerta de Câmbio Criado</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="webhookForm.events"
                  type="checkbox"
                  value="exchange.alert.updated"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700">Alerta de Câmbio Atualizado</span>
              </label>
            </div>
          </div>

          <div class="flex items-center">
            <input
              v-model="webhookForm.active"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label class="ml-2 text-sm text-gray-700">Ativo</label>
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {{ editingWebhook ? 'Atualizar' : 'Criar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { webhookService, type Webhook } from '@/services/webhookService';

const webhooks = ref<Webhook[]>([]);
const showModal = ref(false);
const editingWebhook = ref<string | null>(null);

const webhookForm = ref({
  name: '',
  url: '',
  secret: '',
  events: [] as string[],
  active: true
});

// Carregar webhooks
const loadWebhooks = async () => {
  webhooks.value = await webhookService.list();
};

// Abrir modal para novo webhook
const openModal = () => {
  editingWebhook.value = null;
  webhookForm.value = {
    name: '',
    url: '',
    secret: '',
    events: [],
    active: true
  };
  showModal.value = true;
};

// Abrir modal para editar webhook
const editWebhook = (webhook: Webhook) => {
  editingWebhook.value = webhook.id;
  webhookForm.value = {
    name: webhook.name,
    url: webhook.url,
    secret: webhook.secret,
    events: webhook.events,
    active: webhook.active
  };
  showModal.value = true;
};

// Fechar modal
const closeModal = () => {
  showModal.value = false;
  editingWebhook.value = null;
};

// Salvar webhook
const saveWebhook = async () => {
  try {
    if (editingWebhook.value) {
      await webhookService.update(editingWebhook.value, webhookForm.value);
    } else {
      await webhookService.create(webhookForm.value);
    }
    await loadWebhooks();
    closeModal();
  } catch (error) {
    console.error('Error saving webhook:', error);
    alert('Erro ao salvar webhook');
  }
};

// Excluir webhook
const deleteWebhook = async (id: string) => {
  if (confirm('Tem certeza que deseja excluir este webhook?')) {
    try {
      await webhookService.delete(id);
      await loadWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      alert('Erro ao excluir webhook');
    }
  }
};

// Carregar webhooks ao montar o componente
onMounted(loadWebhooks);
</script>
