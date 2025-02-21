<template>
  <div class="currency-exchange p-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <GlowCard
        v-for="pair in currencyPairs"
        :key="pair.pair"
        :currency-pair="pair.pair"
        :current-rate="pair.currentRate"
        :variation="pair.variation"
        :historical-data="pair.historicalData"
        class="w-full"
      />
    </div>

    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-bold mb-6 flex items-center gap-2">
        <svg class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Cadastrar Alerta de Câmbio
      </h2>
      
      <form @submit.prevent="createAlert" class="space-y-4">
        <!-- Primeira linha: Dados pessoais -->
        <div class="grid grid-cols-3 gap-4">
          <div class="relative">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input 
                type="text" 
                v-model="newAlert.name"
                @input="filterLeads(newAlert.name, 'name')"
                @focus="filterLeads(newAlert.name, 'name')"
                required
                class="pl-10 w-full border rounded-md p-2 focus:ring-primary-300 focus:border-primary-300 focus:outline-none"
                placeholder="Digite seu nome completo"
              >
              <!-- Lista de sugestões -->
              <div v-if="showLeadSuggestions && filteredLeads.length > 0" 
                   class="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                <ul class="py-1">
                  <li v-for="lead in filteredLeads" 
                      :key="lead.id"
                      @click="selectLead(lead)"
                      class="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    {{ lead.name }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="relative">
            <label class="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input 
                type="email" 
                v-model="newAlert.email"
                @input="filterLeads(newAlert.email, 'email')"
                @focus="filterLeads(newAlert.email, 'email')"
                required
                class="pl-10 w-full border rounded-md p-2 focus:ring-primary-300 focus:border-primary-300 focus:outline-none"
                placeholder="seu@email.com"
              >
              <!-- Lista de sugestões -->
              <div v-if="showLeadSuggestions && filteredLeads.length > 0" 
                   class="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                <ul class="py-1">
                  <li v-for="lead in filteredLeads" 
                      :key="lead.id"
                      @click="selectLead(lead)"
                      class="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    {{ lead.email }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="relative">
            <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <div class="flex gap-2">
              <div class="relative w-24">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-gray-400">+</span>
                </div>
                <input 
                  type="text" 
                  v-model="newAlert.ddi"
                  required
                  class="pl-6 w-full border rounded-md p-2 focus:ring-primary-300 focus:border-primary-300 focus:outline-none"
                  placeholder="55"
                  maxlength="3"
                >
              </div>
              <div class="relative flex-1">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input 
                  type="tel" 
                  id="phone-input"
                  v-model="newAlert.whatsapp"
                  required
                  class="pl-10 w-full border rounded-md p-2 focus:ring-primary-300 focus:border-primary-300 focus:outline-none"
                  placeholder="(99) 99999-9999"
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Segunda linha: Configurações do alerta -->
        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Receber Notificações</label>
            <div class="space-y-3">
              <!-- Canais de notificação -->
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="newAlert.notificationChannels"
                    value="email"
                    class="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  >
                  <span class="flex items-center gap-1">
                    <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    E-mail
                  </span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="newAlert.notificationChannels"
                    value="whatsapp"
                    class="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  >
                  <span class="flex items-center gap-1">
                    <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    WhatsApp
                  </span>
                </label>
              </div>

              <!-- Frequência de notificação -->
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    v-model="newAlert.notificationType"
                    value="target"
                    class="w-4 h-4 text-primary-500 border-gray-300 focus:ring-primary-500"
                  >
                  <span class="flex items-center gap-1">
                    <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Apenas quando atingir a cotação
                  </span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    v-model="newAlert.notificationType"
                    value="daily"
                    class="w-4 h-4 text-primary-500 border-gray-300 focus:ring-primary-500"
                  >
                  <span class="flex items-center gap-1">
                    <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Receber cotação diariamente
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div class="relative">
            <label class="block text-sm font-medium text-gray-700 mb-1">Cotação Desejada</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-400">R$</span>
              </div>
              <input 
                type="text" 
                v-model="newAlert.targetRate"
                required
                class="pl-10 w-full border rounded-md p-2 focus:ring-primary-300 focus:border-primary-300 focus:outline-none"
                placeholder="0,00"
                @input="handleTargetRateInput"
              >
            </div>
          </div>

          <div class="relative">
            <label class="block text-sm font-medium text-gray-700 mb-1">Válido Até</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input 
                type="date" 
                v-model="newAlert.validUntil"
                required
                :min="minDate"
                class="pl-10 w-full border rounded-md p-2 focus:ring-primary-300 focus:border-primary-300 focus:outline-none"
              >
            </div>
          </div>
        </div>

        <!-- Botões -->
        <div class="flex justify-end gap-4">
          <button 
            type="button"
            @click="resetForm"
            class="px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Limpar
          </button>
          <button 
            type="submit"
            class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Cadastrar Alerta
          </button>
        </div>
      </form>
    </div>

    <!-- Lista de Alertas Ativos -->
    <div v-if="alerts.length > 0" class="mt-8">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Alertas Ativos
      </h3>
      <div class="grid gap-4">
        <div 
          v-for="alert in alerts" 
          :key="alert.id"
          class="bg-gray-50 p-4 rounded-lg flex justify-between items-start"
        >
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ alert.name }}</span>
              <span class="text-sm text-gray-500">
                (+{{ alert.ddi }}) {{ alert.whatsapp }}
              </span>
            </div>
            <div class="text-sm text-gray-600">
              {{ alert.pair }} <span class="font-medium">Cotação Desejada:</span> {{ formatCurrency(alert.targetRate) }}
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-500">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Válido até {{ formatDate(alert.validUntil) }}
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Via {{ alert.notificationChannels.join(' e ') }}
              </span>
            </div>
          </div>
          <button 
            @click="removeAlert(alert.id)"
            class="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import GlowCard from '../components/GlowCard.vue';
