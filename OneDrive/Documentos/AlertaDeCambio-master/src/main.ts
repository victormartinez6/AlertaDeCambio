import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Importando estilos
import './assets/main.css'
import 'flag-icons/css/flag-icons.min.css'

// Criando a instância do Pinia
const pinia = createPinia()

// Criando a aplicação Vue
const app = createApp(App)

// Registrando plugins
app.use(router)
app.use(pinia)

// Inicializando a autenticação
const authStore = pinia.state.value?.auth
if (authStore) {
  authStore.init()
}

// Montando a aplicação
app.mount('#app')
