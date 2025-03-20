<script setup lang="ts">
import { ref, computed, defineEmits, defineProps, onMounted, watch } from 'vue';
import draggable from 'vuedraggable';
import LeadCard from './LeadCard.vue';
import { useLeadsStore } from '../stores/leads';
import { useKanbanStore } from '../stores/kanban';
import Modal from './Modal.vue';

const props = defineProps({
  leadsByColumn: {
    type: Object,
    required: true
  }
});

const leadsStore = useLeadsStore();
const kanbanStore = useKanbanStore();

const showColumnModal = ref(false);
const editingColumn = ref<any>(null);
const newColumnTitle = ref('');
const newColumnColor = ref('bg-gray-100');

const colorOptions = [
  { name: 'Gray', value: 'bg-gray-100' },
  { name: 'Blue', value: 'bg-blue-100' },
  { name: 'Green', value: 'bg-green-100' },
  { name: 'Yellow', value: 'bg-yellow-100' },
  { name: 'Red', value: 'bg-red-100' },
  { name: 'Purple', value: 'bg-purple-100' },
  { name: 'Pink', value: 'bg-pink-100' },
  { name: 'Indigo', value: 'bg-indigo-100' },
];

const getColumnColor = (color) => {
  const colors = {
    'bg-gray-100': 'bg-gray-50 border-gray-200',
    'bg-blue-100': 'bg-blue-50 border-blue-200',
    'bg-green-100': 'bg-green-50 border-green-200',
    'bg-yellow-100': 'bg-yellow-50 border-yellow-200',
    'bg-red-100': 'bg-red-50 border-red-200',
    'bg-purple-100': 'bg-purple-50 border-purple-200',
    'bg-pink-100': 'bg-pink-50 border-pink-200',
    'bg-indigo-100': 'bg-indigo-50 border-indigo-200',
  };
  return colors[color] || 'bg-gray-50 border-gray-200';
};

const handleDrop = async (event, columnId) => {
  const { added, moved } = event;
  if (!added && !moved) return;

  const lead = added ? added.element : moved.element;
  const newColumn = columnId;

  if (newColumn === lead.kanbanColumn) return;

  // Atualiza localmente primeiro
  const leadIndex = leadsStore.leads.findIndex(l => l.id === lead.id);
  if (leadIndex !== -1) {
    leadsStore.leads[leadIndex] = {
      ...lead,
      kanbanColumn: newColumn
    };
  }

  try {
    // Atualiza no backend
    await leadsStore.updateLead(lead.id, {
      kanbanColumn: newColumn
    });
  } catch (error) {
    console.error('Erro ao atualizar posição do lead:', error);
    // Em caso de erro, reverte a mudança local
    if (leadIndex !== -1) {
      leadsStore.leads[leadIndex] = lead;
    }
  }
};

const emit = defineEmits([
  'update:modelValue',
  'edit-lead',
  'openNotes',
  'delete-lead',
  'archive-lead',
  'reactivate-lead'
]);

const handleDeleteClick = (lead) => {
  emit('delete-lead', lead);
};

const handleArchiveClick = (lead) => {
  emit('archive-lead', lead);
};

const handleReactivateClick = (lead) => {
  emit('reactivate-lead', lead);
};

const openColumnModal = (column = null) => {
  editingColumn.value = column;
  if (column) {
    newColumnTitle.value = column.title;
    newColumnColor.value = column.color;
  } else {
    newColumnTitle.value = '';
    newColumnColor.value = 'bg-gray-100';
  }
  showColumnModal.value = true;
};

const saveColumn = () => {
  if (editingColumn.value) {
    kanbanStore.updateColumn(editingColumn.value.id, {
      title: newColumnTitle.value,
      color: newColumnColor.value
    });
  } else {
    kanbanStore.addColumn(newColumnTitle.value, newColumnColor.value);
  }
  showColumnModal.value = false;
  newColumnTitle.value = '';
  newColumnColor.value = 'bg-gray-100';
  editingColumn.value = null;
};

