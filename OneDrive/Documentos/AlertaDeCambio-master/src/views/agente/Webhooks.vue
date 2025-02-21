<template>
  <div class="space-y-8">
    <!-- Cabeçalho -->
    <div class="sm:flex sm:items-center pt-4">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-bold text-marinho">Webhooks</h1>
        <p class="mt-2 text-sm text-marinho/70">
          Configure URLs para receber notificações quando a cotação atingir o alvo.
        </p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <button
          type="button"
          @click="showAddModal = true"
          class="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          Adicionar Webhook
        </button>
      </div>
    </div>

    <!-- Lista de Webhooks -->
    <div class="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      <table class="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">URL</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Eventos</th>
            <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span class="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="webhook in webhooks" :key="webhook.id" class="group">
            <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
              {{ webhook.url }}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
              <div class="flex gap-2">
                <span
                  v-for="event in webhook.events"
                  :key="event"
                  class="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20"
                >
                  {{ event }}
                </span>
              </div>
            </td>
            <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
              <button
                @click="excluirWebhook(webhook.id)"
                class="text-red-600 hover:text-red-900"
              >
                Excluir<span class="sr-only">, {{ webhook.url }}</span>
              </button>
            </td>
          </tr>
          <tr v-if="webhooks.length === 0">
            <td colspan="3" class="py-4 text-center text-sm text-gray-500">
              Nenhum webhook configurado
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Adicionar Webhook -->
    <TransitionRoot as="template" :show="showAddModal">
      <Dialog as="div" class="relative z-10" @close="showAddModal = false">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div class="mt-3 text-center sm:mt-5">
                    <DialogTitle as="h3" class="text-base font-semibold leading-6 text-gray-900">
                      Adicionar Webhook
                    </DialogTitle>
                    <div class="mt-4">
                      <div class="space-y-4">
                        <!-- URL -->
                        <div>
                          <label for="url" class="block text-sm font-medium leading-6 text-gray-900">
                            URL
                          </label>
                          <div class="mt-2">
                            <input
                              type="url"
                              id="url"
                              v-model="novoWebhook.url"
                              class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                              placeholder="https://exemplo.com/webhook"
                            />
                          </div>
                        </div>

                        <!-- Eventos -->
                        <div>
                          <label class="block text-sm font-medium leading-6 text-gray-900">
                            Eventos
                          </label>
                          <div class="mt-2 space-y-2">
                            <div class="flex items-center">
                              <input
                                type="checkbox"
                                v-model="novoWebhook.events"
                                value="alert.created"
                                class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                              />
                              <label class="ml-2 text-sm text-gray-600">
                                Alerta Criado
                              </label>
                            </div>
                            <div class="flex items-center">
                              <input
                                type="checkbox"
                                v-model="novoWebhook.events"
                                value="alert.updated"
                                class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                              />
                              <label class="ml-2 text-sm text-gray-600">
                                Alerta Atualizado
                              </label>
                            </div>
                            <div class="flex items-center">
                              <input
                                type="checkbox"
                                v-model="novoWebhook.events"
                                value="alert.deleted"
                                class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                              />
                              <label class="ml-2 text-sm text-gray-600">
                                Alerta Excluído
                              </label>
                            </div>
                            <div class="flex items-center">
                              <input
                                type="checkbox"
                                v-model="novoWebhook.events"
                                value="alert.triggered"
                                class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                              />
                              <label class="ml-2 text-sm text-gray-600">
                                Alerta Disparado
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    class="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:col-start-2"
                    @click="adicionarWebhook"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    @click="showAddModal = false"
                  >
                    Cancelar
                  </button>
                </div>
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
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const webhooks = ref([])
const showAddModal = ref(false)
const novoWebhook = ref({
  url: '',
  events: []
})

// Carregar webhooks
const carregarWebhooks = async () => {
  try {
    console.log('=== INÍCIO DO CARREGAMENTO DE WEBHOOKS ===')
    console.log('Usuário:', {
      uid: authStore.user?.uid,
      email: authStore.user?.email
    })
    
    const q = query(
      collection(db, 'webhooks'),
      where('userId', '==', authStore.user?.uid)
    )
    
    console.log('Executando query...')
    const querySnapshot = await getDocs(q)
    console.log('Número de webhooks encontrados:', querySnapshot.size)
    
    webhooks.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log('Lista de webhooks carregada:', JSON.stringify(webhooks.value, null, 2))
    console.log('=== FIM DO CARREGAMENTO DE WEBHOOKS ===')
  } catch (error) {
    console.error('Erro ao carregar webhooks:', error)
    alert('Erro ao carregar webhooks. Tente novamente.')
  }
}

// Adicionar webhook
const adicionarWebhook = async () => {
  try {
    console.log('=== INÍCIO DA CRIAÇÃO DO WEBHOOK ===')
    console.log('Estado inicial do novoWebhook:', {
      url: novoWebhook.value.url,
      events: novoWebhook.value.events
    })
    console.log('Usuário:', {
      uid: authStore.user?.uid,
      email: authStore.user?.email
    })

    if (!novoWebhook.value.url) {
      alert('Por favor, insira uma URL válida')
      return
    }
    if (novoWebhook.value.events.length === 0) {
      alert('Por favor, selecione pelo menos um evento')
      return
    }

    const webhookData = {
      userId: authStore.user?.uid,
      url: novoWebhook.value.url,
      events: novoWebhook.value.events,
      criadoEm: new Date().toISOString()
    }
    
    console.log('Dados do webhook a serem salvos:', JSON.stringify(webhookData, null, 2))

    const docRef = await addDoc(collection(db, 'webhooks'), webhookData)
    console.log('Webhook salvo com sucesso!')
    console.log('ID do documento:', docRef.id)
    
    // Resetar form e fechar modal
    novoWebhook.value = {
      url: '',
      events: []
    }
    showAddModal.value = false

    // Recarregar lista
    console.log('Recarregando lista de webhooks...')
    await carregarWebhooks()
    console.log('Lista de webhooks atualizada:', JSON.stringify(webhooks.value, null, 2))
    console.log('=== FIM DA CRIAÇÃO DO WEBHOOK ===')
  } catch (error) {
    console.error('Erro ao adicionar webhook:', error)
    alert('Erro ao adicionar webhook. Tente novamente.')
  }
}

// Excluir webhook
const excluirWebhook = async (id: string) => {
  if (!confirm('Tem certeza que deseja excluir este webhook?')) return

  try {
    await deleteDoc(doc(db, 'webhooks', id))
    await carregarWebhooks()
  } catch (error) {
    console.error('Erro ao excluir webhook:', error)
    alert('Erro ao excluir webhook. Tente novamente.')
  }
}

// Carregar webhooks ao montar o componente
onMounted(carregarWebhooks)
</script>
