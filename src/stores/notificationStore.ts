import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
  timeout?: number
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    notifications.value.push(newNotification)

    if (notification.timeout !== undefined) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.timeout)
    }

    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const showSuccess = (title: string, message?: string, timeout = 3000) => {
    return addNotification({ type: 'success', title, message, timeout })
  }

  const showError = (title: string, message?: string, timeout = 5000) => {
    return addNotification({ type: 'error', title, message, timeout })
  }

  const showInfo = (title: string, message?: string, timeout = 3000) => {
    return addNotification({ type: 'info', title, message, timeout })
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showInfo
  }
})
