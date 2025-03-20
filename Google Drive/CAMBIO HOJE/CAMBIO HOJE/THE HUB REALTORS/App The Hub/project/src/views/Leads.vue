<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useLeadsStore } from '../stores/leads';
import { useAuthStore } from '../stores/auth';
import { useKanbanStore } from '../stores/kanban';
import { useRouter } from 'vue-router';
import { auth } from '../firebase/config';
import Modal from '../components/Modal.vue';
import LeadForm from '../components/LeadForm.vue';
import LeadKanban from '../components/LeadKanban.vue';
import ConfirmationModal from '../components/ConfirmationModal.vue';
import FileUploader from '../components/FileUploader.vue';
import { uploadFile, deleteFile, formatFileSize } from '../services/fileService';
import { getStorage, ref as storageRef } from 'firebase/storage';

const router = useRouter();
const authStore = useAuthStore();
const leadsStore = useLeadsStore();
const kanbanStore = useKanbanStore();
const searchQuery = ref('');
const selectedStatus = ref('all');
const selectedPriority = ref('all');
const selectedSource = ref('all');
const valueRange = ref({
  min: 0,
  max: 10000000
});
const showFilters = ref(false);
const showModal = ref(false);
const editingLead = ref(null);
const isEditMode = ref(false);
const viewMode = ref('kanban');
const showNotesModal = ref(false);
const selectedLead = ref(null);
const newNote = ref('');
const isSaving = ref(false);
const saveError = ref('');
const isLoading = ref(true);
const isUploading = ref(false);
const uploadError = ref('');
const uploadProgress = ref(0);

const showDeleteConfirmation = ref(false);
const showArchiveConfirmation = ref(false);
const showReactivateConfirmation = ref(false);
const leadToDelete = ref(null);
const leadToArchive = ref(null);
const leadToReactivate = ref(null);

