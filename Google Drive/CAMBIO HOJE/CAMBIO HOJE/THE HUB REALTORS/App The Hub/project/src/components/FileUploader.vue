<template>
  <div 
    class="relative w-full"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <!-- Área de Drop -->
    <div
      class="border-2 border-dashed rounded-lg p-3 text-center w-full"
      :class="[
        isDragging 
          ? 'border-[#012928] bg-[#012928]/5' 
          : 'border-gray-300 hover:border-[#012928]'
      ]"
    >
      <div class="space-y-1">
        <svg
          class="mx-auto h-7 w-7 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <div class="text-xs text-gray-600">
          <label
            for="file-upload"
            class="relative cursor-pointer rounded-md font-medium text-[#012928] focus-within:outline-none focus-within:ring-2 focus-within:ring-[#012928] focus-within:ring-offset-2 hover:text-[#012928]/70"
          >
            <span>Clique para fazer upload</span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              class="sr-only"
              @change="handleFileSelect"
            />
          </label>
          <span class="pl-1">ou arraste e solte</span>
        </div>
        <p class="text-[11px] text-gray-500">Arquivos de até 10MB</p>
      </div>
    </div>

    <!-- Barra de Progresso -->
    <transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isUploading" class="mt-2">
        <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Fazendo upload...</span>
          <span>{{ Math.round(uploadProgress) }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-1">
          <div
            class="bg-[#012928] h-1 rounded-full transition-all duration-300"
            :style="{ width: `${uploadProgress}%` }"
          ></div>
        </div>
      </div>
    </transition>

    <!-- Mensagem de Erro -->
    <transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="error"
        class="mt-2 text-xs text-red-600"
      >
        {{ error }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  maxSize?: number; // em bytes
}>();

const emit = defineEmits<{
  (e: 'file-selected', file: File): void;
}>();

const isDragging = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const error = ref('');

// Resetar erro quando o progresso muda
watch(uploadProgress, () => {
  if (uploadProgress.value > 0) {
    error.value = '';
  }
});

const validateFile = (file: File): boolean => {
  const maxSize = props.maxSize || 10 * 1024 * 1024; // 10MB padrão
  
  if (file.size > maxSize) {
    error.value = 'O arquivo não pode ser maior que 10MB';
    return false;
  }
  
  error.value = '';
  return true;
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  
  const file = input.files[0];
  if (validateFile(file)) {
    emit('file-selected', file);
  }
  
  // Limpar input
  input.value = '';
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  
  const files = event.dataTransfer?.files;
  if (!files?.length) return;
  
  const file = files[0];
  if (validateFile(file)) {
    emit('file-selected', file);
  }
};

defineExpose({
  isUploading,
  uploadProgress,
  error
});
</script>
