<script setup lang="ts">
import { defineProps, defineEmits, computed, onMounted } from 'vue';
import { useLeadsStore } from '../stores/leads';

const props = defineProps({
  lead: {
    type: Object,
    required: true
  },
  showArchiveButton: {
    type: Boolean,
    default: false
  }
});

onMounted(() => {
  console.log('Lead recebido no card:', props.lead);
  console.log('Valor do imóvel:', props.lead.propertyValue, typeof props.lead.propertyValue);
});

const emit = defineEmits([
  'edit',
  'delete',
  'archive',
  'openNotes',
  'reactivate'
]);

const leadsStore = useLeadsStore();

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (value) => {
  console.log('Formatando valor:', value, typeof value);
  
  // Se o valor for falsy (0, null, undefined, etc)
  if (value === null || value === undefined) {
    console.log('Valor é null ou undefined');
    return 'Valor não definido';
  }
  
  // Garante que o valor seja um número
  const numValue = Number(value);
  console.log('Valor convertido para número:', numValue, typeof numValue);
  
  if (isNaN(numValue)) {
    console.error('Valor inválido para formatação:', value);
    return 'Valor não definido';
  }

  try {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
    console.log('Valor formatado:', formatted);
    return formatted;
  } catch (error) {
    console.error('Erro ao formatar valor:', error);
    return 'Valor não definido';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-800';
    case 'contacted':
      return 'bg-yellow-100 text-yellow-800';
    case 'qualified':
      return 'bg-green-100 text-green-800';
    case 'lost':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority) => {
  const colors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
  };
  return colors[priority] || 'bg-gray-100 text-gray-700';
};

const hasNotes = computed(() => props.lead.notes && props.lead.notes.length > 0);

const deleteLead = async () => {
  if (confirm('Tem certeza que deseja excluir este lead?')) {
    try {
      await leadsStore.deleteLead(props.lead.id);
      emit('delete', props.lead.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao excluir lead');
    }
  }
};

const handleCardClick = () => {
  // Adicione a lógica de clique no cartão aqui
};

const getWhatsAppLink = (countryCode: string, phone: string) => {
  const fullNumber = `${countryCode}${phone}`.replace(/\D/g, '');
  return `https://wa.me/${fullNumber}`;
};

const formatPhoneDisplay = (countryCode: string, phone: string) => {
  return `+${countryCode} ${phone}`;
};
</script>

<template>
  <div 
    class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow duration-200"
    @click="handleCardClick"
  >
    <!-- Cabeçalho com nome e status -->
    <div class="mb-2">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-medium text-gray-900 truncate">
          {{ lead.name }}
        </h3>
        <!-- Botão de observações -->
        <button
          @click.stop="$emit('open-notes', lead)"
          class="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors duration-200 rounded-full hover:bg-indigo-50"
          :class="{ 'text-indigo-600 bg-indigo-50': hasNotes }"
          :title="hasNotes ? 'Ver observações' : 'Sem observações'"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>
      <span class="text-xs px-2 py-1 rounded-full inline-block mt-1" :class="getPriorityColor(lead.priority)">
        {{ lead.priority }}
      </span>
    </div>

    <!-- Informações de contato -->
    <div class="space-y-2 mb-6">
      <!-- Valor do Imóvel -->
      <div class="flex items-center text-sm text-gray-600">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ formatCurrency(lead.propertyValue) }}</span>
      </div>

      <!-- Email -->
      <div class="flex items-center text-sm text-gray-600">
        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <a :href="'mailto:' + lead.email" class="hover:text-indigo-600 transition-colors duration-200">{{ lead.email }}</a>
      </div>

      <!-- Telefone -->
      <div class="flex items-center text-sm text-gray-600">
        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <a 
          :href="getWhatsAppLink(lead.countryCode, lead.phone)" 
          target="_blank" 
          class="hover:text-indigo-600 transition-colors duration-200"
          @click.stop
        >
          {{ formatPhoneDisplay(lead.countryCode, lead.phone) }}
        </a>
      </div>
    </div>

    <!-- Rodapé com ícones de ação -->
    <div class="flex items-center justify-between pt-3 border-t border-gray-100">
      <!-- Data de criação -->
      <div class="text-[11px] text-gray-400">
        Criado em: {{ formatDate(lead.createdAt) }}
      </div>

      <div class="flex space-x-2">
        <!-- Botão de editar -->
        <button
          @click.stop="$emit('edit', lead)"
          class="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors duration-200 rounded-full hover:bg-indigo-50"
          title="Editar lead"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <!-- Botão de reativar (apenas para leads arquivados) -->
        <button
          v-if="lead.archived"
          @click.stop="$emit('reactivate', lead)"
          class="p-1.5 text-green-600 hover:text-green-900 transition-colors duration-200 rounded-full hover:bg-green-50"
          title="Reativar lead"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <!-- Botão de arquivar (apenas para leads não arquivados) -->
        <button
          v-if="!lead.archived && showArchiveButton"
          @click.stop="$emit('archive', lead)"
          class="p-1.5 text-gray-400 hover:text-yellow-600 transition-colors duration-200 rounded-full hover:bg-yellow-50"
          title="Arquivar lead"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </button>

        <!-- Botão de excluir -->
        <button
          @click.stop="deleteLead"
          class="p-1.5 text-gray-400 hover:text-red-600 transition-colors duration-200 rounded-full hover:bg-red-50"
          title="Excluir lead"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.group:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
