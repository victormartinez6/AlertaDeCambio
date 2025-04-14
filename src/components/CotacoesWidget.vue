<template>
  <div class="cotacoes-widget-container">
    <div ref="widgetContainer" id="alerta-cambio-widget" style="width: 100%;"></div>
    <div class="alerta-cambio-widget-copyright"
      style="font-size: 10px; text-align: right; margin-top: 4px; opacity: 0.6;">
      <a :href="scriptUrl" rel="noopener nofollow"
        target="_blank" style="color: #6B7280; text-decoration: none;">
        <span>Powered by Cambio Hoje</span>
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const props = defineProps({
  symbols: {
    type: String,
    default: 'USD/BRL,EUR/BRL,GBP/BRL,CAD/BRL,JPY/BRL,AUD/BRL,CHF/BRL,CNY/BRL,ARS/BRL,ETH/USD,BTC/USD,BTC/BRL'
  },
  theme: {
    type: String,
    default: 'light'
  },
  bgColor: {
    type: String,
    default: '#FFFFFF'
  },
  showLogos: {
    type: Boolean,
    default: true
  },
  showVariation: {
    type: Boolean,
    default: true
  },
  width: {
    type: String,
    default: '100%'
  },
  lang: {
    type: String,
    default: 'pt-BR'
  },
  carouselSpeed: {
    type: Number,
    default: 300
  }
});

const widgetContainer = ref(null);

// Determina a URL do script com base no ambiente
const scriptUrl = computed(() => {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocalhost 
    ? `${window.location.origin}/widgets/ticker.js` 
    : 'https://alerta.cambiohoje.com.br/widgets/ticker.js';
});

onMounted(() => {
  // Carrega o script dinamicamente
  const script = document.createElement('script');
  script.src = scriptUrl.value;
  script.async = true;
  
  script.onload = () => {
    // Inicializa o widget quando o script for carregado
    if (window.AlertaCambioWidget && typeof window.AlertaCambioWidget.init === 'function') {
      window.AlertaCambioWidget.init({
        container: 'alerta-cambio-widget',
        symbols: props.symbols,
        theme: props.theme,
        bgColor: props.bgColor,
        showLogos: props.showLogos,
        showVariation: props.showVariation,
        width: props.width,
        lang: props.lang,
        carouselSpeed: props.carouselSpeed
      });
    } else {
      console.error('AlertaCambioWidget não foi carregado corretamente');
    }
  };
  
  script.onerror = () => {
    console.error('Erro ao carregar o script do widget de cotações');
  };
  
  document.head.appendChild(script);
});
</script>

<style scoped>
.cotacoes-widget-container {
  max-width: 100%;
  margin: 0 auto;
}
</style>