const deleteColumn = (columnId) => {
  // Verifica se há leads na coluna
  if ((props.leadsByColumn[columnId]?.length || 0) > 0) {
    return; // Não permite excluir se houver leads
  }

  if (confirm('Tem certeza que deseja excluir esta coluna?')) {
    kanbanStore.deleteColumn(columnId);
  }
};

const onColumnDrop = (event) => {
  kanbanStore.reorderColumns(event.oldIndex, event.newIndex);
};

const loading = ref(true);
const error = ref(null);

watch(() => leadsStore.leads, () => {
  loading.value = false;
}, { deep: true, immediate: true });

onMounted(async () => {
  try {
    await leadsStore.fetchLeads();
  } catch (err) {
    error.value = 'Erro ao carregar os leads. Por favor, tente novamente.';
    console.error('Erro:', err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="relative">
    <!-- Loading -->
    <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
      <div class="flex flex-col items-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#012928]"></div>
        <p class="mt-2 text-gray-600">Carregando leads...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000-16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Kanban Header -->
    <div class="flex justify-between items-center px-4 py-2">
      <h2 class="text-xl font-semibold">Pipeline de Leads</h2>
      <button
        @click="showColumnModal = true; editingColumn = null; newColumnTitle = ''; newColumnColor = 'bg-gray-100'"
        class="flex-shrink-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#012928] hover:bg-[#023a39] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#01FBA1] whitespace-nowrap"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Nova Coluna
      </button>
    </div>

    <!-- Kanban Board -->
    <div class="flex-1 flex overflow-x-auto p-4">
      <draggable
        v-model="kanbanStore.columns"
        group="columns"
        item-key="id"
        @end="onColumnDrop"
        class="flex space-x-4"
        :animation="150"
      >
        <template #item="{ element: column }">
          <div
            class="flex flex-col w-80 rounded-lg border shadow-sm"
            :class="getColumnColor(column.color)"
          >
            <!-- Column Header -->
            <div class="p-4 flex justify-between items-center border-b bg-white rounded-t-lg">
              <h3 class="font-medium text-gray-900">
                {{ column.title }}
                <span class="ml-2 text-sm text-gray-500">
                  ({{ props.leadsByColumn[column.id]?.length || 0 }})
                </span>
              </h3>
              <div class="flex space-x-2">
                <button
                  @click="openColumnModal(column)"
                  class="text-gray-500 hover:text-gray-700"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  @click="deleteColumn(column.id)"
                  :disabled="(props.leadsByColumn[column.id]?.length || 0) > 0"
                  :class="[
                    'transition-colors duration-200',
                    (props.leadsByColumn[column.id]?.length || 0) > 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:text-red-600'
                  ]"
                  :title="(props.leadsByColumn[column.id]?.length || 0) > 0 ? 'Remova todos os leads antes de excluir a coluna' : 'Excluir coluna'"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Column Content -->
            <div class="flex-1 p-4">
              <draggable
                :list="props.leadsByColumn[column.id] || []"
                group="leads"
                item-key="id"
                @change="(event) => handleDrop(event, column.id)"
                :animation="200"
                ghost-class="bg-indigo-100"
                drag-class="cursor-grabbing"
                class="space-y-2 min-h-[200px]"
              >
                <template #item="{ element: lead }">
                  <LeadCard 
                    :lead="lead" 
                    :show-archive-button="true"
                    @delete="handleDeleteClick" 
                    @openNotes="$emit('openNotes', $event)"
                    @edit="$emit('edit-lead', $event)"
                    @archive="handleArchiveClick"
                    @reactivate="handleReactivateClick"
                  />
                </template>
              </draggable>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- Column Modal -->
    <Modal :show="showColumnModal" @close="showColumnModal = false">
      <template #title>
        {{ editingColumn ? 'Editar Coluna' : 'Nova Coluna' }}
      </template>
      <template #content>
        <div class="space-y-4">
          <div>
            <label for="columnTitle" class="block text-sm font-medium text-gray-700">Título</label>
            <input
              type="text"
              id="columnTitle"
              v-model="newColumnTitle"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Cor</label>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="color in colorOptions"
                :key="color.value"
                @click="newColumnColor = color.value"
                class="w-full h-8 rounded-md border-2"
                :class="[
                  color.value,
                  newColumnColor === color.value ? 'border-indigo-500' : 'border-transparent'
                ]"
              />
            </div>
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="showColumnModal = false"
              class="inline-flex items-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#01FBA1] focus:ring-offset-2"
            >
              <svg class="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </button>
            <button
              type="button"
              @click="saveColumn"
              class="inline-flex items-center justify-center rounded-md border border-transparent bg-[#012928] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#012928]/90 focus:outline-none focus:ring-2 focus:ring-[#01FBA1] focus:ring-offset-2"
            >
              <svg class="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {{ editingColumn ? 'Atualizar' : 'Criar' }}
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.draggable-ghost {
  opacity: 0.5;
}

.draggable-drag {
  opacity: 0.8;
}

/* Esconde a scrollbar mas mantém a funcionalidade */
.overflow-x-auto {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.overflow-x-auto::-webkit-scrollbar {
  display: none;
}

/* Atualizando as cores do Kanban para usar a nova paleta */
.bg-secondary-50 {
  background-color: #f7fafc;
}

.bg-secondary-100 {
  background-color: #e2e8f0;
}

.bg-secondary-200 {
  background-color: #cbd5e1;
}

.bg-secondary-300 {
  background-color: #b1becd;
}

.bg-secondary-400 {
  background-color: #91a7bf;
}

.bg-secondary-500 {
  background-color: #748495;
}

.bg-secondary-600 {
  background-color: #5f6c7b;
}

.bg-secondary-700 {
  background-color: #4c5154;
}

.bg-secondary-800 {
  background-color: #3b3f46;
}

.bg-secondary-900 {
  background-color: #2d2f36;
}

.text-secondary-50 {
  color: #f7fafc;
}

.text-secondary-100 {
  color: #e2e8f0;
}

.text-secondary-200 {
  color: #cbd5e1;
}

.text-secondary-300 {
  color: #b1becd;
}

.text-secondary-400 {
  color: #91a7bf;
}

.text-secondary-500 {
  color: #748495;
}

.text-secondary-600 {
  color: #5f6c7b;
}

.text-secondary-700 {
  color: #4c5154;
}

.text-secondary-800 {
  color: #3b3f46;
}

.text-secondary-900 {
  color: #2d2f36;
}

.border-secondary-50 {
  border-color: #f7fafc;
}

.border-secondary-100 {
  border-color: #e2e8f0;
}

.border-secondary-200 {
  border-color: #cbd5e1;
}

.border-secondary-300 {
  border-color: #b1becd;
}

.border-secondary-400 {
  border-color: #91a7bf;
}

.border-secondary-500 {
  border-color: #748495;
}

.border-secondary-600 {
  border-color: #5f6c7b;
}

.border-secondary-700 {
  border-color: #4c5154;
}

.border-secondary-800 {
  border-color: #3b3f46;
}

.border-secondary-900 {
  border-color: #2d2f36;
}

.bg-status-new {
  background-color: #f7dc6f;
}

.bg-status-in_progress {
  background-color: #8bc34a;
}

.bg-status-qualified {
  background-color: #03a9f4;
}

.bg-status-lost {
  background-color: #e74c3c;
}

.bg-status-archived {
  background-color: #95a5a6;
}

.text-status-new {
  color: #f7dc6f;
}

.text-status-in_progress {
  color: #8bc34a;
}

.text-status-qualified {
  color: #03a9f4;
}

.text-status-lost {
  color: #e74c3c;
}

.text-status-archived {
  color: #95a5a6;
}
</style>
