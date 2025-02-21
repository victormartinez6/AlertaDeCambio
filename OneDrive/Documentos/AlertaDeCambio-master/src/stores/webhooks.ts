import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/config/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore'
import { useAuthStore } from './auth'

export interface Webhook {
  id?: string
  userId: string
  name: string
  url: string
  events: string[]
  createdAt: Date
  updatedAt: Date
}

export const useWebhooksStore = defineStore('webhooks', () => {
  const webhooks = ref<Webhook[]>([])
  const loading = ref(false)
  const error = ref(null)
  const authStore = useAuthStore()

  async function fetchWebhooks() {
    try {
      loading.value = true
      error.value = null

      const q = query(
        collection(db, 'webhooks'),
        where('userId', '==', authStore.user?.uid)
      )
      
      const querySnapshot = await getDocs(q)
      webhooks.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Webhook[]
    } catch (err) {
      console.error('Erro ao buscar webhooks:', err)
      error.value = err
    } finally {
      loading.value = false
    }
  }

  async function createWebhook(webhook: Partial<Webhook>) {
    try {
      loading.value = true
      error.value = null

      const newWebhook: Omit<Webhook, 'id'> = {
        userId: authStore.user?.uid,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const docRef = await addDoc(collection(db, 'webhooks'), newWebhook)
      
      webhooks.value.push({
        id: docRef.id,
        ...newWebhook
      })

      return docRef.id
    } catch (err) {
      console.error('Erro ao criar webhook:', err)
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateWebhook(id: string, webhook: Partial<Webhook>) {
    try {
      loading.value = true
      error.value = null

      const updateData = {
        ...webhook,
        updatedAt: new Date()
      }

      const docRef = doc(db, 'webhooks', id)
      await updateDoc(docRef, updateData)

      const index = webhooks.value.findIndex(w => w.id === id)
      if (index !== -1) {
        webhooks.value[index] = {
          ...webhooks.value[index],
          ...updateData
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar webhook:', err)
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteWebhook(id: string) {
    try {
      loading.value = true
      error.value = null

      const docRef = doc(db, 'webhooks', id)
      await deleteDoc(docRef)

      webhooks.value = webhooks.value.filter(w => w.id !== id)
    } catch (err) {
      console.error('Erro ao deletar webhook:', err)
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    webhooks,
    loading,
    error,
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook
  }
})
