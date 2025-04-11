<template>
  <div 
    class="flex items-center justify-center rounded-full overflow-hidden border"
    :class="[
      isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white',
      size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
    ]"
  >
    <img 
      :src="flagSrc"
      :alt="`Bandeira ${currencyName}`"
      class="w-full h-full object-cover"
      loading="lazy"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FLAGS, type CurrencyCode } from '@/constants/flags'

interface Props {
  code: CurrencyCode
  currencyName: string
  size?: 'sm' | 'md'
  isDark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  isDark: false
})

const flagSrc = computed(() => FLAGS[props.code])
</script>
