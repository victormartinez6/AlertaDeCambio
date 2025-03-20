<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import logoFull from '../assets/images/The Hub Realtors_Logo.svg';
import bgLogin from '../assets/images/background_login.jpg';
import logoIcon from '../assets/images/The Hub Realtors_Logo_Icon.svg';
import bgRegister from '../assets/images/background_register.jpg';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleSubmit = async (e: Event) => {
  e.preventDefault();
  loading.value = true;
  error.value = '';

  try {
    await authStore.login(email.value, password.value);
    router.push('/');
  } catch (err) {
    error.value = 'Invalid email or password';
  } finally {
    loading.value = false;
  }
};

const handleGoogleLogin = async () => {
  loading.value = true;
  error.value = '';

  try {
    await authStore.googleLogin();
    router.push('/');
  } catch (err) {
    error.value = 'Error signing in with Google';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section class="flex flex-col md:flex-row h-screen items-center">
    <div class="hidden lg:block w-full md:w-1/2 xl:w-2/3 h-screen">
      <img :src="bgLogin" alt="" class="w-full h-full object-cover">
    </div>

    <div class="bg-white w-full md:max-w-md lg:max-w-full md:mx-auto md:mx-0 md:w-1/2 xl:w-1/3 h-screen px-6 lg:px-16 xl:px-12
          flex items-center justify-center">
      <div class="w-full h-100">
        <div class="flex justify-center mb-12">
          <img :src="logoFull" alt="The Hub Realtors" class="h-48 w-auto" />
        </div>

        <form class="mt-6" @submit.prevent="handleSubmit">
          <div v-if="error" class="mb-4 text-red-500">{{ error }}</div>
          
          <div>
            <label class="block text-gray-700">Email</label>
            <input 
              v-model="email"
              type="email" 
              placeholder="Digite seu email" 
              class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-secondary-50 focus:bg-white focus:outline-none" 
              autofocus 
              required
            >
          </div>

          <div class="mt-4">
            <label class="block text-gray-700">Senha</label>
            <input 
              v-model="password"
              type="password" 
              placeholder="Digite sua senha" 
              minlength="6" 
              class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border focus:border-secondary-50 focus:bg-white focus:outline-none" 
              required
            >
          </div>

          <div class="text-right mt-2">
            <a href="#" class="text-sm font-semibold text-gray-700 hover:text-primary-600 focus:text-primary-600">Esqueceu a senha?</a>
          </div>

          <button 
            type="submit" 
            class="w-full block bg-primary-600 hover:bg-primary-700 focus:bg-primary-700 text-white font-semibold rounded-lg px-4 py-3 mt-6"
            :disabled="loading"
          >
            {{ loading ? 'Carregando...' : 'Entrar' }}
          </button>
        </form>

        <hr class="my-6 border-gray-300 w-full">

        <p class="mt-8 text-center">Precisa de uma conta? <a href="#" class="text-primary-600 hover:text-primary-700 font-semibold">Criar conta</a></p>

      </div>
    </div>
  </section>
</template>