import { useLeadsStore } from '../stores/leads';
import IMask from 'imask';
import { getCurrentExchangeRate, getHistoricalRates } from '../services/exchangeService';
import { alertService, type ExchangeAlert } from '../services/alertService';

interface Alert {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  ddi: string;
  pair: string;
  type: 'above' | 'below';
  targetRate: number;
  validUntil: string;
  notificationType: 'target' | 'daily';
  notificationChannels: string[];
  status: 'active' | 'triggered';
}

interface CurrencyPair {
  pair: string;
  currentRate: number;
  variation: number;
  historicalData: { date: string; rate: number }[];
}

const currencyPairs = ref<CurrencyPair[]>([]);
const alerts = ref<ExchangeAlert[]>([]);
const newAlert = ref({
  name: '',
  email: '',
  whatsapp: '',
  ddi: '',
  pair: 'USD/BRL',
  type: 'above' as const,
  targetRate: 0,
  validUntil: '',
  notificationType: 'target' as const,
  notificationChannels: ['email'] as string[]
});

const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

const formatCurrency = (value: string | number) => {
  if (!value) return '';
  
  // Remove todos os caracteres não numéricos
  const numericValue = value.toString().replace(/\D/g, '');
  
  // Converte para número com 2 casas decimais
  const floatValue = parseFloat(numericValue) / 100;
  
  if (isNaN(floatValue)) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(floatValue);
};

const leadsStore = useLeadsStore();
const filteredLeads = ref([]);
const showLeadSuggestions = ref(false);
const phoneMaskRef = ref(null);

// Função para formatar telefone baseado no DDI
const getPhoneMask = (ddi) => {
  switch (ddi) {
    case '55': // Brasil
      return '(00) 00000-0000';
    case '351': // Portugal
      return '000 000 000';
    default:
      return '00000000000';
  }
};

// Função para inicializar/atualizar máscara do telefone
const updatePhoneMask = (ddi) => {
  const phoneInput = document.querySelector('#phone-input');
  if (phoneInput) {
    if (phoneMaskRef.value) {
      phoneMaskRef.value.destroy();
    }
    phoneMaskRef.value = IMask(phoneInput, {
      mask: getPhoneMask(ddi)
    });
  }
};

// Watch para atualizar máscara do telefone quando o DDI mudar
watch(() => newAlert.value.ddi, (newDDI) => {
  if (newDDI) {
    updatePhoneMask(newDDI);
  }
});

const createAlert = async () => {
  if (newAlert.value.notificationChannels.length === 0) {
    alert('Selecione pelo menos um canal de notificação');
    return;
  }

  try {
    // Converter a cotação de string formatada para número
    const targetRate = parseFloat(newAlert.value.targetRate.replace(/\D/g, '')) / 100;

    const alertData = {
      name: newAlert.value.name,
      email: newAlert.value.email,
      whatsapp: newAlert.value.whatsapp,
      ddi: newAlert.value.ddi,
      notificationChannels: newAlert.value.notificationChannels,
      notificationType: newAlert.value.notificationType,
      targetRate,
      validUntil: newAlert.value.validUntil,
      pair: newAlert.value.pair,
      type: newAlert.value.type
    };

    // Salvar no Firebase e disparar webhook via alertService
    const createdAlert = await alertService.addAlert(alertData);
    alerts.value.unshift(createdAlert);
    resetForm();
  } catch (error) {
    console.error('Erro ao criar alerta:', error);
    alert('Erro ao criar alerta. Por favor, tente novamente.');
  }
};

