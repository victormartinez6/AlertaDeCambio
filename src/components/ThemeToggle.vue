<template>
  <button
    @click="toggleTheme"
    class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    :title="isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'"
  >
    <SunIcon v-if="isDark" class="h-5 w-5 text-gray-400" />
    <MoonIcon v-else class="h-5 w-5 text-gray-600" />
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const isDark = ref(props.modelValue)

const toggleTheme = () => {
  isDark.value = !isDark.value
  emit('update:modelValue', isDark.value)
}
</script>
