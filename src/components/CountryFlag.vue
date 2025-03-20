<template>
  <div class="flag-container" :title="countryName">
    <img :src="flagSrc" :alt="countryCode" class="flag-image" :class="{ 'small': size === 'small' }" />
    <span v-if="showCode" class="currency-code">{{ currencyCode }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  countryCode: string;
  size?: 'small' | 'normal';
  showCode?: boolean;
}>();

const flagMap: Record<string, { src: string, name: string, currency: string }> = {
  US: { 
    src: new URL('../assets/flags/us.svg', import.meta.url).href,
    name: 'United States',
    currency: 'USD'
  },
  BR: { 
    src: new URL('../assets/flags/br.svg', import.meta.url).href,
    name: 'Brazil',
    currency: 'BRL'
  },
  EU: { 
    src: new URL('../assets/flags/eu.svg', import.meta.url).href,
    name: 'European Union',
    currency: 'EUR'
  },
  GB: { 
    src: new URL('../assets/flags/gb.svg', import.meta.url).href,
    name: 'United Kingdom',
    currency: 'GBP'
  }
};

const flagSrc = computed(() => flagMap[props.countryCode]?.src);
const countryName = computed(() => flagMap[props.countryCode]?.name);
const currencyCode = computed(() => flagMap[props.countryCode]?.currency);
</script>

<style scoped>
.flag-container {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.flag-image {
  width: 32px;
  height: 24px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.flag-image.small {
  width: 24px;
  height: 18px;
}

.currency-code {
  font-weight: 500;
  color: inherit;
}
</style>
