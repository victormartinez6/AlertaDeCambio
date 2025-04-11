<template>
  <div class="fixed inset-0 z-50 bg-black">
    <div class="absolute top-4 right-4 z-50">
      <button
        @click="$emit('close')"
        class="bg-white p-2 rounded-full hover:bg-gray-100"
      >
        <svg class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div id="jitsi-container" class="w-full h-full"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { JitsiMeeting as JitsiSDK } from '@jitsi/vue-sdk';

const props = defineProps({
  roomName: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  }
});

defineEmits(['close']);

let api: any = null;

onMounted(() => {
  const domain = 'meet.jit.si';
  const options = {
    roomName: props.roomName,
    width: '100%',
    height: '100%',
    parentNode: document.querySelector('#jitsi-container'),
    userInfo: {
      displayName: props.displayName
    },
    configOverwrite: {
      startWithAudioMuted: true,
      startWithVideoMuted: true,
      enableWelcomePage: false,
      enableClosePage: false,
      disableDeepLinking: true,
      prejoinPageEnabled: false
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
        'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
        'tileview', 'select-background', 'download', 'help', 'mute-everyone'
      ]
    }
  };

  api = new JitsiSDK(options);
});

onBeforeUnmount(() => {
  if (api) {
    api.dispose();
  }
});
</script>
