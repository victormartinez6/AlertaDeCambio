<script setup lang="ts">
import { ref, defineEmits, defineProps, watch, nextTick } from 'vue';
import { useKanbanStore } from '../stores/kanban';
import { leadService } from '../services/leadService';
import Modal from './Modal.vue';
import debounce from 'lodash/debounce';

const kanbanStore = useKanbanStore();
const showDuplicateModal = ref(false);
const duplicateLead = ref(null);
const isSubmitting = ref(false);
const isCheckingEmail = ref(false);
const emailTimeout = ref<number | null>(null);

const props = defineProps({
  lead: {
    type: Object,
    default: () => ({
      name: '',
      email: '',
      phone: '',
      status: 'new',
      kanbanColumn: '',
      source: 'website',
      priority: 'medium',
      notes: '',
      familyMembers: [],
      propertyValue: 100000
    })
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit', 'cancel']);

const formData = ref({
  name: props.lead?.name || '',
  email: props.lead?.email || '',
  phone: props.lead?.phone || '',
  countryCode: props.lead?.countryCode || '55',
  status: props.lead?.status || 'new',
  kanbanColumn: props.lead?.kanbanColumn || '',
  source: props.lead?.source || 'website',
  priority: props.lead?.priority || 'medium',
  notes: props.lead?.notes || '',
  familyMembers: (props.lead?.familyMembers || []).map(member => ({
    ...member,
    countryCode: member.countryCode || '55',
    email: member.email || '' // Adicionando o campo de email
  })),
  propertyValue: props.lead?.propertyValue || 100000
});

const phoneError = ref('');

const formatCurrency = (value: number) => {
  if (!value) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const validatePhone = (phone: string, countryCode: string) => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 0) {
    phoneError.value = 'O número de telefone é obrigatório';
    return false;
  }
  
  // Verifica se tem pelo menos 8 dígitos (menor número possível para um telefone válido)
  if (cleaned.length < 8) {
    phoneError.value = 'Número de telefone muito curto';
    return false;
  }
  
  // Verifica se tem no máximo 15 dígitos (padrão internacional E.164)
  if (cleaned.length > 15) {
    phoneError.value = 'Número de telefone muito longo';
    return false;
  }
  
  // Verifica se o código do país tem entre 1 e 3 dígitos
  if (countryCode.length < 1 || countryCode.length > 3) {
    phoneError.value = 'Código do país inválido';
    return false;
  }
  
  phoneError.value = '';
  return true;
};

const handlePhoneInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  // Remove qualquer caractere que não seja número
  formData.value.phone = input.value.replace(/\D/g, '');
  validatePhone(formData.value.phone, formData.value.countryCode);
};

const handleCountryCodeInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  // Remove qualquer caractere que não seja número
  const value = input.value.replace(/\D/g, '');
  // Limita a 3 dígitos
  formData.value.countryCode = value.slice(0, 3);
  validatePhone(formData.value.phone, formData.value.countryCode);
};