const statuses = [
  { value: 'new', label: 'New', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
  { value: 'qualified', label: 'Qualified', color: 'bg-green-500' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500' }
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-gray-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-red-500' }
];

const sources = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social', label: 'Social Media' },
  { value: 'other', label: 'Other' }
];

const filteredLeads = computed(() => {
  return leadsStore.leads.filter(lead => {
    const searchText = searchQuery.value.toLowerCase();
    const matchesSearch = searchText === '' || 
      lead.name.toLowerCase().includes(searchText) ||
      lead.email.toLowerCase().includes(searchText) ||
      lead.phone.includes(searchText);
    
    const matchesStatus = selectedStatus.value === 'all' || lead.status === selectedStatus.value;
    const matchesPriority = selectedPriority.value === 'all' || lead.priority === selectedPriority.value;
    const matchesSource = selectedSource.value === 'all' || lead.source === selectedSource.value;
    
    const matchesValue = !lead.propertyValue || 
      (lead.propertyValue >= valueRange.value.min && lead.propertyValue <= valueRange.value.max);
    
    return matchesSearch && matchesStatus && matchesPriority && matchesSource && matchesValue;
  });
});

const getLeadsByColumn = computed(() => {
  const grouped = {};
  kanbanStore.sortedColumns.forEach(column => {
    grouped[column.id] = filteredLeads.value
      .filter(lead => !lead.archived && lead.kanbanColumn === column.id);
  });
  return grouped;
});

const getStatusColor = (status) => {
  return statuses.find(s => s.value === status)?.color || 'bg-gray-500';
};

const getPriorityColor = (priority) => {
  return priorities.find(p => p.value === priority)?.color || 'bg-gray-500';
};

// Função para formatar a data
const formatDate = (date: Date | string | number) => {
  try {
    if (!date) return 'Data não disponível';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Data inválida';

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const openNewLeadModal = () => {
  isEditMode.value = false;
  editingLead.value = null;
  showModal.value = true;
};

const openEditLeadModal = (lead) => {
  isEditMode.value = true;
  editingLead.value = { ...lead };
  showModal.value = true;
};

const openNotesModal = (lead) => {
  selectedLead.value = lead;
  showNotesModal.value = true;
  newNote.value = '';
};

const addNote = async () => {
  if (!newNote.value.trim()) return;

  const note = {
    text: newNote.value.trim(),
    timestamp: new Date().toISOString(),
    author: authStore.user?.displayName || 'Usuário'
  };

  if (!selectedLead.value.notes) {
    selectedLead.value.notes = [];
  }

  selectedLead.value.notes.unshift(note);

  try {
    await leadsStore.updateLead(selectedLead.value.id, selectedLead.value);
    newNote.value = '';
  } catch (error) {
    console.error('Erro ao adicionar nota:', error);
  }
};

const handleLeadSubmit = async (leadData) => {
  try {
    isSaving.value = true;
    saveError.value = '';

    // Garantir que propertyValue seja um número e que countryCode esteja presente
    const processedLeadData = {
      ...leadData,
      countryCode: leadData.countryCode || '55',
      propertyValue: Number(leadData.propertyValue) || 100000,
      familyMembers: (leadData.familyMembers || []).map(member => ({
        ...member,
        countryCode: member.countryCode || '55'
      }))
    };

    console.log('Dados do lead processados:', processedLeadData);

    if (isEditMode.value && editingLead.value) {
      // Atualiza o lead existente
      const updatedLead = {
        ...editingLead.value,
        ...processedLeadData
      };
      await leadsStore.updateLead(updatedLead.id, updatedLead);
    } else if (leadData.id) {
      // Se o lead já tem ID, significa que é uma reativação
      await leadsStore.updateLead(leadData.id, {
        ...processedLeadData,
        archived: false,
        status: 'new',
        kanbanColumn: processedLeadData.kanbanColumn || kanbanStore.sortedColumns[0]?.id
      });
    } else {
      // Adiciona novo lead - deixa o Firestore gerar o ID
      await leadsStore.addLead({
        ...processedLeadData,
        kanbanColumn: processedLeadData.kanbanColumn || kanbanStore.sortedColumns[0]?.id
      });
    }

    // Recarregar os leads após adicionar/atualizar
    await leadsStore.fetchLeads();
    
    showModal.value = false;
    editingLead.value = null;
    isEditMode.value = false;
  } catch (error) {
    console.error('Erro ao salvar lead:', error);
    saveError.value = 'Erro ao salvar lead. Por favor, tente novamente.';
  } finally {
    isSaving.value = false;
  }
};

const handleDeleteClick = (lead) => {
  leadToDelete.value = lead;
  showDeleteConfirmation.value = true;
};

const handleArchiveClick = (lead) => {
  leadToArchive.value = lead;
  showArchiveConfirmation.value = true;
};

const handleReactivateClick = (lead) => {
  leadToReactivate.value = lead;
  showReactivateConfirmation.value = true;
};

const confirmDelete = async () => {
  if (leadToDelete.value) {
    await leadsStore.deleteLead(leadToDelete.value.id);
    showDeleteConfirmation.value = false;
    leadToDelete.value = null;
  }
};

const confirmArchive = async () => {
  if (leadToArchive.value) {
    await leadsStore.updateLead(leadToArchive.value.id, {
      ...leadToArchive.value,
      archived: true
    });
    showArchiveConfirmation.value = false;
    leadToArchive.value = null;
  }
};

const confirmReactivate = async () => {
  if (leadToReactivate.value) {
    await leadsStore.updateLead(leadToReactivate.value.id, {
      ...leadToReactivate.value,
      archived: false,
      status: 'new'
    });
    showReactivateConfirmation.value = false;
    leadToReactivate.value = null;
  }
};

const handleDeleteLead = (id) => {
  if (confirm('Tem certeza que deseja excluir este lead?')) {
    leadsStore.deleteLead(id);
  }
};

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'kanban' ? 'table' : 'kanban';
};

const resetFilters = () => {
  selectedStatus.value = 'all';
  selectedPriority.value = 'all';
  selectedSource.value = 'all';
  valueRange.value = {
    min: 0,
    max: 10000000
  };
};

const handleFileSelected = async (file: File) => {
  if (!selectedLead.value?.id || !authStore.user) return;

  try {
    isUploading.value = true;
    uploadError.value = '';
    uploadProgress.value = 0;

    // Fazer upload do arquivo
    const folder = `leads/${selectedLead.value.id}/attachments`;
    const attachment = await uploadFile(file, folder, (progress) => {
      uploadProgress.value = Math.round(progress);
    });

    // Criar uma cópia do lead atual
    const updatedLead = { ...selectedLead.value };
    
    // Atualizar a lista de anexos
    updatedLead.attachments = [...(updatedLead.attachments || []), attachment];

    // Atualizar no Firestore
    await leadsStore.updateLead(selectedLead.value.id, {
      attachments: updatedLead.attachments
    });

    // Atualizar localmente usando a cópia completa
    selectedLead.value = updatedLead;
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    uploadError.value = 'Erro ao fazer upload do arquivo. Por favor, tente novamente.';
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
  }
};

const handleFileDelete = async (attachment) => {
  if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;
  
  try {
    await deleteFile(attachment.path);
    // Criar uma cópia do lead atual
    const updatedLead = { ...selectedLead.value };
    updatedLead.attachments = updatedLead.attachments?.filter(a => a.id !== attachment.id);
    
    // Atualizar no Firestore
    await leadsStore.updateLead(updatedLead.id!, {
      attachments: updatedLead.attachments
    });
    
    // Atualizar localmente usando a cópia completa
    selectedLead.value = updatedLead;
  } catch (error) {
    console.error('Erro ao excluir arquivo:', error);
    alert('Erro ao excluir o arquivo');
  }
};

// Variáveis para edição de observação
const editingObservation = ref<string | null>(null);
const editedObservationText = ref('');

// Funções para gerenciar observações
const startEditingObservation = (observationId: string, text: string) => {
  editingObservation.value = observationId;
  editedObservationText.value = text;
};

const cancelEditingObservation = () => {
  editingObservation.value = null;
  editedObservationText.value = '';
};

const saveObservation = async (observationId: string) => {
  try {
    if (!selectedLead.value?.id) return;
    
    // Fazer uma cópia do array atual de notas
    const currentNotes = [...(selectedLead.value.notes || [])];
    
    // Encontrar o índice da nota a ser editada
    const noteIndex = currentNotes.findIndex(note => note.id === observationId);
    
    if (noteIndex === -1) {
      console.error('Observação não encontrada');
      return;
    }
    
    // Atualizar apenas os campos necessários mantendo o resto
    currentNotes[noteIndex] = {
      ...currentNotes[noteIndex],
      text: editedObservationText.value,
      timestamp: new Date().toISOString()
    };
    
    // Atualizar no Firestore
    await leadsStore.updateLead(selectedLead.value.id, {
      notes: currentNotes
    });
    
    // Atualizar localmente
    selectedLead.value.notes = currentNotes;
    
    // Limpar estado de edição
    cancelEditingObservation();
  } catch (error) {
    console.error('Erro ao salvar observação:', error);
  }
};

const deleteObservation = async (observationId: string) => {
  try {
    if (!selectedLead.value?.id) return;
    
    if (!confirm('Tem certeza que deseja excluir esta observação?')) return;
    
    // Fazer uma cópia do array atual de notas
    const currentNotes = [...(selectedLead.value.notes || [])];
    
    // Encontrar o índice da nota a ser excluída
    const noteIndex = currentNotes.findIndex(note => note.id === observationId);
    
    if (noteIndex === -1) {
      console.error('Observação não encontrada');
      return;
    }
    
    // Remover apenas a nota específica usando splice
    currentNotes.splice(noteIndex, 1);
    
    // Atualizar no Firestore
    await leadsStore.updateLead(selectedLead.value.id, {
      notes: currentNotes
    });
    
    // Atualizar localmente
    selectedLead.value.notes = currentNotes;
  } catch (error) {
    console.error('Erro ao excluir observação:', error);
  }
};

// Carregar leads quando o usuário estiver autenticado
onMounted(async () => {
  try {
    await leadsStore.fetchLeads();
  } catch (error) {
    console.error('Erro ao carregar leads:', error);
  }
});

// Observar mudanças na rota
watch(() => router.currentRoute.value.path, () => {
  showNotesModal.value = false;
  selectedLead.value = null;
  newNote.value = '';
  editingObservation.value = null;
  editedObservationText.value = '';
});

// Verificar autenticação ao montar o componente e quando o estado de autenticação mudar
watch(() => authStore.user, async (user) => {
  if (!user) {
    router.push('/login');
    return;
  }

  try {
    await leadsStore.fetchLeads();
  } catch (error) {
    console.error('Error loading leads:', error);
  }
}, { immediate: true });
</script>

<template>
  <div class="min-h-full bg-white py-8">
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div class="flex-1 min-w-0">
            <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Leads</h2>
          </div>
          <div class="mt-4 flex md:mt-0 md:ml-4">
            <!-- Campo de busca -->
            <div class="w-64 mr-3">
              <div class="relative rounded-md shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  v-model="searchQuery"
                  class="focus:ring-[#012928] focus:border-[#012928] block w-full pl-8 pr-3 py-1.5 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Buscar leads..."
                >
              </div>
            </div>

            <button
              type="button"
              @click="toggleViewMode"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-[#012928] bg-white hover:border-[#01FBA1] focus:outline-none focus:ring-2 focus:ring-[#01FBA1] focus:ring-offset-2"
            >
              <svg 
                v-if="viewMode === 'table'"
                class="-ml-1 mr-2 h-5 w-5 text-gray-500" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <svg 
                v-else
                class="-ml-1 mr-2 h-5 w-5 text-gray-500" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {{ viewMode === 'kanban' ? 'Table View' : 'Kanban View' }}
            </button>

            <button
              @click="showFilters = !showFilters"
              class="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#012928]"
            >
              <svg class="h-5 w-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
              <span v-if="selectedStatus !== 'all' || selectedPriority !== 'all' || selectedSource !== 'all' || valueRange.min > 0 || valueRange.max < 10000000" 
                class="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#012928] text-white"
              >
                Ativos
              </span>
            </button>

            <button
              type="button"
              @click="openNewLeadModal"
              class="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#012928] hover:bg-[#023a39] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#01FBA1]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Novo Lead
            </button>
          </div>
        </div>

        <!-- Painel de filtros -->
        <div v-if="showFilters" class="mt-4 p-4 bg-white border rounded-lg shadow-sm space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Status</label>
              <select
                v-model="selectedStatus"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#012928] focus:border-[#012928] sm:text-sm rounded-md"
              >
                <option value="all">Todos</option>
                <option v-for="status in statuses" :key="status.value" :value="status.value">
                  {{ status.label }}
                </option>
              </select>
            </div>

            <!-- Prioridade -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Prioridade</label>
              <select
                v-model="selectedPriority"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#012928] focus:border-[#012928] sm:text-sm rounded-md"
              >
                <option value="all">Todas</option>
                <option v-for="priority in priorities" :key="priority.value" :value="priority.value">
                  {{ priority.label }}
                </option>
              </select>
            </div>

            <!-- Fonte -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Fonte</label>
              <select
                v-model="selectedSource"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#012928] focus:border-[#012928] sm:text-sm rounded-md"
              >
                <option value="all">Todas</option>
                <option v-for="source in sources" :key="source.value" :value="source.value">
                  {{ source.label }}
                </option>
              </select>
            </div>

            <!-- Faixa de Valor -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">
                Faixa de valor do imóvel
              </label>
              <div class="px-2">
                <div class="flex justify-between text-sm text-gray-500 mb-2">
                  <span>{{ formatCurrency(valueRange.min) }}</span>
                  <span>{{ formatCurrency(valueRange.max) }}</span>
                </div>
                <div class="space-y-4">
                  <input
                    type="range"
                    v-model.number="valueRange.min"
                    :min="0"
                    :max="10000000"
                    :step="50000"
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#012928]"
                  >
                  <input
                    type="range"
                    v-model.number="valueRange.max"
                    :min="0"
                    :max="10000000"
                    :step="50000"
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#012928]"
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Botões de ação -->
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button
              @click="resetFilters"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#012928]"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div v-if="viewMode === 'table'" class="bg-white border border-gray-200 shadow overflow-hidden sm:rounded-lg">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fonte</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado</th>
                <th scope="col" class="relative px-6 py-3">
                  <span class="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="lead in filteredLeads" :key="lead.id" class="hover:bg-gray-50 transition-colors duration-150">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ lead.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ lead.email }}</div>
                  <div class="text-sm text-gray-500">{{ lead.phone }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white"
                    :class="getStatusColor(lead.status)"
                  >
                    {{ lead.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white"
                    :class="getPriorityColor(lead.priority)"
                  >
                    {{ lead.priority }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ lead.source }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(new Date(lead.createdAt)) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    @click="openNotesModal(lead)"
                    class="text-gray-600 hover:text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#01FBA1] rounded-md p-1"
                  >
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586a1 1 0 01.293.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </button>
                  <button
                    @click="openEditLeadModal(lead)"
                    class="text-gray-600 hover:text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#01FBA1] rounded-md p-1"
                  >
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <!-- Botão de Reativar (apenas para leads arquivados) -->
                  <button
                    v-if="lead.archived"
                    @click="handleReactivateClick(lead)"
                    class="text-green-600 hover:text-green-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#01FBA1] rounded-md p-1"
                    title="Reativar Lead"
                  >
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <!-- Botão de Arquivar (apenas para leads não arquivados) -->
                  <button
                    v-if="!lead.archived"
                    @click="handleArchiveClick(lead)"
                    class="text-gray-600 hover:text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#01FBA1] rounded-md p-1"
                  >
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4 2 2 0 010 4zM5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </button>
                  <button
                    @click="handleDeleteClick(lead)"
                    class="text-red-600 hover:text-red-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#01FBA1] rounded-md p-1"
                  >
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Kanban Board -->
      <div v-else class="flex-1">
        <div v-if="filteredLeads.length === 0" class="text-center py-10">
          <p class="text-gray-500">Nenhum lead encontrado.</p>
        </div>
        <LeadKanban 
          v-else
          :leads-by-column="getLeadsByColumn"
          @edit-lead="openEditLeadModal"
          @open-notes="openNotesModal"
          @delete-lead="handleDeleteClick"
          @archive-lead="handleArchiveClick"
          @reactivate-lead="handleReactivateClick"
        />
      </div>

      <!-- Lead Modal -->
      <Modal
        v-if="showModal"
        :show="showModal"
        @close="showModal = false"
        class="w-full max-w-7xl mx-auto"
      >
        <template #title>{{ isEditMode ? 'Editar Lead' : 'Novo Lead' }}</template>
        <template #content>
          <!-- Error Message -->
          <div v-if="saveError" class="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-700">{{ saveError }}</p>
              </div>
            </div>
          </div>

          <!-- Form -->
          <LeadForm
            :lead="editingLead"
            :is-edit="isEditMode"
            :disabled="isSaving"
            @submit="handleLeadSubmit"
            @cancel="showModal = false"
          />

          <!-- Loading Overlay -->
          <div v-if="isSaving" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div class="flex flex-col items-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p class="mt-2 text-gray-600">Salvando lead...</p>
            </div>
          </div>
        </template>
      </Modal>

      <!-- Notes Modal -->
      <Modal :show="showNotesModal" @close="showNotesModal = false">
        <template #title>
          <div class="flex items-center space-x-2 text-[#012928]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="text-base sm:text-lg">Observações</span>
          </div>
        </template>
        <template #content>
          <div class="w-full sm:w-[400px] space-y-3 sm:space-y-4">
            <!-- Add Note Form -->
            <div class="space-y-3 sm:space-y-4">
              <textarea
                v-model="newNote"
                rows="3"
                class="shadow-sm block w-full focus:ring-[#01FBA1] focus:border-[#01FBA1] text-sm sm:text-base border border-gray-300 rounded-md"
                placeholder="Digite sua observação..."
              ></textarea>
              <div class="flex justify-end">
                <button
                  type="button"
                  @click="addNote"
                  :disabled="!newNote.trim()"
                  class="inline-flex items-center justify-center rounded-md border border-transparent bg-[#012928] py-1.5 sm:py-2 px-3 sm:px-4 text-sm font-medium text-white shadow-sm hover:bg-[#012928]/90 focus:outline-none focus:ring-2 focus:ring-[#01FBA1] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span class="text-sm sm:text-base">Adicionar Observação</span>
                </button>
              </div>
            </div>

            <!-- Notes List -->
            <div class="space-y-3 sm:space-y-4">
              <div v-for="note in selectedLead?.notes" :key="note.id" class="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
                <div v-if="editingObservation !== note.id" class="flex justify-between items-start">
                  <div>
                    <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ note.text }}</p>
                    <div class="mt-1 flex items-center text-xs text-gray-500">
                      <span>{{ formatDate(new Date(note.timestamp)) }}</span>
                      <span class="mx-1">•</span>
                      <span>{{ note.author }}</span>
                    </div>
                  </div>
                  <div class="flex items-center space-x-1 ml-3">
                    <button
                      @click="startEditingObservation(note.id, note.text)"
                      class="text-gray-400 hover:text-gray-500 p-1 rounded hover:bg-gray-100"
                      title="Editar observação"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      @click="deleteObservation(note.id)"
                      class="text-red-400 hover:text-red-500 p-1 rounded hover:bg-red-50"
                      title="Excluir observação"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0111 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div v-else class="space-y-2">
                  <textarea
                    v-model="editedObservationText"
                    rows="3"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#012928] focus:ring-[#012928] sm:text-sm"
                    placeholder="Digite sua observação..."
                  ></textarea>
                  <div class="flex justify-end space-x-2">
                    <button
                      @click="cancelEditingObservation"
                      class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#012928]"
                    >
                      Cancelar
                    </button>
                    <button
                      @click="saveObservation(note.id)"
                      class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-[#012928] hover:bg-[#012928]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#012928]"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="!selectedLead?.notes?.length" class="text-gray-500 text-center py-4">
                Nenhuma observação ainda.
              </div>
            </div>

            <!-- Anexos -->
            <div class="space-y-3 sm:space-y-4">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Adicionar Arquivo
                </label>
                <div class="-mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-gray-50">
                  <FileUploader
                    @file-selected="handleFileSelected"
                    :maxSize="10 * 1024 * 1024"
                  />
                </div>
                <div v-if="isUploading" class="mt-2">
                  <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Fazendo upload...</span>
                    <span>{{ uploadProgress }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      class="bg-[#012928] h-1.5 rounded-full transition-all duration-300"
                      :style="{ width: uploadProgress + '%' }"
                    ></div>
                  </div>
                </div>
                <p v-if="uploadError" class="mt-2 text-sm text-red-600">
                  {{ uploadError }}
                </p>
              </div>

              <div v-if="selectedLead.attachments?.length" class="mt-3">
                <div class="flex items-center justify-between mb-1.5">
                  <h3 class="text-xs font-medium text-gray-700">
                    Arquivos Anexados
                  </h3>
                  <span class="text-xs text-gray-500">
                    {{ selectedLead.attachments.length }} {{ selectedLead.attachments.length === 1 ? 'arquivo' : 'arquivos' }}
                  </span>
                </div>
                <ul class="border border-gray-100 divide-y divide-gray-100 rounded-md overflow-hidden">
                  <li 
                    v-for="attachment in selectedLead.attachments" 
                    :key="attachment.id" 
                    class="py-1.5 px-2 flex items-center hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div class="flex items-center space-x-2 flex-1 min-w-0">
                      <svg class="h-3.5 w-3.5 flex-shrink-0 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clip-rule="evenodd" />
                      </svg>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-medium text-gray-900 truncate">
                          {{ attachment.name }}
                        </p>
                        <p class="text-[11px] text-gray-500">
                          {{ formatFileSize(attachment.size) }} • {{ formatDate(new Date(attachment.uploadedAt)) }}
                        </p>
                      </div>
                    </div>
                    <div class="flex items-center space-x-1">
                      <a
                        :href="attachment.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-gray-400 hover:text-gray-500 p-1 rounded hover:bg-gray-100 transition-colors duration-200"
                        title="Visualizar arquivo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                        </svg>
                      </a>
                      <button
                        @click="handleFileDelete(attachment)"
                        class="text-red-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors duration-200"
                        title="Excluir arquivo"
                      >
                        <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0111 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </li>
                </ul>
              </div>
              <div v-if="!selectedLead?.attachments?.length" class="text-gray-500 text-center py-4">
                Nenhum arquivo anexado ainda.
              </div>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex justify-end">
            <button
              type="button"
              @click="showNotesModal = false"
              class="inline-flex items-center rounded-md border border-gray-300 bg-white py-1.5 sm:py-2 px-3 sm:px-4 text-sm font-medium text-[#012928] shadow-sm hover:border-[#01FBA1] focus:outline-none focus:ring-2 focus:ring-[#01FBA1] focus:ring-offset-2"
            >
              <svg class="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span class="text-sm sm:text-base">Fechar</span>
            </button>
          </div>
        </template>
      </Modal>

      <ConfirmationModal
        :show="showDeleteConfirmation"
        title="Excluir Lead"
        message="Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita."
        confirm-text="Excluir"
        cancel-text="Cancelar"
        type="danger"
        @confirm="confirmDelete"
        @cancel="showDeleteConfirmation = false"
      />

      <ConfirmationModal
        :show="showArchiveConfirmation"
        title="Arquivar Lead"
        message="Tem certeza que deseja arquivar este lead? Você poderá reativá-lo posteriormente."
        confirm-text="Arquivar"
        cancel-text="Cancelar"
        type="warning"
        @confirm="confirmArchive"
        @cancel="showArchiveConfirmation = false"
      />

      <ConfirmationModal
        :show="showReactivateConfirmation"
        title="Reativar Lead"
        message="Tem certeza que deseja reativar este lead? Ele voltará a aparecer na lista principal."
        confirm-text="Reativar"
        cancel-text="Cancelar"
        type="info"
        @confirm="confirmReactivate"
        @cancel="showReactivateConfirmation = false"
      />
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.prose {
  max-width: 65ch;
  color: #374151;
}

.prose p {
  margin-top: 1.25em;
  margin-bottom: 1.25em;
}
</style>