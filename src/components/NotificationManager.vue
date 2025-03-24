<template>
  <div
    aria-live="assertive"
    class="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-50"
  >
    <div class="flex w-full flex-col items-center space-y-4 sm:items-end">
      <Notification
        v-for="notification in notifications"
        :key="notification.id"
        :show="true"
        :type="notification.type"
        :title="notification.title"
        :message="notification.message"
        @close="removeNotification(notification.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '../stores/notificationStore'
import Notification from './Notification.vue'

const store = useNotificationStore()
const { notifications } = storeToRefs(store)
const { removeNotification } = store
</script>
