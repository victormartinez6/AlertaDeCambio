<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close']);
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="emit('close')"></div>

        <!-- Modal panel -->
        <div class="relative bg-white rounded-lg text-left shadow-xl transform transition-all mx-auto max-h-[90vh] overflow-y-auto scrollbar w-[95vw] sm:w-auto">
          <div class="bg-white px-3 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-2 sm:mt-0 sm:text-left w-full">
                <h3 class="text-base sm:text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  <slot name="title"></slot>
                </h3>
                <div class="mt-3 sm:mt-4">
                  <slot name="content"></slot>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal footer -->
          <div class="bg-gray-50 px-3 py-2 sm:px-6 sm:py-3">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Estilização da scrollbar */
.scrollbar {
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: #012928 transparent; /* Firefox */
}

/* Webkit (Chrome, Safari, Edge) */
.scrollbar::-webkit-scrollbar {
  width: 8px;
}

.scrollbar::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.scrollbar::-webkit-scrollbar-thumb {
  background-color: #01292880;
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #012928;
  border: 2px solid transparent;
  background-clip: padding-box;
}
</style>