const removeAlert = async (id: string) => {
  try {
    await alertService.deleteAlert(id);
    alerts.value = alerts.value.filter(alert => alert.id !== id);
  } catch (error) {
    console.error('Erro ao remover alerta:', error);
    alert('Erro ao remover alerta. Por favor, tente novamente.');
  }
};

const resetForm = () => {
  newAlert.value = {
    name: '',
    email: '',
    whatsapp: '',
    ddi: '',
    pair: 'USD/BRL',
    type: 'above',
    targetRate: 0,
    validUntil: '',
    notificationType: 'target',
    notificationChannels: ['email']
  };
};

const fetchExchangeRates = async () => {
  const currencies = ['USD', 'EUR', 'GBP'];
  
  for (const currency of currencies) {
    try {
      const currentData = await getCurrentExchangeRate(currency);
      const historicalData = await getHistoricalRates(currency, 7);
      
      currencyPairs.value.push({
        pair: `${currency}/BRL`,
        currentRate: parseFloat(currentData.bid),
        variation: parseFloat(currentData.pctChange),
        historicalData: historicalData.map(item => ({
          date: new Date(parseInt(item.timestamp) * 1000).toLocaleDateString('pt-BR'),
          rate: parseFloat(item.bid)
        }))
      });
    } catch (error) {
      console.error(`Erro ao buscar dados para ${currency}:`, error);
    }
  }
};

const checkAlerts = () => {
  for (const alert of alerts.value) {
    // Verificar se o alerta ainda é válido
    if (new Date(alert.validUntil) < new Date()) {
      alert.status = 'expired';
      continue;
    }

    const [currency] = alert.pair.split('/');
    const pair = currencyPairs.value.find(p => p.pair === alert.pair);
    
    if (pair) {
      const shouldNotify = 
        (alert.type === 'above' && pair.currentRate > alert.targetRate) ||
        (alert.type === 'below' && pair.currentRate < alert.targetRate) ||
        (alert.notificationType === 'daily');

      if (shouldNotify) {
        alert.status = 'triggered';
        // TODO: Implementar envio de notificações
        // sendNotification(alert, pair.currentRate);
      }
    }
  }
};

// Atualizar taxas a cada 30 segundos
const startPolling = () => {
  setInterval(async () => {
    currencyPairs.value = [];
    await fetchExchangeRates();
    checkAlerts();
  }, 30000);
};

// Buscar leads e alertas ao montar o componente
onMounted(async () => {
  await fetchExchangeRates();
  startPolling();
  await leadsStore.fetchLeads();
  
  // Inicializar máscara do telefone com DDI padrão
  if (newAlert.value.ddi) {
    updatePhoneMask(newAlert.value.ddi);
  }

  // Carregar alertas do Firebase
  try {
    alerts.value = await alertService.getAlerts();
  } catch (error) {
    console.error('Erro ao carregar alertas:', error);
  }
});

// Função para filtrar leads baseado no input
const filterLeads = (input: string, field: 'name' | 'email') => {
  if (!input) {
    filteredLeads.value = [];
    showLeadSuggestions.value = false;
    return;
  }
  
  const searchTerm = input.toLowerCase();
  filteredLeads.value = leadsStore.activeLeads
    .filter(lead => lead[field].toLowerCase().includes(searchTerm))
    .slice(0, 5); // Limitar a 5 sugestões
  showLeadSuggestions.value = true;
};

// Função para selecionar um lead
const selectLead = (lead) => {
  newAlert.value.name = lead.name;
  newAlert.value.email = lead.email;
  newAlert.value.whatsapp = lead.phone;
  newAlert.value.ddi = lead.countryCode;
  showLeadSuggestions.value = false;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

const handleTargetRateInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value.replace(/\D/g, '');
  
  // Se não houver valor, retorna vazio
  if (value === '') {
    newAlert.value.targetRate = '';
    return;
  }
  
  // Adiciona zeros à esquerda se necessário para garantir pelo menos 3 dígitos
  value = value.padStart(3, '0');
  
  // Converte para número e formata com 2 casas decimais fixas
  const numericValue = parseInt(value, 10) / 100;
  const formattedValue = numericValue.toLocaleString('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  newAlert.value.targetRate = `R$ ${formattedValue}`;
};
</script>

<style scoped>
.currency-exchange {
  max-width: 1600px;
  margin: 0 auto;
  width: 95%;
}
</style>