<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

interface IntegrationSetting {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  icon: string;
}

const notificationSettings = ref<NotificationSetting[]>([
  {
    id: 'new-leads',
    title: 'New Lead Notifications',
    description: 'Get notified when new leads are assigned to you',
    enabled: true
  },
  {
    id: 'meeting-reminders',
    title: 'Meeting Reminders',
    description: 'Receive reminders before scheduled meetings',
    enabled: true
  },
  {
    id: 'property-updates',
    title: 'Property Updates',
    description: 'Get notified about changes to your listed properties',
    enabled: false
  }
]);

const integrations = ref<IntegrationSetting[]>([
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync your meetings and appointments',
    connected: true,
    icon: 'https://www.google.com/calendar/images/favicon_v2014_1.ico'
  },
  {
    id: 'docusign',
    name: 'DocuSign',
    description: 'Electronic signature integration',
    connected: false,
    icon: 'https://www.docusign.com/sites/all/themes/custom/docusign/favicon.ico'
  }
]);

const userProfile = ref({
  firstName: 'John',
  lastName: 'Doe',
  email: authStore.user?.email || '',
  phone: '(555) 123-4567',
  timezone: 'America/Los_Angeles'
});

const timezones = [
  'America/Los_Angeles',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo'
];

const toggleNotification = (id: string) => {
  const setting = notificationSettings.value.find(s => s.id === id);
  if (setting) {
    setting.enabled = !setting.enabled;
  }
};

const toggleIntegration = (id: string) => {
  const integration = integrations.value.find(i => i.id === id);
  if (integration) {
    integration.connected = !integration.connected;
  }
};

const saveProfile = () => {
  // TODO: Implement profile update logic
  console.log('Saving profile:', userProfile.value);
};
</script>

<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-2xl font-semibold text-gray-900">Settings</h1>

      <!-- Profile Settings -->
      <div class="mt-6">
        <h2 class="text-lg font-medium text-gray-900">Profile Settings</h2>
        <div class="mt-4 bg-white shadow rounded-lg p-6">
          <form @submit.prevent="saveProfile">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  v-model="userProfile.firstName"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  v-model="userProfile.lastName"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  v-model="userProfile.email"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  v-model="userProfile.phone"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Timezone</label>
                <select
                  v-model="userProfile.timezone"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
                </select>
              </div>
            </div>
            <div class="mt-6">
              <button
                type="submit"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Notification Settings -->
      <div class="mt-10">
        <h2 class="text-lg font-medium text-gray-900">Notification Settings</h2>
        <div class="mt-4 bg-white shadow rounded-lg divide-y divide-gray-200">
          <div
            v-for="setting in notificationSettings"
            :key="setting.id"
            class="px-4 py-5 sm:p-6"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-medium text-gray-900">{{ setting.title }}</h3>
                <p class="text-sm text-gray-500">{{ setting.description }}</p>
              </div>
              <button
                @click="toggleNotification(setting.id)"
                :class="[
                  setting.enabled ? 'bg-indigo-600' : 'bg-gray-200',
                  'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                ]"
              >
                <span
                  :class="[
                    setting.enabled ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200'
                  ]"
                ></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Integrations -->
      <div class="mt-10">
        <h2 class="text-lg font-medium text-gray-900">Integrations</h2>
        <div class="mt-4 bg-white shadow rounded-lg divide-y divide-gray-200">
          <div
            v-for="integration in integrations"
            :key="integration.id"
            class="px-4 py-5 sm:p-6"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <img
                  :src="integration.icon"
                  :alt="integration.name"
                  class="h-8 w-8 rounded-full"
                />
                <div class="ml-3">
                  <h3 class="text-base font-medium text-gray-900">{{ integration.name }}</h3>
                  <p class="text-sm text-gray-500">{{ integration.description }}</p>
                </div>
              </div>
              <button
                @click="toggleIntegration(integration.id)"
                :class="[
                  integration.connected
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-gray-200 hover:bg-gray-300',
                  'px-4 py-2 text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                ]"
              >
                {{ integration.connected ? 'Disconnect' : 'Connect' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>