const getWhatsAppLink = (phone: string, countryCode: string) => {
  const fullNumber = `+${countryCode}${phone}`;
  return `https://wa.me/${fullNumber}`;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (props.disabled || isSubmitting.value) return;
  
  if (!validatePhone(formData.value.phone, formData.value.countryCode)) {
    return;
  }

  try {
    isSubmitting.value = true;
    // Prepara os dados para envio
    const dataToSubmit = {
      ...formData.value,
      // Garante que o countryCode seja enviado
      countryCode: formData.value.countryCode || '55',
      // Processa os membros da família para garantir que o telefone esteja no formato correto
      familyMembers: formData.value.familyMembers.map(member => ({
        ...member,
        phone: member.phone,
        countryCode: member.countryCode || '55',
        email: member.email // Adicionando o campo de email
      })),
      propertyValue: Math.floor(Number(formData.value.propertyValue))
    };
    console.log('Enviando dados do lead:', dataToSubmit);
    emit('submit', dataToSubmit);
  } catch (error) {
    console.error('Erro ao salvar lead:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const handleEmailBlur = async (event) => {
  const email = event.target.value;
  if (!email || props.isEdit) return;

  try {
    isCheckingEmail.value = true;
    const existingLead = await leadService.getLeadByEmail(email);
    
    if (existingLead) {
      duplicateLead.value = existingLead;
      showDuplicateModal.value = true;
    }
  } catch (error) {
    console.error('Erro ao verificar email:', error);
  } finally {
    isCheckingEmail.value = false;
  }
};

const handleReactivateLead = () => {
  if (duplicateLead.value) {
    emit('submit', { 
      ...duplicateLead.value,
      archived: false,
      status: 'new'
    });
    showDuplicateModal.value = false;
  }
};

const handleModalClose = () => {
  showDuplicateModal.value = false;
  duplicateLead.value = null;
};

const priorities = [
  { 
    value: 'low', 
    label: 'Baixa', 
    icon: '⬇️', 
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  { 
    value: 'medium', 
    label: 'Média', 
    icon: '➡️', 
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  { 
    value: 'high', 
    label: 'Alta', 
    icon: '⬆️', 
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
];

const sources = [
  { value: 'website', label: 'Website', icon: '🌐' },
  { value: 'referral', label: 'Indicação', icon: '👥' },
  { value: 'social', label: 'Redes Sociais', icon: '📱' },
  { value: 'other', label: 'Outro', icon: '📌' }
];

// Se não houver coluna selecionada, usar a primeira coluna como padrão
watch(() => formData.value, () => {
  if (!formData.value.kanbanColumn && kanbanStore.sortedColumns.length > 0) {
    formData.value.kanbanColumn = kanbanStore.sortedColumns[0].id;
  }
}, { immediate: true });

// Watch para garantir que propertyValue seja sempre um número
watch(() => formData.value.propertyValue, (newValue) => {
  if (newValue) {
    // Converte para número e remove casas decimais
    formData.value.propertyValue = Math.floor(Number(newValue));
  }
});

// Watch para atualizar os dados quando o lead mudar
watch(() => props.lead, (newLead) => {
  if (newLead) {
    formData.value = {
      name: newLead.name || '',
      email: newLead.email || '',
      phone: newLead.phone || '',
      countryCode: newLead.countryCode || '55',
      status: newLead.status || 'new',
      kanbanColumn: newLead.kanbanColumn || '',
      source: newLead.source || 'website',
      priority: newLead.priority || 'medium',
      notes: newLead.notes || '',
      familyMembers: (newLead.familyMembers || []).map(member => ({
        ...member,
        countryCode: member.countryCode || '55',
        email: member.email || '' // Adicionando o campo de email
      })),
      propertyValue: newLead.propertyValue || 100000
    };
  }
}, { deep: true });

const getPriorityStyle = (priority) => {
  const priorityObj = priorities.find(p => p.value === priority);
  return priorityObj ? `${priorityObj.bgColor} ${priorityObj.borderColor}` : '';
};

const addFamilyMember = () => {
  formData.value.familyMembers.push({
    name: '',
    relationship: '',
    phone: '',
    countryCode: '55',
    email: '' // Adicionando o campo de email
  });
};

const removeFamilyMember = (index) => {
  formData.value.familyMembers.splice(index, 1);
};

const formatPhoneForMember = (phone: string, countryCode: string, index: number) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  formData.value.familyMembers[index].phone = cleaned;
  return cleaned;
};

const handleFamilyMemberPhoneInput = (event: Event, index: number) => {
  const input = event.target as HTMLInputElement;
  formData.value.familyMembers[index].phone = input.value.replace(/\D/g, '');
};

const handleFamilyMemberCountryCodeInput = (event: Event, index: number) => {
  const input = event.target as HTMLInputElement;
  formData.value.familyMembers[index].countryCode = input.value.replace(/\D/g, '');
};
</script>

<template>
  <form @submit="handleSubmit" class="space-y-8">
    <!-- Informações Básicas -->
    <div class="bg-white rounded-lg shadow p-6 space-y-6">
      <h3 class="text-lg font-medium text-gray-900 border-b pb-3">Informações do Lead Principal</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Nome e Email -->
        <div class="space-y-4">
          <!-- Nome -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">
              Nome Completo
            </label>
            <input
              type="text"
              id="name"
              v-model="formData.name"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#012928] focus:ring-[#012928] sm:text-sm"
              :disabled="props.disabled"
            />
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              v-model="formData.email"
              required
              @blur="handleEmailBlur"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#012928] focus:ring-[#012928] sm:text-sm"
              :disabled="props.disabled || isCheckingEmail"
            />
          </div>
        </div>

        <!-- Telefone e Valor -->
        <div class="space-y-4">
          <!-- Telefone -->
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700">
              Telefone (WhatsApp)
            </label>
            <div class="flex gap-2 mt-1">
              <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">+</span>
                <input
                  type="tel"
                  id="countryCode"
                  v-model="formData.countryCode"
                  required
                  placeholder="55"
                  maxlength="3"
                  @input="handleCountryCodeInput"
                  class="block w-20 pl-6 rounded-md border-gray-300 shadow-sm focus:border-[#012928] focus:ring-[#012928] sm:text-sm"
                  :disabled="props.disabled"
                />
              </div>
              <input
                type="tel"
                id="phone"
                v-model="formData.phone"
                required
                placeholder="11999999999"
                @input="handlePhoneInput"
                class="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-[#012928] focus:ring-[#012928] sm:text-sm"
                :disabled="props.disabled"
              />
            </div>
            <p class="mt-1 text-xs text-gray-500">Digite apenas números, sem espaços ou caracteres especiais</p>
            <p v-if="phoneError" class="mt-1 text-sm text-red-600">{{ phoneError }}</p>
          </div>

          <!-- Valor do Imóvel -->
          <div class="space-y-2">
            <label for="propertyValue" class="block text-sm font-medium text-gray-700">
              Valor do imóvel: {{ formatCurrency(formData.propertyValue) }}
            </label>
            <input
              id="propertyValue"
              type="range"
              v-model.number="formData.propertyValue"
              :min="100000"
              :max="10000000"
              :step="50000"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              :disabled="props.disabled"
            />
            <div class="flex justify-between text-xs text-gray-600">
              <span>$100k</span>
              <span>$10M</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Membros da Família -->
      <div class="mt-6">
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-md font-medium text-gray-900">Membros da Família</h4>
          <button
            type="button"
            @click="addFamilyMember"
            class="inline-flex items-center bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#012928] disabled:bg-gray-100 disabled:cursor-not-allowed"
            :disabled="props.disabled"
          >
            <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Adicionar Membro
          </button>
        </div>

        <div v-if="formData.familyMembers.length === 0" class="text-sm text-gray-500 text-center py-4">
          Nenhum membro da família adicionado
        </div>

        <div v-for="(member, index) in formData.familyMembers" :key="index" class="p-4 bg-gray-50 rounded-lg mb-4">
          <div class="flex justify-between items-center mb-4">
            <h5 class="text-sm font-medium text-gray-700">Membro {{ index + 1 }}</h5>
            <button
              type="button"
              @click="removeFamilyMember(index)"
              class="text-gray-400 hover:text-red-600"
              :disabled="props.disabled"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <!-- Linha 1: Nome e Parentesco -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Nome do Membro -->
              <div>
                <label :for="'member-name-' + index" class="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <input
                  :id="'member-name-' + index"
                  type="text"
                  v-model="member.name"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#012928] focus:ring-[#012928] sm:text-sm"
                  :disabled="props.disabled"
                />
              </div>

              <!-- Parentesco -->
              <div>
                <label :for="'member-relationship-' + index" class="block text-sm font-medium text-gray-700">
                  Parentesco
                </label>
                <input
                  :id="'member-relationship-' + index"
                  type="text"
                  v-model="member.relationship"
                  placeholder="Ex: Cônjuge, Filho(a), Pai, Mãe"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#012928] focus:ring-[#012928] sm:text-sm"
                  :disabled="props.disabled"
                />
              </div>
            </div>

            <!-- Linha 2: Telefone e Email -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Telefone do Membro -->
              <div>
                <label :for="'member-phone-' + index" class="block text-sm font-medium text-gray-700">
                  Telefone (WhatsApp)
                </label>
                <div class="flex gap-2 mt-1">
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">+</span>
                    <input
                      type="tel"
                      :id="'member-countryCode-' + index"
                      v-model="member.countryCode"
                      placeholder="55"
                      maxlength="3"
                      @input="handleFamilyMemberCountryCodeInput($event, index)"
                      class="block w-16 pl-6 rounded-md border-gray-300 shadow-sm focus:border-[#012928] focus:ring-[#012928] sm:text-sm"
                      :disabled="props.disabled"
                    />
                  </div>
                  <input
                    type="tel"
                    :id="'member-phone-' + index"
                    v-model="member.phone"
                    placeholder="11999999999"
                    @input="handleFamilyMemberPhoneInput($event, index)"
                    class="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-[#012928] focus:ring-[#012928] sm:text-sm"
                    :disabled="props.disabled"
                  />
                </div>
                <p class="mt-1 text-xs text-gray-500">Digite apenas números</p>
              </div>

              <!-- Email do Membro -->
              <div>
                <label :for="'member-email-' + index" class="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  :id="'member-email-' + index"
                  type="email"
                  v-model="member.email"
                  placeholder="email@exemplo.com"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#012928] focus:ring-[#012928] sm:text-sm"
                  :disabled="props.disabled"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status do Cliente -->
    <div class="bg-white rounded-lg shadow p-6 space-y-6">
      <h3 class="text-lg font-medium text-gray-900 border-b pb-3">Status do Cliente</h3>
      
      <div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <template v-for="column in kanbanStore.sortedColumns" :key="column.id">
            <button
              type="button"
              @click="() => {
                formData.status = column.id;
                formData.kanbanColumn = column.id;
              }"
              :class="[
                'px-3 py-2 text-sm font-medium rounded-md w-full text-center transition-colors duration-200',
                formData.status === column.id
                  ? 'bg-[#012928] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
              :disabled="props.disabled"
            >
              {{ column.title }}
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Prioridade e Fonte -->
    <div class="bg-white rounded-lg shadow p-6 space-y-6">
      <h3 class="text-lg font-medium text-gray-900 border-b pb-3">Detalhes Adicionais</h3>
      
      <!-- Prioridade -->
      <div>
        <label class="block text-sm font-medium text-gray-900 mb-3">Prioridade</label>
        <div class="grid grid-cols-3 gap-3">
          <div
            v-for="priority in priorities"
            :key="priority.value"
            @click="formData.priority = priority.value"
            :class="[
              'relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-all duration-200 hover:border-indigo-500',
              formData.priority === priority.value ? 'ring-2 ring-indigo-500' : 'border-gray-300',
              getPriorityStyle(priority.value)
            ]"
          >
            <div class="flex w-full items-center justify-between">
              <div class="flex items-center">
                <span class="mr-2 text-xl">{{ priority.icon }}</span>
                <span :class="[priority.color, 'font-medium']">{{ priority.label }}</span>
              </div>
              <div v-show="formData.priority === priority.value" class="text-indigo-600">
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fonte -->
      <div>
        <label class="block text-sm font-medium text-gray-900 mb-3">Fonte</label>
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="source in sources"
            :key="source.value"
            @click="formData.source = source.value"
            :class="[
              'relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-all duration-200 hover:border-indigo-500',
              formData.source === source.value ? 'ring-2 ring-indigo-500' : 'border-gray-300'
            ]"
          >
            <div class="flex w-full items-center justify-between">
              <div class="flex items-center">
                <span class="mr-2 text-xl">{{ source.icon }}</span>
                <span class="font-medium text-gray-900">{{ source.label }}</span>
              </div>
              <div v-show="formData.source === source.value" class="text-indigo-600">
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Observações -->
      <div>
        <label class="block text-sm font-medium text-gray-900">Observações</label>
        <div class="mt-1">
          <textarea
            id="notes"
            name="notes"
            rows="3"
            :disabled="props.disabled"
            v-model="formData.notes"
            class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Adicione observações importantes sobre o lead..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Botões -->
    <div class="flex justify-end space-x-3 pt-6">
      <button
        type="button"
        :disabled="props.disabled"
        @click="$emit('cancel')"
        class="inline-flex items-center bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#012928] disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <svg class="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Cancelar
      </button>
      <button
        type="submit"
        :disabled="props.disabled"
        class="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#012928] hover:bg-[#012928]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#012928] disabled:bg-[#012928]/50 disabled:cursor-not-allowed"
      >
        <svg class="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        {{ props.isEdit ? 'Atualizar' : 'Criar' }}
      </button>
    </div>
  </form>

  <!-- Modal de Lead Duplicado -->
  <Teleport to="body">
    <Modal
      v-if="showDuplicateModal"
      :show="showDuplicateModal"
      @close="handleModalClose"
      class="w-full max-w-lg mx-auto"
    >
      <template #title>
        <div class="flex items-center space-x-2 text-[#012928]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Lead Existente Encontrado</span>
        </div>
      </template>
      <template #content>
        <div class="space-y-6">
          <div class="bg-white border-l-4 border-[#012928] p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-[#012928]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-[#012928]">
                  Já existe um lead cadastrado com este email. Deseja reativar o lead existente?
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white shadow overflow-hidden sm:rounded-lg">
            <div class="px-4 py-5 sm:px-6 bg-white">
              <h3 class="text-lg leading-6 font-medium text-[#012928] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-[#012928]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Informações do Lead
              </h3>
            </div>
            <div class="border-t border-gray-200">
              <dl>
                <div class="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-[#012928] flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Nome
                  </dt>
                  <dd class="mt-1 text-sm text-[#012928] sm:mt-0 sm:col-span-2">{{ duplicateLead?.name }}</dd>
                </div>
                <div class="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-[#012928] flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </dt>
                  <dd class="mt-1 text-sm text-[#012928] sm:mt-0 sm:col-span-2">{{ duplicateLead?.email }}</dd>
                </div>
                <div class="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-[#012928] flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Status
                  </dt>
                  <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">
                    <span :class="{
                      'px-2 py-1 text-xs font-medium rounded-full': true,
                      'bg-[#012928]/10 text-[#012928]': duplicateLead?.status === 'new',
                      'bg-[#012928]/10 text-[#012928]': duplicateLead?.status === 'in_progress',
                      'bg-[#012928]/10 text-[#012928]': duplicateLead?.status === 'qualified',
                      'bg-[#012928]/10 text-[#012928]': duplicateLead?.status === 'lost',
                      'bg-[#012928]/10 text-[#012928]': duplicateLead?.status === 'archived'
                    }">
                      {{ duplicateLead?.status }}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="handleModalClose"
            class="inline-flex items-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-[#012928] shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#01FBA1] focus:ring-offset-2"
          >
            <svg class="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancelar
          </button>
          <button
            type="button"
            @click="handleReactivateLead"
            class="inline-flex items-center justify-center rounded-md border border-transparent bg-[#012928] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#012928]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#01FBA1] focus:ring-offset-2"
          >
            <svg class="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reativar Lead
          </button>
        </div>
      </template>
    </Modal>
  </Teleport>
</template>
