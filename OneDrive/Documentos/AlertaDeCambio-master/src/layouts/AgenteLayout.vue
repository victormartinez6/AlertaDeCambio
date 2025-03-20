<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Conteúdo principal -->
    <main>
      <div class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  UserIcon,
  ArrowLeftOnRectangleIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()

const navigation = [
  { name: 'Alertas', href: '/agente/alertas', icon: BellIcon },
  { name: 'Configurações', href: '/agente/configuracoes', icon: Cog6ToothIcon }
]

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})
</script>
