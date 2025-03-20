<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import EventModal from '../components/EventModal.vue';
import { meetingService, type Meeting } from '../services/meetingService';
import { useAuthStore } from '../stores/auth';
import { v4 as uuidv4 } from 'uuid';

interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'showing' | 'meeting' | 'open-house';
  location: string;
  isOnlineMeeting?: boolean;
  attendees: string[];
  notes?: string;
  leadName?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const meetings = ref<Meeting[]>([]);
const showEventModal = ref(false);
const editingEvent = ref(null);
const currentDate = ref(new Date());
const selectedDate = ref(new Date());
const isLoading = ref(false);
const error = ref<string | null>(null);

const loadEvents = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const authStore = useAuthStore();
    if (!authStore.user) {
      error.value = 'Por favor, faça login para visualizar os eventos.';
      return;
    }

    meetings.value = await meetingService.getAllMeetings();
  } catch (err) {
    console.error('Erro ao carregar eventos:', err);
    error.value = err instanceof Error ? err.message : 'Erro ao carregar eventos';
  } finally {
    isLoading.value = false;
  }
};

// Carregar eventos quando o componente for montado e o usuário estiver autenticado
onMounted(async () => {
  const authStore = useAuthStore();
  if (authStore.user) {
    await loadEvents();
  }

  // Recarregar eventos quando o status de autenticação mudar
  watch(() => authStore.user, async (newUser) => {
    if (newUser) {
      await loadEvents();
    } else {
      meetings.value = [];
    }
  });
});

const handleSaveEvent = async (eventData: Meeting) => {
  try {
    isLoading.value = true;
    error.value = null;

    const authStore = useAuthStore();
    if (!authStore.user) {
      throw new Error('Usuário não autenticado');
    }

    // Formatar a data para o formato YYYY-MM-DD
    const formattedData = {
      ...eventData,
      date: new Date(eventData.date).toISOString().split('T')[0],
      userId: authStore.user.uid
    };

    if (eventData.id) {
      // Atualizar evento existente
      await meetingService.updateMeeting(eventData.id, formattedData);
      const index = meetings.value.findIndex(e => e.id === eventData.id);
      if (index !== -1) {
        meetings.value[index] = { 
          ...formattedData,
          id: eventData.id
        };
      }
    } else {
      // Criar novo evento
      const newMeeting = await meetingService.createMeeting(formattedData);
      meetings.value.push(newMeeting);
    }

    showEventModal.value = false;
  } catch (err) {
    console.error('Erro ao salvar evento:', err);
    error.value = err instanceof Error ? err.message : 'Erro ao salvar evento. Por favor, tente novamente.';
  } finally {
    isLoading.value = false;
  }
};

const deleteEvent = async (eventId: string) => {
  if (!confirm('Tem certeza que deseja excluir este evento?')) {
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;

    await meetingService.deleteMeeting(eventId);
    meetings.value = meetings.value.filter(e => e.id !== eventId);
  } catch (err) {
    console.error('Erro ao excluir evento:', err);
    error.value = err instanceof Error ? err.message : 'Erro ao excluir evento. Por favor, tente novamente.';
  } finally {
    isLoading.value = false;
  }
};

const daysInMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const firstDayOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

const getDaysArray = () => {
  const days = [];
  const firstDay = firstDayOfMonth(currentDate.value);
  const totalDays = daysInMonth(currentDate.value);
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  // Add the days of the month
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }
  
  return days;
};

const getMeetingsForDate = (date: number) => {
  return meetings.value.filter(meeting => {
    const meetingDate = new Date(meeting.date);
    return meetingDate.getDate() === date &&
           meetingDate.getMonth() === currentDate.value.getMonth() &&
           meetingDate.getFullYear() === currentDate.value.getFullYear();
  });
};

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const period = Number(hours) >= 12 ? 'PM' : 'AM';
  const hour = Number(hours) % 12 || 12;
  return `${hour}:${minutes} ${period}`;
};

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1);
};

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1);
};

const openMeeting = (meeting: Meeting) => {
  if (meeting.isOnlineMeeting && meeting.location.startsWith('https://meet.jit.si/')) {
    window.open(meeting.location, '_blank');
  }
};

const editEvent = (meeting: Meeting) => {
  editingEvent.value = meeting;
  showEventModal.value = true;
};

// Função para formatar a data do banco para o calendário
const formatDateForCalendar = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

