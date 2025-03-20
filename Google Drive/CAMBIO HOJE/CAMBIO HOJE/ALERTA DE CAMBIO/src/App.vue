<template>
  <div class="min-h-screen bg-gray-50 relative">
    <!-- Modal de Login -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showLoginModal" class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div 
          class="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl w-full max-w-md p-8 border border-white/20 transform transition-all"
          @click.stop
        >
          <!-- Conteúdo do Login -->
          <div class="text-center mb-8">
            <img 
              src="@/assets/Logo_Cambio_Hoje.svg" 
              alt="Logo Câmbio Hoje" 
              class="h-16 w-auto mx-auto mb-4"
            />
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Área do Agente</h2>
            <p class="text-gray-600">Acesso restrito a colaboradores</p>
          </div>

          <!-- Mensagem de Erro -->
          <div v-if="authStore.error" class="mb-6 p-4 rounded-lg bg-red-50 border border-red-100">
            <p class="text-sm text-red-600">{{ authStore.error }}</p>
          </div>

          <!-- Formulário -->
          <form @submit.prevent="handleLogin" class="space-y-6">
            <div>
              <input
                v-model="loginData.email"
                type="email"
                placeholder="Email corporativo"
                class="w-full px-4 py-3 rounded-lg bg-white/50 border border-gray-200 focus:ring-2 focus:ring-[#654CF0] focus:border-transparent transition-all"
                required
              >
            </div>
            
            <div>
              <input
                v-model="loginData.password"
                type="password"
                placeholder="Senha"
                class="w-full px-4 py-3 rounded-lg bg-white/50 border border-gray-200 focus:ring-2 focus:ring-[#654CF0] focus:border-transparent transition-all"
                required
              >
            </div>

            <button 
              type="submit"
              class="w-full bg-gradient-to-r from-[#654CF0] to-[#8B76FF] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="authStore.loading"
            >
              <span v-if="!authStore.loading" class="flex items-center justify-center gap-2">
                <LockClosedIcon class="h-5 w-5" />
                Acessar
              </span>
              <span v-else class="flex items-center justify-center gap-2">
                <ArrowPathIcon class="h-5 w-5 animate-spin" />
                Entrando...
              </span>
            </button>
          </form>

          <!-- Fechar Modal -->
          <button 
            @click="closeModal"
            class="absolute top-4 right-4 text-gray-400 hover:text-[#654CF0] transition-colors"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Menu e Conteúdo -->
    <header class="bg-white border-b border-gray-200">
      <nav class="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8" aria-label="Global">
        <div class="flex h-20 items-center justify-between">
          <!-- Logo -->
          <div class="flex lg:flex-1">
            <router-link :to="{ name: 'home' }" class="flex items-center">
              <img 
                src="@/assets/Logo_Cambio_Hoje.svg" 
                alt="Logo Câmbio Hoje" 
                class="h-12 w-auto"
              />
            </router-link>
          </div>

          <!-- Menu -->
          <div class="flex items-center gap-2">
            <template v-if="!authStore.isAuthenticated">
              <button 
                @click="openModal"
                class="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#654CF0] to-[#8B76FF] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <LockClosedIcon class="h-5 w-5" />
                Área do Agente
              </button>
            </template>
            <template v-else>
              <div class="hidden md:flex md:items-center">
                <router-link
                  :to="{ name: 'agente-dashboard' }"
                  class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                  :class="{ 'bg-gray-50 text-primary-600 font-semibold': $route.name === 'agente-dashboard' }"
                >
                  <HomeIcon class="h-5 w-5 mr-1.5" />
                  Dashboard
                </router-link>

                <router-link
                  to="/agente/alertas"
                  class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                  :class="{ 'bg-gray-50 text-primary-600 font-semibold': $route.path.includes('/agente/alertas') && !$route.path.includes('/novo') }"
                >
                  <BellAlertIcon class="h-5 w-5 mr-1.5" />
                  Lista de Alertas
                </router-link>

                <router-link
                  to="/agente/webhook"
                  class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                  :class="{ 'bg-gray-50 text-primary-600 font-semibold': $route.path.includes('/agente/webhook') }"
                >
                  <BoltIcon class="h-5 w-5 mr-1.5" />
                  Webhook
                </router-link>

                <router-link
                  to="/agente/configuracoes"
                  class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                  :class="{ 'bg-gray-50 text-primary-600 font-semibold': $route.path.includes('/agente/configuracoes') }"
                >
                  <Cog6ToothIcon class="h-5 w-5 mr-1.5" />
                  Configurações
                </router-link>

                <router-link
                  to="/agente/alertas/novo"
                  class="ml-2 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  <PlusIcon class="h-5 w-5 mr-1.5" />
                  Novo Alerta
                </router-link>

                <div class="h-8 w-px bg-gray-200 mx-4"></div>

                <button
                  @click="handleLogout"
                  class="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <ArrowRightOnRectangleIcon class="h-5 w-5 mr-1.5" />
                  Sair
                </button>
              </div>
            </template>
          </div>
        </div>
      </nav>
    </header>

    <!-- Conteúdo -->
    <main>
      <RouterView class="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8" />
    </main>

    <!-- Notificações -->
    <NotificationManager />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAlertasStore } from '@/stores/alertas'
