<template>
  <div class="space-y-6">
    <!-- URL do Webhook -->
    <div>
      <label for="webhook-url" class="block text-sm font-medium leading-6 text-gray-900">
        URL do Webhook
      </label>
      <div class="mt-2">
        <input
          type="url"
          name="webhook-url"
          id="webhook-url"
          v-model="webhookUrl"
          class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
          placeholder="https://exemplo.com/webhook"
        />
      </div>
      <p class="mt-2 text-sm text-gray-500">
        Esta URL receberá uma requisição POST quando a cotação atingir o alvo.
      </p>
    </div>

    <!-- Eventos -->
    <div>
      <label class="text-sm font-medium leading-6 text-gray-900">Eventos</label>
      <div class="mt-4 space-y-4">
        <div class="relative flex items-start">
          <div class="flex h-6 items-center">
            <input
              type="checkbox"
              v-model="eventos"
              value="alert.target_reached"
              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
            />
          </div>
          <div class="ml-3 text-sm leading-6">
            <label class="font-medium text-gray-900">Cotação Alvo Atingida</label>
            <p class="text-gray-500">Notificar quando a cotação atual atingir ou ficar abaixo da cotação alvo.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Botão Salvar -->
    <div class="flex justify-end">
      <button
        type="button"
        @click="salvarWebhook"
        class="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        Salvar Webhook
      </button>
    </div>

    <!-- Lista de Webhooks -->
    <div v-if="webhooks.length > 0" class="mt-8">
      <h3 class="text-sm font-medium leading-6 text-gray-900">Webhooks Configurados</h3>
      <ul role="list" class="mt-4 divide-y divide-gray-100">
        <li v-for="webhook in webhooks" :key="webhook.id" class="flex items-center justify-between gap-x-6 py-5">
          <div class="min-w-0">
            <div class="flex items-start gap-x-3">
              <p class="text-sm font-semibold leading-6 text-gray-900">{{ webhook.url }}</p>
            </div>
            <div class="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
              <p class="truncate">Eventos: {{ webhook.events.join(', ') }}</p>
            </div>
          </div>
          <div class="flex flex-none items-center gap-x-4">
            <button
              type="button"
              @click="excluirWebhook(webhook.id)"
              class="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Excluir
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const webhooks = ref([])
const webhookUrl = ref('')
const eventos = ref(['alert.target_reached'])

// Carregar webhooks
const carregarWebhooks = async () => {
  try {
    const q = query(
      collection(db, 'webhooks'),
      where('userId', '==', authStore.user.uid)
    )
    const querySnapshot = await getDocs(q)
    webhooks.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Erro ao carregar webhooks:', error)
    alert('Erro ao carregar webhooks. Tente novamente.')
  }
}

// Salvar webhook
const salvarWebhook = async () => {
  try {
    if (!webhookUrl.value) {
      alert('Por favor, insira uma URL válida')
      return
    }

    await addDoc(collection(db, 'webhooks'), {
      userId: authStore.user.uid,
      url: webhookUrl.value,
      events: eventos.value,
      criadoEm: new Date().toISOString()
    })

    // Resetar form
    webhookUrl.value = ''
    eventos.value = ['alert.target_reached']

    // Recarregar lista
    await carregarWebhooks()
  } catch (error) {
    console.error('Erro ao salvar webhook:', error)
    alert('Erro ao salvar webhook. Tente novamente.')
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