const events = computed(() => 
  meetings.value.map(meeting => ({
    id: meeting.id,
    title: meeting.title + (meeting.leadName ? ` (Lead: ${meeting.leadName})` : ''),
    start: new Date(`${meeting.date}T${meeting.startTime}`),
    end: new Date(`${meeting.date}T${meeting.endTime}`),
    date: formatDateForCalendar(meeting.date),
    extendedProps: {
      type: meeting.type,
      location: meeting.location,
      isOnlineMeeting: meeting.isOnlineMeeting,
      attendees: meeting.attendees,
      notes: meeting.notes,
      leadName: meeting.leadName
    }
  }))
);

</script>

<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-semibold text-gray-900">Calendário</h1>
        <button
          @click="showEventModal = true"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#012928] hover:bg-[#012928]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#012928]"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="mr-2">
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
          Novo Evento
        </button>
      </div>

      <!-- Mensagem de erro -->
      <div v-if="error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">{{ error }}</p>
          </div>
          <div class="ml-auto pl-3">
            <div class="-mx-1.5 -my-1.5">
              <button
                @click="error = null"
                class="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <span class="sr-only">Fechar</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading && !meetings.length" class="mt-8 flex justify-center">
        <div class="flex flex-col items-center">
          <svg class="animate-spin h-8 w-8 text-[#012928]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-2 text-sm text-gray-500">Carregando eventos...</p>
        </div>
      </div>

      <!-- Calendar Navigation -->
      <div class="mt-6 flex items-center justify-between">
        <button
          @click="previousMonth"
          class="p-2 rounded-md hover:bg-gray-100"
        >
          <span class="sr-only">Mês anterior</span>
          ←
        </button>
        <h2 class="text-xl font-semibold text-gray-900">
          {{ monthNames[currentDate.getMonth()] }} {{ currentDate.getFullYear() }}
        </h2>
        <button
          @click="nextMonth"
          class="p-2 rounded-md hover:bg-gray-100"
        >
          <span class="sr-only">Próximo mês</span>
          →
        </button>
      </div>

      <!-- Calendar Grid -->
      <div class="mt-6">
        <!-- Week day headers -->
        <div class="grid grid-cols-7 gap-px bg-gray-200 border-b border-gray-200">
          <div
            v-for="day in ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']"
            :key="day"
            class="bg-white py-2 text-center text-sm font-semibold text-gray-900"
          >
            {{ day }}
          </div>
        </div>

        <!-- Calendar days -->
        <div class="grid grid-cols-7 gap-px bg-gray-200">
          <div
            v-for="(day, index) in getDaysArray()"
            :key="index"
            class="bg-white min-h-[120px] p-2 relative group"
          >
            <div v-if="day !== null" class="h-full">
              <div class="font-semibold text-sm mb-1">{{ day }}</div>
              <!-- Meetings for the day -->
              <div class="space-y-1">
                <div
                  v-for="meeting in getMeetingsForDate(day)"
                  :key="meeting.id"
                  class="p-2 rounded text-xs cursor-pointer group relative"
                  :class="{
                    'bg-blue-100 text-blue-800': meeting.type === 'meeting',
                    'bg-green-100 text-green-800': meeting.type === 'showing',
                    'bg-purple-100 text-purple-800': meeting.type === 'open-house'
                  }"
                  @click="meeting.isOnlineMeeting ? openMeeting(meeting) : null"
                >
                  <div class="font-medium truncate flex items-center justify-between">
                    <div class="flex items-center">
                      {{ meeting.title }}
                      <svg
                        v-if="meeting.isOnlineMeeting"
                        class="h-3 w-3 ml-1 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div v-if="meeting.leadName" class="flex items-center">
                      <svg class="h-3 w-3 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span class="ml-1 text-xs">{{ meeting.leadName }}</span>
                    </div>
                  </div>
                  <div>{{ formatTime(meeting.startTime) }} - {{ formatTime(meeting.endTime) }}</div>
                  
                  <!-- Ações do evento (visíveis no hover) -->
                  <div class="absolute top-0 right-0 hidden group-hover:flex space-x-1 p-1">
                    <button
                      @click.stop="editEvent(meeting)"
                      class="p-1 hover:bg-gray-100 rounded"
                    >
                      <svg class="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click.stop="deleteEvent(meeting.id)"
                      class="p-1 hover:bg-gray-100 rounded"
                    >
                      <svg class="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Evento -->
    <EventModal
      :show="showEventModal"
      :editing-event="editingEvent"
      @close="showEventModal = false; editingEvent = null"
      @save="handleSaveEvent"
    />
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
</style>