import { useCotacoesTempoReal } from '@/utils/cotacoes'
import { dispatchWebhookEvent } from '@/services/webhookService'
import { UserIcon, XMarkIcon, LockClosedIcon, ArrowPathIcon, HomeIcon, BellAlertIcon, PlusIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon, BoltIcon } from '@heroicons/vue/24/outline'
import { RouterLink, RouterView } from 'vue-router'
import NotificationManager from '@/components/NotificationManager.vue'

const router = useRouter()
const authStore = useAuthStore()
const alertasStore = useAlertasStore()
const cotacoesService = useCotacoesTempoReal()
const showLoginModal = ref(false)
const loginData = ref({
  email: '',
  password: ''
})
const intervalId = ref<number | null>(null)

// Inicializa o store de autenticação
authStore.init()

function openModal() {
  showLoginModal.value = true
}

function closeModal() {
  showLoginModal.value = false
  loginData.value = {
    email: '',
    password: ''
  }
}

async function handleLogin() {
  try {
    await authStore.login(loginData.value.email, loginData.value.password)
    closeModal()
    router.push('/agente/dashboard')
  } catch (error) {
    console.error('Erro no login:', error)
  }
}

async function handleLogout() {
  try {
    await authStore.signOut()
    router.push('/')
  } catch (error) {
    console.error('Erro no logout:', error)
  }
}

// Função para verificar um alerta específico
const verificarAlerta = async (alerta: any) => {
  try {
    // Usar o mesmo método de cálculo da tela de configurações
    const cotacaoFinal = cotacoesService.calcularCotacaoFinal(alerta.moeda)
    const cotacaoAlvo = Number(alerta.cotacaoAlvo)
    
    console.log(`[App] Cotação final calculada para ${alerta.moeda}:`, cotacaoFinal)
    console.log(`[App] Cotação alvo para ${alerta.moeda}:`, cotacaoAlvo)
    
    if (cotacaoFinal > 0 && cotacaoFinal <= cotacaoAlvo) {
      // Verifica se o webhook já foi disparado para este alerta
      if (alerta.webhookDisparado) {
        console.log('[App] Webhook já foi disparado anteriormente para este alerta')
        return
      }

      console.log('[App] Cotação atingiu o alvo! Disparando webhook...')

      const webhookPayload = {
        ...alerta,
        cotacaoAtual: cotacaoFinal,
        horario: new Date().toISOString(),
        mensagem: `A cotação atual (${cotacaoFinal}) atingiu ou ficou abaixo da cotação alvo (${cotacaoAlvo})!`
      }
      
      console.log('[App] Preparando payload do webhook:', webhookPayload)
      
      // Disparar webhook via webhookService (sem verificar usuário)
      await dispatchWebhookEvent(alerta.userId, 'alert.triggered', webhookPayload)

      // Marca o alerta como já disparado e salva o horário
      await alertasStore.atualizarAlerta(alerta.id, {
        webhookDisparado: true,
        horarioDisparo: new Date().toISOString(),
        cotacaoDisparo: cotacaoFinal
      })

      console.log('[App] Webhook disparado com sucesso!')
    }
  } catch (error) {
    console.error('[App] Erro ao verificar alerta:', error)
  }
}

// Função para verificar todos os alertas
const verificarAlertas = async () => {
  console.log('[App] Verificando alertas...')
  
  try {
    // Busca cotações atualizadas
    await cotacoesService.buscarCotacoes()
    
    // Busca alertas atualizados
    await alertasStore.listarAlertas()
    
    // Verifica cada alerta
    for (const alerta of alertasStore.alertas) {
      if (alerta.ativo && !alerta.webhookDisparado) {
        await verificarAlerta(alerta)
      }
    }
  } catch (error) {
    console.error('[App] Erro ao verificar alertas:', error)
  }
}

// Inicia a verificação periódica
const iniciarVerificacaoPeriodica = () => {
  console.log('[App] Iniciando verificação periódica de alertas...')
  // Verifica a cada 30 segundos
  intervalId.value = window.setInterval(verificarAlertas, 30000)
}

// Para a verificação periódica
const pararVerificacaoPeriodica = () => {
  if (intervalId.value) {
    console.log('[App] Parando verificação periódica de alertas...')
    window.clearInterval(intervalId.value)
    intervalId.value = null
  }
}

// Quando o componente é montado, inicia imediatamente
onMounted(async () => {
  console.log('[App] Montando App.vue...')
  await verificarAlertas() // Verifica imediatamente
  iniciarVerificacaoPeriodica() // Inicia verificação periódica
})

// Limpar intervalo ao desmontar o componente
onUnmounted(() => {
  pararVerificacaoPeriodica()
})
</script>
