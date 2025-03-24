<template>
  <nav class="flex space-x-8">
    <router-link
      v-for="item in navigation"
      :key="item.name"
      :to="item.href"
      class="text-sm font-semibold text-white hover:text-gray-100"
      :class="{ 'text-gray-200': item.href === currentRoute }"
    >
      {{ item.name }}
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const currentRoute = computed(() => route.path)

const navigation = [
  { name: 'Dashboard', href: '/agente/dashboard' },
  { name: 'Lista de Alertas', href: '/agente/alertas' },
  { name: 'Novo Alerta', href: '/agente/novo-alerta' },
  { name: 'Configurações', href: '/agente/configuracoes' }
]
</script>
