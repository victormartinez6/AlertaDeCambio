<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import faviconIcon from '../assets/images/favicon.svg';
import logoNome from '../assets/images/The Hub Realtors_nome.svg';

const router = useRouter();
const authStore = useAuthStore();

const isSidebarOpen = ref(true);
const currentSidebarTab = ref('linksTab');
const isSettingsPanelOpen = ref(false);
const isSubHeaderOpen = ref(false);

const navigation = [
  { name: 'Dashboard', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Leads', path: '/leads', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { name: 'Properties', path: '/properties', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Calendar', path: '/calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Learning', path: '/learning', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { name: 'Currency Exchange', path: '/currency-exchange', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Webhooks', path: '/webhooks', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { name: 'Settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
];

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

const watchScreen = () => {
  if (window.innerWidth <= 1024) {
    isSidebarOpen.value = false;
  } else {
    isSidebarOpen.value = true;
  }
};

// Watch for screen size changes
window.addEventListener('resize', watchScreen);

// Initial check on mount
onMounted(() => {
  watchScreen();
});
</script>

<template>
  <div class="flex h-screen antialiased text-gray-900 bg-white">
    <!-- Loading screen -->
    <div class="fixed inset-0 z-50 flex items-center justify-center text-2xl font-semibold text-white bg-indigo-800" style="display: none;">
      Loading.....
    </div>

    <!-- Sidebar -->
    <div class="flex flex-shrink-0 transition-all">
      <div
        v-show="isSidebarOpen"
        @click="isSidebarOpen = false"
        class="fixed inset-0 z-10 bg-black bg-opacity-50 lg:hidden"
      ></div>
      <div v-show="isSidebarOpen" class="fixed inset-y-0 z-10 w-16 bg-white border-r border-gray-200"></div>

      <!-- Mobile bottom bar -->
      <nav
        aria-label="Options"
        class="fixed inset-x-0 bottom-0 flex flex-row-reverse items-center justify-between px-4 py-2 bg-white border-t border-indigo-100 sm:hidden shadow-t rounded-t-3xl"
      >
        <!-- Menu button -->
        <button
          @click="isSidebarOpen = !isSidebarOpen"
          class="p-2 transition-colors rounded-lg shadow-md focus:outline-none focus:ring focus:ring-primary-600 focus:ring-offset-white focus:ring-offset-2"
          :class="isSidebarOpen ? 'text-primary-600 bg-primary-50' : 'text-gray-500 bg-white'"
        >
          <span class="sr-only">Toggle sidebar</span>
          <svg
            aria-hidden="true"
            class="w-6 h-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>

        <!-- Logo -->
        <a href="#">
          <h1 class="text-xl font-bold text-indigo-600">The Hub</h1>
        </a>

        <!-- User avatar button -->
        <div class="relative flex items-center flex-shrink-0 p-2" x-data="{ isOpen: false }">
          <button
            @click="isSubHeaderOpen = !isSubHeaderOpen"
            class="transition-opacity rounded-lg opacity-80 hover:opacity-100 focus:outline-none focus:ring focus:ring-indigo-600 focus:ring-offset-white focus:ring-offset-2"
          >
            <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
              {{ authStore.user?.email?.charAt(0).toUpperCase() }}
            </div>
          </button>
        </div>
      </nav>

      <!-- Left mini bar -->
      <nav
        aria-label="Options"
        class="z-20 flex-col items-center flex-shrink-0 hidden w-16 py-4 bg-white border-r border-gray-200 shadow-md sm:flex rounded-tr-3xl rounded-br-3xl"
      >
        <!-- Logo -->
        <div class="flex-shrink-0 py-4">
          <a href="#">
            <img :src="faviconIcon" alt="The Hub Realtors" class="w-8 h-8" />
          </a>
        </div>
        <div class="flex flex-col items-center flex-1 p-2 space-y-4">
          <!-- Menu button -->
          <button
            @click="isSidebarOpen = !isSidebarOpen"
            class="p-2 transition-colors rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 bg-secondary-50"
            :class="isSidebarOpen ? 'text-primary-600' : 'text-primary-600'"
          >
            <span class="sr-only">Toggle sidebar</span>
            <svg
              aria-hidden="true"
              class="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        </div>

        <!-- User avatar -->
        <div class="relative flex items-center flex-shrink-0 p-2">
          <button
            @click="isSettingsPanelOpen = !isSettingsPanelOpen"
            class="transition-opacity rounded-lg opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
          >
            <div class="w-10 h-10 rounded-lg bg-secondary-50 flex items-center justify-center text-primary-600">
              {{ authStore.user?.email?.charAt(0).toUpperCase() }}
            </div>
          </button>
        </div>
      </nav>

      <!-- Sidebar panel -->
      <div
        v-show="isSidebarOpen"
        class="fixed inset-y-0 left-0 z-10 flex-shrink-0 w-64 bg-white border-r border-gray-200 shadow-lg sm:left-16 rounded-tr-3xl rounded-br-3xl sm:w-72 lg:static lg:w-64"
      >
        <nav class="flex flex-col h-full">
          <!-- Logo -->
          <div class="flex items-center justify-center flex-shrink-0 py-10">
            <a href="#">
              <img :src="logoNome" alt="The Hub Realtors" class="h-12 w-auto" />
            </a>
          </div>

          <!-- Links -->
          <div class="flex-1 px-4 space-y-2 overflow-hidden hover:overflow-auto">
            <router-link
              v-for="item in navigation"
              :key="item.name"
              :to="item.path"
              class="flex items-center space-x-2 text-gray-600 transition-colors rounded-lg group border border-transparent"
              :class="$route.path === item.path 
                ? 'bg-primary-600 hover:border-secondary-50' 
                : 'hover:bg-white hover:border-secondary-50'"
            >
              <span
                aria-hidden="true"
                class="p-2 transition-colors rounded-lg text-gray-500"
                :class="$route.path === item.path ? 'text-secondary-50' : 'group-hover:text-primary-600'"
              >
                <svg
                  class="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
                </svg>
              </span>
              <span :class="$route.path === item.path ? 'text-secondary-50 font-medium' : ''">{{ item.name }}</span>
            </router-link>
          </div>

          <!-- Logout button -->
          <div class="flex-shrink-0 p-4">
            <button
              @click="handleLogout"
              class="flex items-center w-full space-x-2 text-gray-600 transition-colors rounded-lg border border-transparent hover:bg-white hover:border-secondary-50 group"
            >
              <span aria-hidden="true" class="p-2 transition-colors rounded-lg text-gray-500 group-hover:text-primary-600">
                <svg
                  class="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </span>
              <span class="group-hover:text-primary-600">Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex flex-col flex-1">
      <header class="relative flex items-center justify-between flex-shrink-0 p-4">
        <form action="#" class="flex-1">
          <!-- Search form if needed -->
        </form>
      </header>

      <main class="flex-1 px-4 py-8">
        <slot></slot>
      </main>
    </div>

    <!-- Settings Panel -->
    <div
      v-show="isSettingsPanelOpen"
      class="fixed inset-0 bg-black bg-opacity-50"
      @click="isSettingsPanelOpen = false"
    ></div>
    <section
      v-show="isSettingsPanelOpen"
      class="fixed inset-y-0 right-0 w-64 bg-white border-l border-indigo-100 rounded-l-3xl"
    >
      <div class="px-4 py-8">
        <h2 class="text-lg font-semibold">Settings</h2>
        <!-- Add settings content here -->
      </div>
    </section>
  </div>
</template>

<style scoped>
.shadow-t {
  box-shadow: 0 -1px 3px 0 rgba(0, 0, 0, 0.1), 0 -1px 2px 0 rgba(0, 0, 0, 0.06);
}

:root {
  --primary-600: #012928;
  --primary-700: #011f26;
  --primary-800: #011521;
  --primary-50: #f7fafc;
  --primary-100: #e2e8f0;
  --secondary-50: #f7fafc;
}
</style>