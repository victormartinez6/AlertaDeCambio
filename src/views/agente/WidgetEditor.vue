<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ isEditing ? 'Editar Widget' : 'Novo Widget' }}</h1>
      <router-link 
        to="/agente/widgets" 
        class="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
      >
        <ArrowLeftIcon class="h-5 w-5 mr-1.5" />
        Voltar para lista
      </router-link>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <!-- Nome do Widget -->
      <div class="mb-6">
        <label for="widget-name" class="block text-sm font-medium mb-2">Nome do Widget <span class="text-red-500">*</span></label>
        <input 
          id="widget-name" 
          v-model="widgetName" 
          type="text" 
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Ex: Widget para Site da Empresa X"
          :class="{'border-red-500': errors.nome}"
        >
        <p v-if="errors.nome" class="mt-1 text-sm text-red-500">{{ errors.nome }}</p>
      </div>
      
      <h2 class="text-xl font-semibold mb-4">Widget de Cotações</h2>
      <p class="mb-6">
        Configure o widget de cotações abaixo e obtenha o código para incorporá-lo em seu site.
      </p>
      
      <!-- Configurações do Widget -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 class="text-lg font-medium mb-4">Moedas <span class="text-red-500">*</span></h3>
          <p v-if="errors.moedas" class="mb-2 text-sm text-red-500">{{ errors.moedas }}</p>
          <div class="space-y-3 max-h-80 overflow-y-auto pr-2">
            <div v-for="(moeda, index) in moedas" :key="index" class="flex items-center space-x-2">
              <input 
                type="checkbox" 
                :id="`moeda-${moeda.codigo}`" 
                v-model="moeda.selecionada"
                class="rounded text-purple-600 focus:ring-purple-500"
                @change="handleMoedaSelecao(moeda)"
              >
              <label :for="`moeda-${moeda.codigo}`" class="flex items-center">
                <div class="relative mr-2 flex-shrink-0" v-if="configWidget.mostrarLogos">
                  <img 
                    :src="moeda.logo" 
                    :alt="moeda.codigo.split('/')[0]" 
                    class="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 z-10 relative"
                  >
                  <img 
                    :src="moeda.logoSecundario" 
                    :alt="moeda.codigo.split('/')[1]" 
                    class="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 absolute -bottom-1 -right-1"
                  >
                </div>
                {{ moeda.nome }} ({{ moeda.codigo }})
              </label>
              <div v-if="moeda.selecionada" class="flex items-center ml-2">
                <span class="text-sm text-gray-500 mr-2">Ordem:</span>
                <input 
                  type="number" 
                  v-model.number="moeda.ordem" 
                  min="1" 
                  :max="getMaxOrdem()" 
                  class="w-12 h-8 border rounded px-2 text-center"
                  @change="atualizarOrdensMoedas()"
                >
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 class="text-lg font-medium mb-4">Personalização</h3>
          
          <!-- Tema -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Tema</label>
            <div class="flex space-x-4">
              <label class="inline-flex items-center">
                <input 
                  type="radio" 
                  v-model="configWidget.tema" 
                  value="claro"
                  class="rounded-full text-purple-600 focus:ring-purple-500"
                >
                <span class="ml-2">Claro</span>
              </label>
              <label class="inline-flex items-center">
                <input 
                  type="radio" 
                  v-model="configWidget.tema" 
                  value="escuro"
                  class="rounded-full text-purple-600 focus:ring-purple-500"
                >
                <span class="ml-2">Escuro</span>
              </label>
            </div>
          </div>
          
          <!-- Cor de Fundo -->
          <div class="mb-4">
            <label for="cor-fundo" class="block text-sm font-medium mb-2">Cor de Fundo</label>
            <div class="flex items-center space-x-2">
              <input 
                type="color" 
                id="cor-fundo" 
                v-model="configWidget.corFundo"
                class="w-10 h-10 rounded border"
              >
              <input 
                type="text" 
                v-model="configWidget.corFundo"
                class="border rounded px-3 py-2 w-32"
                placeholder="#FFFFFF"
              >
            </div>
          </div>
          
          <!-- Fundo Transparente -->
          <div class="mb-4">
            <label class="inline-flex items-center">
              <input 
                type="checkbox" 
                v-model="configWidget.fundoTransparente"
                class="rounded text-purple-600 focus:ring-purple-500"
              >
              <span class="ml-2">Fundo Transparente</span>
            </label>
          </div>
          
          <!-- Mostrar Logos -->
          <div class="mb-4">
            <label class="inline-flex items-center">
              <input 
                type="checkbox" 
                v-model="configWidget.mostrarLogos"
                class="rounded text-purple-600 focus:ring-purple-500"
              >
              <span class="ml-2">Mostrar Logos</span>
            </label>
          </div>
          
          <!-- Mostrar Variação -->
          <div class="mb-4">
            <label class="inline-flex items-center">
              <input 
                type="checkbox" 
                v-model="configWidget.mostrarVariacao"
                class="rounded text-purple-600 focus:ring-purple-500"
              >
              <span class="ml-2">Mostrar Variação Percentual</span>
            </label>
          </div>
          
          <!-- Velocidade do Carrossel -->
          <div class="mb-4">
            <label for="velocidade-carrossel" class="block text-sm font-medium mb-2">Velocidade do Carrossel (segundos por ciclo)</label>
            <div class="flex items-center space-x-4">
              <input 
                type="range" 
                id="velocidade-carrossel" 
                v-model.number="configWidget.velocidadeCarrossel"
                min="30" 
                max="600" 
                step="30"
                class="w-48"
              >
              <span class="text-sm font-medium">{{ configWidget.velocidadeCarrossel }}s</span>
            </div>
          </div>
          
          <!-- Idioma -->
          <div class="mb-4">
            <label for="idioma" class="block text-sm font-medium mb-2">Idioma</label>
            <select 
              id="idioma" 
              v-model="configWidget.idioma"
              class="border rounded px-3 py-2 w-full"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
            </select>
          </div>
          
          <!-- Tamanho do Container -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Tamanho do Container</label>
            <div class="flex space-x-4">
              <label class="flex items-center">
                <input 
                  type="radio" 
                  v-model="configWidget.largura" 
                  value="100%" 
                  class="rounded-full text-purple-600 focus:ring-purple-500 mr-2"
                >
                <span>100% (Responsivo)</span>
              </label>
              <label class="flex items-center">
                <input 
                  type="radio" 
                  v-model="configWidget.largura" 
                  value="300px" 
                  class="rounded-full text-purple-600 focus:ring-purple-500 mr-2"
                >
                <span>300px</span>
              </label>
              <label class="flex items-center">
                <input 
                  type="radio" 
                  v-model="configWidget.largura" 
                  value="500px" 
                  class="rounded-full text-purple-600 focus:ring-purple-500 mr-2"
                >
                <span>500px</span>
              </label>
              <label class="flex items-center">
                <input 
                  type="radio" 
                  v-model="configWidget.largura" 
                  value="custom" 
                  class="rounded-full text-purple-600 focus:ring-purple-500 mr-2"
                >
                <span>Personalizado</span>
              </label>
            </div>
            <div v-if="configWidget.largura === 'custom'" class="mt-2">
              <input 
                type="text" 
                v-model="customWidth" 
                placeholder="Ex: 400px ou 80%" 
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                @input="updateCustomWidth"
              >
            </div>
          </div>
        </div>
      </div>
      
      <!-- Prévia do Widget -->
      <div class="mb-8">
        <h3 class="text-lg font-medium mb-4">Prévia</h3>
        <div 
          class="border rounded overflow-hidden" 
          :class="{'bg-transparent': configWidget.fundoTransparente}"
          :style="{ backgroundColor: configWidget.fundoTransparente ? 'transparent' : configWidget.corFundo, width: configWidget.largura === 'custom' ? customWidth : configWidget.largura }"
        >
          <!-- Usando iframe para renderizar o widget exatamente como será no site final -->
          <iframe 
            ref="previewIframe" 
            style="width: 100%; height: 70px; border: none; overflow: hidden;" 
            title="Prévia do Widget"
            scrolling="no"
          ></iframe>
        </div>
      </div>
      
      <!-- Código de Incorporação -->
      <div>
        <h3 class="text-lg font-medium mb-4">Código de Incorporação</h3>
        <div class="relative">
          <pre class="bg-gray-100 dark:bg-gray-900 rounded p-4 overflow-x-auto text-sm">{{ embedCode }}</pre>
          <button 
            @click="copiarCodigo" 
            class="absolute top-2 right-2 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {{ copiado ? 'Copiado!' : 'Copiar' }}
          </button>
        </div>
      </div>
      
      <!-- Botões de ação -->
      <div class="flex justify-end mt-8 space-x-4">
        <button 
          @click="cancelar" 
          class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button 
          @click="salvarWidget" 
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          :disabled="salvando"
        >
          <span v-if="salvando" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Salvando...
          </span>
          <span v-else>{{ isEditing ? 'Atualizar' : 'Salvar' }}</span>
        </button>
      </div>
    </div>
    
    <!-- Toast de notificação -->
    <div 
      v-if="notificacao.visivel" 
      class="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center"
    >
      <CheckCircleIcon v-if="notificacao.tipo === 'sucesso'" class="h-5 w-5 text-green-400 mr-2" />
      <ExclamationCircleIcon v-else class="h-5 w-5 text-red-400 mr-2" />
      {{ notificacao.mensagem }}
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon 
} from '@heroicons/vue/24/outline'
import { db } from '@/firebase/config'
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  serverTimestamp
} from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'WidgetEditor',
  components: {
    ArrowLeftIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    const widgetId = route.params.id
    const isEditing = computed(() => !!widgetId)
    const widgetName = ref('')
    const previewIframe = ref(null)
    const copiado = ref(false)
    const salvando = ref(false)
    const notificacao = ref({
      visivel: false,
      tipo: '',
      mensagem: ''
    })
    const errors = ref({
      nome: '',
      moedas: ''
    })
    
    const moedas = ref([
      { 
        codigo: 'USD/BRL', 
        nome: 'Dólar Americano', 
        selecionada: true, 
        valor: '5.2345', 
        variacao: 0.75,
        logo: 'https://flagcdn.com/w80/us.png',
        logoSecundario: 'https://flagcdn.com/w80/br.png',
        ordem: 1
      },
      { 
        codigo: 'EUR/BRL', 
        nome: 'Euro', 
        selecionada: true, 
        valor: '5.6789', 
        variacao: -0.32,
        logo: 'https://flagcdn.com/w80/eu.png',
        logoSecundario: 'https://flagcdn.com/w80/br.png',
        ordem: 2
      },
      { 
        codigo: 'GBP/BRL', 
        nome: 'Libra Esterlina', 
        selecionada: true, 
        valor: '6.7823', 
        variacao: 0.12,
        logo: 'https://flagcdn.com/w80/gb.png',
        logoSecundario: 'https://flagcdn.com/w80/br.png',
        ordem: 3
      },
      { 
        codigo: 'JPY/BRL', 
        nome: 'Iene Japonês', 
        selecionada: false, 
        valor: '0.0354', 
        variacao: -0.15,
        logo: 'https://flagcdn.com/w80/jp.png',
        logoSecundario: 'https://flagcdn.com/w80/br.png',
        ordem: 0
      },
      { 
        codigo: 'CAD/BRL', 
        nome: 'Dólar Canadense', 
        selecionada: false, 
        valor: '3.8547', 
        variacao: 0.28,
        logo: 'https://flagcdn.com/w80/ca.png',
        logoSecundario: 'https://flagcdn.com/w80/br.png',
        ordem: 0
      },
      { 
        codigo: 'AUD/BRL', 
        nome: 'Dólar Australiano', 
        selecionada: false, 
        valor: '3.4521', 
        variacao: -0.10,
        logo: 'https://flagcdn.com/w80/au.png',
        logoSecundario: 'https://flagcdn.com/w80/br.png',
        ordem: 0
      },
      { 
        codigo: 'CHF/BRL', 
        nome: 'Franco Suíço', 
        selecionada: false, 
        valor: '5.9876', 
        variacao: 0.10,
        logo: 'https://flagcdn.com/w80/ch.png',
        logoSecundario: 'https://flagcdn.com/w80/br.png',
        ordem: 0
      },
      { 
        codigo: 'CNY/BRL', 
        nome: 'Yuan Chinês', 
        selecionada: false, 
        valor: '0.7532', 
        variacao: 0.05,
        logo: 'https://flagcdn.com/w80/cn.png',
        logoSecundario: 'https://flagcdn.com/w80/br.png',
        ordem: 0
      },
      { 
        codigo: 'ARS/BRL', 
        nome: 'Peso Argentino', 
        selecionada: false, 
        valor: '0.0123', 
        variacao: 0.50,
        logo: 'https://flagcdn.com/w80/ar.png',
        logoSecundario: 'https://flagcdn.com/w80/br.png',
        ordem: 0
      },
      { 
        codigo: 'BTC/USD', 
        nome: 'Bitcoin', 
        selecionada: true, 
        valor: '63245.7812', 
        variacao: 2.45,
        logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/btc.png',
        logoSecundario: 'https://flagcdn.com/w80/us.png',
        ordem: 4
      },
      { 
        codigo: 'ETH/USD', 
        nome: 'Ethereum', 
        selecionada: true, 
        valor: '3456.9231', 
        variacao: 1.23,
        logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png',
        logoSecundario: 'https://flagcdn.com/w80/us.png',
        ordem: 5
      },
      { 
        codigo: 'XRP/USD', 
        nome: 'Ripple', 
        selecionada: false, 
        valor: '0.5043', 
        variacao: -0.50,
        logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/xrp.png',
        logoSecundario: 'https://flagcdn.com/w80/us.png',
        ordem: 0
      },
      { 
        codigo: 'LTC/USD', 
        nome: 'Litecoin', 
        selecionada: false, 
        valor: '80.5432', 
        variacao: 0.35,
        logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/ltc.png',
        logoSecundario: 'https://flagcdn.com/w80/us.png',
        ordem: 0
      },
      { 
        codigo: 'DOGE/USD', 
        nome: 'Dogecoin', 
        selecionada: false, 
        valor: '0.1234', 
        variacao: 1.20,
        logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/doge.png',
        logoSecundario: 'https://flagcdn.com/w80/us.png',
        ordem: 0
      },
      { 
        codigo: 'BTC/BRL', 
        nome: 'Bitcoin (BRL)', 
        selecionada: false, 
        valor: '320456.78', 
        variacao: 1.50,
        logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/btc.png',
        logoSecundario: 'https://flagcdn.com/w80/br.png',
        ordem: 0
      },
      { 
        codigo: 'ETH/BRL', 
        nome: 'Ethereum (BRL)', 
        selecionada: false, 
        valor: '17654.32', 
        variacao: 0.95,
        logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png',
        logoSecundario: 'https://flagcdn.com/w80/br.png',
        ordem: 0
      }
    ])
    
    const configWidget = ref({
      tema: 'claro',
      corFundo: '#FFFFFF',
      fundoTransparente: false,
      mostrarLogos: true,
      mostrarVariacao: true,
      idioma: 'pt-BR',
      largura: '100%', // Largura padrão do container
      velocidadeCarrossel: 40 // Velocidade padrão do carrossel
    })
    
    // Variável para largura personalizada
    const customWidth = ref('400px')
    
    const moedasSelecionadas = computed(() => {
      return moedas.value.filter(moeda => moeda.selecionada).sort((a, b) => a.ordem - b.ordem)
    })
    
    // Função para obter a URL do script do widget
    function getScriptUrl() {
      // Determina a URL base do script (local para desenvolvimento, URL personalizada para produção)
      const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? window.location.origin 
        : 'https://alerta.cambiohoje.com.br';
      
      return `${baseUrl}/widgets/ticker.js`;
    }
    
    const embedCode = computed(() => {
      // Gera o código de incorporação com base nas configurações
      const moedasParam = moedasSelecionadas.value.map(m => m.codigo).join(',');
      
      // Determina a URL base do script (local para desenvolvimento, URL personalizada para produção)
      const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? window.location.origin 
        : 'https://alerta.cambiohoje.com.br';
      
      // Configurações do widget em formato JSON
      const configJSON = JSON.stringify({
        symbols: moedasParam,
        theme: configWidget.value.tema === 'escuro' ? 'dark' : 'light',
        bgColor: configWidget.value.fundoTransparente ? 'transparent' : configWidget.value.corFundo,
        showLogos: configWidget.value.mostrarLogos,
        showVariation: configWidget.value.mostrarVariacao,
        width: configWidget.value.largura === 'custom' ? customWidth.value : configWidget.value.largura,
        lang: configWidget.value.idioma,
        carouselSpeed: configWidget.value.velocidadeCarrossel
      }, null, 6).replace(/"([^"]+)":/g, '$1:').replace(/"/g, "'");
      
      // Código HTML escapado para evitar problemas com o Vue
      return [
        '<!DOCTYPE html>',
        '<html lang="pt-BR">',
        '',
        '<head>',
        '  <meta charset="UTF-8">',
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '  <title>Widget Alerta de Câmbio</title>',
        '</head>',
        '',
        '<body>',
        '  <!-- Alerta de Câmbio Widget BEGIN -->',
        '  <div class="alerta-cambio-widget-container" style="max-width: 100%; margin: 0 auto;">',
        '    <div id="alerta-cambio-widget" style="width: 100%;"></div>',
        '    <div class="alerta-cambio-widget-copyright"',
        '      style="font-size: 10px; text-align: right; margin-top: 4px; opacity: 0.6;">',
        '      <a href="' + getScriptUrl() + '" rel="noopener nofollow"',
        '        target="_blank" style="color: #6B7280; text-decoration: none;">',
        '        <span>Powered by Cambio Hoje</span>',
        '      </a>',
        '    </div>',
        '    <!-- Primeiro carrega o script -->',
        '    <script type="text/javascript" src="' + getScriptUrl() + '"><\/script>',
        '    <!-- Depois inicializa com as configurações -->',
        '    <script type="text/javascript">',
        '      // Inicializa imediatamente, sem esperar pelo DOMContentLoaded',
        '      AlertaCambioWidget.init(' + configJSON + ');',
        '    <\/script>',
        '  </div>',
        '  <!-- Alerta de Câmbio Widget END -->',
        '</body>',
        '',
        '</html>'
      ]
    })
    
    function copiarCodigo() {
      navigator.clipboard.writeText(embedCode.value.join('\n'))
        .then(() => {
          copiado.value = true
          setTimeout(() => {
            copiado.value = false
          }, 2000)
        })
        .catch(err => {
          console.error('Erro ao copiar: ', err)
        })
    }
    
    function handleMoedaSelecao(moeda) {
      if (moeda.selecionada) {
        // Se a moeda foi selecionada, atribuir a próxima ordem disponível
        const maxOrdem = getMaxOrdem();
        moeda.ordem = maxOrdem;
      } else {
        // Se a moeda foi desselecionada, reorganizar as ordens das moedas restantes
        atualizarOrdensMoedas();
      }
      
      // Não precisamos chamar iniciarTicker() aqui, pois o watcher já vai fazer isso
    }
    
    function buscarCotacoes() {
      // Simulação de busca de cotações
      // Em produção, substituir por chamada à API
      console.log('Buscando cotações...')
      
      // Aqui seria feita a chamada à API AwesomeAPI
      // Exemplo: https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL
    }
    
    async function carregarWidget() {
      if (!isEditing.value) return
      
      try {
        const widgetDoc = await getDoc(doc(db, 'widgets', widgetId))
        
        if (widgetDoc.exists()) {
          const widgetData = widgetDoc.data()
          widgetName.value = widgetData.nome
          
          // Carrega configurações
          if (widgetData.config) {
            configWidget.value = widgetData.config
          }
          
          // Carrega moedas
          if (widgetData.moedas && Array.isArray(widgetData.moedas)) {
            // Mantém as definições de moedas, mas atualiza as seleções
            const moedasMap = new Map(widgetData.moedas.map(m => [m.codigo, m]))
            
            moedas.value = moedas.value.map(moeda => {
              const savedMoeda = moedasMap.get(moeda.codigo)
              if (savedMoeda) {
                return {
                  ...moeda,
                  selecionada: savedMoeda.selecionada,
                  ordem: savedMoeda.ordem
                }
              }
              return moeda
            })
          }
        }
      } catch (error) {
        console.error('Erro ao carregar widget:', error)
      }
    }
    
    async function salvarWidget() {
      console.log('Iniciando salvamento do widget...')
      
      if (!authStore.user) {
        console.error('Usuário não autenticado')
        notificacao.value.visivel = true
        notificacao.value.tipo = 'erro'
        notificacao.value.mensagem = 'Você precisa estar autenticado para salvar um widget.'
        setTimeout(() => {
          notificacao.value.visivel = false
        }, 3000)
        return
      }
      
      // Validação
      errors.value.nome = widgetName.value.trim() === '' ? 'O nome do widget é obrigatório' : ''
      errors.value.moedas = moedasSelecionadas.value.length === 0 ? 'Selecione pelo menos uma moeda' : ''
      
      if (errors.value.nome || errors.value.moedas) {
        console.log('Erros de validação:', errors.value)
        return
      }
      
      salvando.value = true
      console.log('Preparando dados para salvar...')
      
      try {
        const widgetData = {
          nome: widgetName.value,
          userId: authStore.user.uid,
          criadoEm: serverTimestamp(),
          config: configWidget.value,
          moedas: moedas.value.map(m => ({
            codigo: m.codigo,
            selecionada: m.selecionada,
            ordem: m.ordem
          }))
        }
        
        console.log('Dados do widget:', widgetData)
        
        if (isEditing.value) {
          // Atualiza widget existente
          console.log('Atualizando widget existente:', widgetId)
          const docRef = doc(db, 'widgets', widgetId)
          await updateDoc(docRef, {
            ...widgetData,
            atualizadoEm: serverTimestamp()
          })
          console.log('Widget atualizado com sucesso')
        } else {
          // Cria novo widget
          console.log('Criando novo widget')
          const widgetsRef = collection(db, 'widgets')
          const newDocRef = doc(widgetsRef)
          await setDoc(newDocRef, widgetData)
          console.log('Novo widget criado com ID:', newDocRef.id)
        }
        
        // Exibe notificação de sucesso
        notificacao.value.visivel = true
        notificacao.value.tipo = 'sucesso'
        notificacao.value.mensagem = 'Widget salvo com sucesso!'
        
        setTimeout(() => {
          notificacao.value.visivel = false
          // Redireciona para a lista de widgets após a notificação
          router.push('/agente/widgets')
        }, 2000)
      } catch (error) {
        console.error('Erro ao salvar widget:', error)
        
        // Exibe notificação de erro
        notificacao.value.visivel = true
        notificacao.value.tipo = 'erro'
        notificacao.value.mensagem = `Erro ao salvar widget: ${error.message || 'Tente novamente.'}`
        setTimeout(() => {
          notificacao.value.visivel = false
        }, 3000)
      } finally {
        salvando.value = false
      }
    }
    
    function cancelar() {
      router.push('/agente/widgets')
    }
    
    function getMaxOrdem() {
      const total = moedas.value.filter(m => m.selecionada).length
      return total > 0 ? total : 1
    }
    
    function atualizarOrdensMoedas() {
      // Obtém as moedas selecionadas
      const selecionadas = moedas.value.filter(m => m.selecionada)
      
      // Se não houver moedas selecionadas, não faz nada
      if (selecionadas.length === 0) return
      
      // Ordena as moedas pela ordem atual
      const ordenadas = [...selecionadas].sort((a, b) => a.ordem - b.ordem)
      
      // Redefine as ordens para garantir sequência contínua (1, 2, 3, ...)
      ordenadas.forEach((moeda, index) => {
        moeda.ordem = index + 1
      })
    }
    
    function resetCarouselAnimation() {
      // Espera o DOM ser atualizado
      nextTick(() => {
        const carouselTrack = document.querySelector('.carousel-track');
        if (carouselTrack) {
          // Força um reflow para reiniciar a animação
          carouselTrack.style.animationName = 'none';
          void carouselTrack.offsetWidth; // Força um reflow
          carouselTrack.style.animationName = 'carousel';
        }
      });
    }
    
    function updateCustomWidth() {
      // Validação básica para garantir que o valor seja válido
      const value = customWidth.value.trim()
      if (value.match(/^\d+(%|px|em|rem|vw)$/)) {
        // Valor válido, não faz nada
      } else {
        // Adiciona 'px' se for apenas um número
        if (value.match(/^\d+$/)) {
          customWidth.value = `${value}px`
        }
      }
    }
    
    function updatePreviewIframe() {
      // Obtém os símbolos das moedas selecionadas
      const selectedSymbols = moedasSelecionadas.value.map(m => m.codigo).join(',');
      
      // Gera o conteúdo HTML para o iframe
      let htmlContent = '<!DOCTYPE html><html><head>';
      htmlContent += '<meta charset="UTF-8">';
      htmlContent += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
      htmlContent += '<title>Prévia do Widget</title>';
      htmlContent += '<style>';
      htmlContent += 'body { margin: 0; padding: 0; overflow: hidden; ';
      htmlContent += 'background: ' + (configWidget.value.fundoTransparente ? 'transparent' : configWidget.value.corFundo) + '; }';
      htmlContent += '</style>';
      htmlContent += '</head><body>';
      htmlContent += '<div id="alerta-cambio-widget"></div>';
      
      // Adiciona um script para capturar erros
      htmlContent += '<script>';
      htmlContent += 'window.onerror = function(message, source, lineno, colno, error) {';
      htmlContent += '  console.error("Erro no iframe:", message, "em", source, "linha:", lineno);';
      htmlContent += '  document.getElementById("alerta-cambio-widget").innerHTML = "<div style=\'color:red;padding:10px;\'>Erro ao carregar widget: " + message + "</div>";';
      htmlContent += '  return true;';
      htmlContent += '};';
      htmlContent += '<\/script>';
      
      htmlContent += '<script>';
      htmlContent += 'window.alertaCambioConfig = {';
      htmlContent += 'container: "alerta-cambio-widget",';
      htmlContent += 'symbols: "' + selectedSymbols + '",';
      htmlContent += 'theme: "' + (configWidget.value.tema === 'escuro' ? 'dark' : 'light') + '",';
      htmlContent += 'bgColor: "' + (configWidget.value.fundoTransparente ? 'transparent' : configWidget.value.corFundo) + '",';
      htmlContent += 'showLogos: ' + configWidget.value.mostrarLogos + ',';
      htmlContent += 'showVariation: ' + configWidget.value.mostrarVariacao + ',';
      htmlContent += 'lang: "' + configWidget.value.idioma + '",';
      htmlContent += 'carouselSpeed: ' + configWidget.value.velocidadeCarrossel + ',';
      htmlContent += 'debug: true';  // Ativa o modo de depuração
      htmlContent += '};';
      htmlContent += '<\/script>';
      
      // Adiciona um script para verificar se o script foi carregado
      htmlContent += '<script>';
      htmlContent += 'function verificarScript() {';
      htmlContent += '  if (typeof AlertaCambioWidget === "undefined") {';
      htmlContent += '    console.error("Erro: AlertaCambioWidget não foi carregado");';
      htmlContent += '    document.getElementById("alerta-cambio-widget").innerHTML = "<div style=\'color:red;padding:10px;\'>Erro: O script do widget não foi carregado corretamente.<\/div>";';
      htmlContent += '  } else {';
      htmlContent += '    console.log("AlertaCambioWidget carregado com sucesso");';
      htmlContent += '  }';
      htmlContent += '}';
      htmlContent += 'setTimeout(verificarScript, 2000);';
      htmlContent += '<\/script>';
      
      const scriptUrl = getScriptUrl();
      htmlContent += '<script src="' + scriptUrl + '" onerror="console.error(\'Erro ao carregar o script: ' + scriptUrl + '\');"><\/script>';
      htmlContent += '<\/body><\/html>';
      
      nextTick(() => {
        try {
          const iframe = previewIframe.value;
          if (iframe) {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(htmlContent);
            iframeDoc.close();
            
            // Ajusta a altura do iframe após o carregamento
            setTimeout(() => {
              try {
                if (iframe.contentWindow.document.body) {
                  const height = iframe.contentWindow.document.body.scrollHeight;
                  iframe.style.height = (height + 5) + 'px'; // Adiciona um pequeno espaço extra
                }
              } catch (e) {
                console.error('Erro ao ajustar altura do iframe:', e);
              }
            }, 300);
          }
        } catch (error) {
          console.error('Erro ao atualizar prévia do iframe:', error);
        }
      });
    }
    
    let watcherTimeout = null;
    let updateInterval = null;
    
    // Observa mudanças nas moedas selecionadas
    watch(moedasSelecionadas, () => {
      if (watcherTimeout) {
        clearTimeout(watcherTimeout);
      }
      
      watcherTimeout = setTimeout(() => {
        updatePreviewIframe();
      }, 100);
    }, { deep: true })
    
    // Observa mudanças nas configurações do widget
    watch(configWidget, (newVal, oldVal) => {
      if (watcherTimeout) {
        clearTimeout(watcherTimeout);
      }
      
      watcherTimeout = setTimeout(() => {
        updatePreviewIframe();
      }, 100);
    }, { deep: true })
    
    onMounted(() => {
      carregarWidget()
      
      // Buscar cotações na montagem
      setTimeout(() => {
        buscarCotacoes()
      }, 500)
      
      // Inicializa a prévia do iframe
      updatePreviewIframe();
      
      // Configura a atualização periódica a cada 10 segundos
      updateInterval = setInterval(() => {
        // Apenas atualiza o iframe, sem recriar todo o conteúdo
        const iframe = previewIframe.value;
        if (iframe && iframe.contentWindow) {
          try {
            // Envia uma mensagem para o iframe atualizar as cotações
            // Inclui os símbolos selecionados na mensagem
            const selectedSymbols = moedasSelecionadas.value.map(m => m.codigo).join(',');
            iframe.contentWindow.postMessage({
              action: 'updateQuotes',
              symbols: selectedSymbols
            }, '*');
          } catch (e) {
            console.error('Erro ao enviar mensagem para o iframe:', e);
          }
        }
      }, 10000); // 10 segundos
    })
    
    onUnmounted(() => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    })
    
    return {
      widgetName,
      isEditing,
      moedas,
      configWidget,
      moedasSelecionadas,
      embedCode,
      copiado,
      previewIframe,
      copiarCodigo,
      salvarWidget,
      cancelar,
      salvando,
      notificacao,
      errors,
      getMaxOrdem,
      atualizarOrdensMoedas,
      handleMoedaSelecao,
      customWidth,
      updateCustomWidth,
      updatePreviewIframe
    }
  }
}
</script>

<style scoped>
.ticker-widget {
  overflow: hidden;
  width: 100%;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border-radius: 8px;
  padding: 8px;
}

.ticker-widget.dark {
  color: #fff;
}

.ticker-widget.light {
  color: #333;
}

/* Estilos do carrossel */
.carousel-container {
  position: relative;
  overflow: hidden;
  height: 64px;
  display: flex;
  align-items: center;
}

.carousel-track {
  display: inline-flex;
  position: absolute;
  white-space: nowrap;
  will-change: transform;
  animation-name: carousel;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  gap: 8px;
  align-items: center;
}

@keyframes carousel {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.carousel-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-right: 8px;
  border-radius: 8px;
  min-width: 200px;
  width: auto;
  height: 48px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.dark .carousel-item {
  background-color: rgba(255, 255, 255, 0.1);
}

.light .carousel-item {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
