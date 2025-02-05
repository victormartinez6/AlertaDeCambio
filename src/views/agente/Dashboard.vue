<template>
  <div class="space-y-6">
    <div class="md:flex md:items-center md:justify-between">
      <div class="min-w-0 flex-1">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Dashboard do Agente
        </h2>
      </div>
    </div>

    <!-- Cards de Estatísticas -->
    <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div class="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
        <dt>
          <div class="absolute rounded-md bg-primary-500 p-3">
            <BellAlertIcon class="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <p class="ml-16 truncate text-sm font-medium text-gray-500">Total de Alertas</p>
        </dt>
        <dd class="ml-16 flex items-baseline pb-6 sm:pb-7">
          <p class="text-2xl font-semibold text-gray-900">0</p>
        </dd>
      </div>

      <div class="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
        <dt>
          <div class="absolute rounded-md bg-primary-500 p-3">
            <UserGroupIcon class="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <p class="ml-16 truncate text-sm font-medium text-gray-500">Usuários Ativos</p>
        </dt>
        <dd class="ml-16 flex items-baseline pb-6 sm:pb-7">
          <p class="text-2xl font-semibold text-gray-900">0</p>
        </dd>
      </div>

      <div class="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
        <dt>
          <div class="absolute rounded-md bg-primary-500 p-3">
            <BoltIcon class="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <p class="ml-16 truncate text-sm font-medium text-gray-500">Alertas Disparados Hoje</p>
        </dt>
        <dd class="ml-16 flex items-baseline pb-6 sm:pb-7">
          <p class="text-2xl font-semibold text-gray-900">0</p>
        </dd>
      </div>
    </dl>

    <!-- Lista de Alertas Recentes -->
    <div class="bg-white shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-base font-semibold leading-6 text-gray-900">Alertas Recentes</h3>
        <div class="mt-4">
          <p class="text-sm text-gray-500">
            Nenhum alerta recente para exibir.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BellAlertIcon, UserGroupIcon, BoltIcon } from '@heroicons/vue/24/outline'
</script>
