<template>
  <div v-if="show" class="modal-overlay" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>
          <i class="fas fa-calendar-plus"></i>
          {{ editingEvent ? 'Editar Evento' : 'Novo Evento' }}
        </h2>
        <button @click="emit('close')" class="close-button">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="compact-form">
        <div class="form-row">
          <!-- Título -->
          <div class="form-group flex-2">
            <label>
              <i class="fas fa-heading"></i>
              Título
            </label>
            <input v-model="title" type="text" required placeholder="Nome do evento" />
          </div>

          <!-- Tipo -->
          <div class="form-group flex-1">
            <label>
              <i class="fas fa-tag"></i>
              Tipo
            </label>
            <select v-model="type">
              <option value="meeting">Reunião</option>
              <option value="showing">Visita</option>
              <option value="open-house">Open House</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <!-- Data -->
          <div class="form-group">
            <label>
              <i class="fas fa-calendar"></i>
              Data
            </label>
            <input v-model="date" type="date" required />
          </div>

          <!-- Hora Início -->
          <div class="form-group">
            <label>
              <i class="fas fa-clock"></i>
              Início
            </label>
            <input v-model="startTime" type="time" required @change="updateEndTime" />
          </div>

          <!-- Hora Fim -->
          <div class="form-group">
            <label>
              <i class="fas fa-hourglass-end"></i>
              Fim
            </label>
            <input v-model="endTime" type="time" required />
          </div>
        </div>

        <!-- Local -->
        <div class="form-group">
          <div class="checkbox-group">
            <input type="checkbox" v-model="isOnlineMeeting" id="isOnline" />
            <label for="isOnline">
              <i class="fas" :class="isOnlineMeeting ? 'fa-video' : 'fa-map-marker-alt'"></i>
              Reunião Online
            </label>
          </div>
          
          <div class="location-input">
            <template v-if="isOnlineMeeting">
              <input 
                v-model="meetingUrl" 
                type="url" 
                placeholder="Link da reunião"
                required
              />
              <button type="button" @click="generateMeetingUrl" class="secondary-button">
                <i class="fas fa-link"></i>
                Gerar Link
              </button>
              <button type="button" @click="copyMeetingUrl" class="secondary-button">
                <i class="fas fa-copy"></i>
                Copiar Link
              </button>
            </template>
            <input 
              v-else 
              v-model="location" 
              type="text" 
              placeholder="Endereço"
              required
            />
          </div>
        </div>

        <!-- Participantes -->
        <div class="form-group">
          <label>
            <i class="fas fa-users"></i>
            Participantes
          </label>
          <div class="participants-input">
            <input
              v-model="participantInput"
              type="text"
              placeholder="Digite um email ou nome de lead"
              @focus="showParticipantsList = true"
              @input="showParticipantsList = true"
              @keydown.enter.prevent="
                if (isValidEmail(participantInput)) {
                  addParticipant({ name: participantInput, email: participantInput });
                }
              "
            />
            
            <!-- Lista de sugestões -->
            <div v-if="showParticipantsList && filteredLeads.length > 0" class="suggestions-list">
              <div
                v-for="lead in filteredLeads"
                :key="lead.email"
                class="suggestion-item"
                @click="addParticipant(lead)"
              >
                <i class="fas fa-user"></i>
                {{ lead.name }} {{ lead.email ? `(${lead.email})` : '' }}
              </div>
            </div>
          </div>
          
          <!-- Lista de participantes selecionados -->
          <div class="selected-participants">
            <div v-for="participant in selectedParticipants" :key="participant.email" class="participant-tag">
              <i class="fas fa-user-check"></i>
              {{ participant.name }}
              <button type="button" @click="removeParticipant(participant.email)">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Notas -->
        <div class="form-group">
          <label>
            <i class="fas fa-sticky-note"></i>
            Notas
          </label>
          <textarea v-model="notes" rows="2" placeholder="Observações adicionais"></textarea>
        </div>

        <!-- Botões -->
        <div class="button-group">
          <button type="button" @click="emit('close')" class="secondary-button">
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button type="submit" :disabled="isSaving">
            <i class="fas" :class="isSaving ? 'fa-spinner fa-spin' : 'fa-save'"></i>
            {{ isSaving ? 'Salvando...' : (editingEvent ? 'Atualizar' : 'Criar') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch, computed, onMounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '../stores/auth';
import { useLeadsStore } from '../stores/leads';
import type { Meeting } from '../services/meetingService';

const props = defineProps<{
  show: boolean;
  editingEvent?: Meeting | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', event: Meeting): void;
}>();

// Stores
const authStore = useAuthStore();
const leadStore = useLeadsStore();

// Form fields
const title = ref('');
const date = ref('');
const startTime = ref('');
const endTime = ref('');
const type = ref('meeting');
const location = ref('');
const isOnlineMeeting = ref(false);
const meetingUrl = ref('');
const notes = ref('');
const selectedLead = ref<{ name: string; email?: string } | null>(null);

// Participantes
const participantInput = ref('');
const selectedParticipants = ref<Array<{ name: string; email: string }>>([]);
const showParticipantsList = ref(false);

// Carregar leads quando o modal for montado
onMounted(async () => {
  if (leadStore.leads.length === 0) {
    await leadStore.fetchLeads();
  }
});

// Lista filtrada de leads baseada no input do usuário
const filteredLeads = computed(() => {
  const input = participantInput.value.toLowerCase();
  if (!input) return [];
  
  // Primeiro, verificar se o input é um email válido
  const isEmail = isValidEmail(input);
  if (isEmail) {
    return [{ name: input, email: input }];
  }

  // Depois, filtrar leads existentes
  return leadStore.leads
    .filter(lead => 
      lead.name.toLowerCase().includes(input) || 
      (lead.email && lead.email.toLowerCase().includes(input))
    )
    .map(lead => ({
      name: lead.name,
      email: lead.email || ''
    }))
    .filter(lead => lead.email); // Apenas leads com email
});

const addParticipant = (participant: { name: string; email: string }) => {
  if (!participant.email) return;
  
  // Verificar se o participante já foi adicionado
  const exists = selectedParticipants.value.some(p => p.email === participant.email);
  if (!exists) {
    selectedParticipants.value.push(participant);
  }
  
  participantInput.value = '';
  showParticipantsList.value = false;
};

const removeParticipant = (email: string) => {
  selectedParticipants.value = selectedParticipants.value.filter(p => p.email !== email);
};

// Resetar o formulário
const resetForm = () => {
  title.value = '';
  date.value = '';
  startTime.value = '';
  endTime.value = '';
  type.value = 'meeting';
  location.value = '';
  isOnlineMeeting.value = false;
  meetingUrl.value = '';
  notes.value = '';
  selectedLead.value = null;
  selectedParticipants.value = [];
  participantInput.value = '';
};

// Carregar dados do evento para edição
watch(() => props.editingEvent, (newEvent) => {
  if (newEvent) {
    title.value = newEvent.title;
    // Formatar a data para o formato YYYY-MM-DD
    date.value = new Date(newEvent.date).toISOString().split('T')[0];
    startTime.value = newEvent.startTime;
    endTime.value = newEvent.endTime;
    type.value = newEvent.type;
    location.value = newEvent.location || '';
    isOnlineMeeting.value = newEvent.isOnlineMeeting;
    meetingUrl.value = newEvent.meetingUrl || '';
    notes.value = newEvent.notes || '';
    selectedLead.value = newEvent.leadName ? { name: newEvent.leadName } : null;
    selectedParticipants.value = newEvent.attendees.map(email => ({ 
      name: email,
      email: email 
    }));
  } else {
    resetForm();
  }
});

// Definir data padrão ao abrir o modal
watch(() => props.show, (newValue) => {
  if (newValue && !props.editingEvent) {
    // Se estiver abrindo o modal para um novo evento
    const today = new Date();
    date.value = today.toISOString().split('T')[0];
  }
});

const isSaving = ref(false);

const handleSubmit = async () => {
  if (isSaving.value) return;
  if (!authStore.user) {
    console.error('Usuário não autenticado');
    return;
  }

  try {
    isSaving.value = true;

    const eventData = {
      id: props.editingEvent?.id,
      title: title.value,
      date: date.value,
      startTime: startTime.value,
      endTime: endTime.value,
      type: type.value,
      location: isOnlineMeeting.value ? meetingUrl.value : location.value,
      isOnlineMeeting: isOnlineMeeting.value,
      meetingUrl: isOnlineMeeting.value ? meetingUrl.value : null,
      attendees: selectedParticipants.value.map(p => p.email),
      notes: notes.value,
      leadName: selectedLead.value?.name || null,
      userId: authStore.user.uid
    } as Meeting;

    emit('save', eventData);
    resetForm();
    emit('close');
  } catch (error) {
    console.error('Erro ao salvar evento:', error);
  } finally {
    isSaving.value = false;
  }
};

const generateMeetingUrl = () => {
  const roomName = uuidv4();
  return `https://meet.jit.si/${roomName}`;
};

const copyMeetingUrl = async () => {
  try {
    await navigator.clipboard.writeText(meetingUrl.value);
    // Você pode adicionar uma notificação de sucesso aqui se desejar
  } catch (err) {
    console.error('Erro ao copiar link:', err);
  }
};

// Gerar link automaticamente quando selecionar reunião online
watch(isOnlineMeeting, (newValue) => {
  if (newValue) {
    meetingUrl.value = generateMeetingUrl();
  } else {
    meetingUrl.value = '';
  }
});

const updateEndTime = () => {
  if (startTime.value && !endTime.value) {
    // Adicionar 1 hora ao horário de início
    const [hours, minutes] = startTime.value.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    date.setHours(date.getHours() + 1);
    
    endTime.value = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
};

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(1, 41, 40, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(1, 41, 40, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  color: #012928;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: #64748b;
  padding: 0.25rem;
  cursor: pointer;
  transition: color 0.2s;
}

.close-button:hover {
  color: #012928;
}

.compact-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group {
  margin: 0;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.15rem;
  font-weight: 500;
  color: #012928;
  font-size: 0.85rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.35rem 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.85rem;
  transition: all 0.2s;
  background-color: white;
  line-height: 1.2;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #012928;
  box-shadow: 0 0 0 2px rgba(1, 41, 40, 0.1);
  outline: none;
}

.form-row {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.flex-1 {
  flex: 1;
}

.flex-2 {
  flex: 2;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: 0.85rem;
  height: 0.85rem;
  cursor: pointer;
}

.checkbox-group label {
  margin: 0;
  cursor: pointer;
}

.location-input {
  display: flex;
  gap: 0.5rem;
}

.location-input input {
  flex: 1;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

button {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  transition: all 0.2s;
}

button[type="submit"] {
  background: #012928;
  color: white;
}

button[type="submit"]:hover {
  background: rgba(1, 41, 40, 0.9);
}

.secondary-button {
  background: #e2e8f0;
  color: #012928;
}

.secondary-button:hover {
  background: #cbd5e1;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.participants-input {
  position: relative;
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(1, 41, 40, 0.1);
  margin-top: 0.15rem;
}

.suggestion-item {
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.suggestion-item:hover {
  background: rgba(1, 41, 40, 0.05);
}

.selected-participants {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.participant-tag {
  background: rgba(1, 41, 40, 0.1);
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #012928;
}

.participant-tag button {
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border-radius: 50%;
  font-size: 0.8rem;
}

.participant-tag button:hover {
  background: rgba(1, 41, 40, 0.1);
  color: #dc3545;
}

textarea {
  resize: vertical;
  min-height: 2.4rem;
  max-height: 6rem;
}

i {
  font-size: 0.85rem;
}
</style>
