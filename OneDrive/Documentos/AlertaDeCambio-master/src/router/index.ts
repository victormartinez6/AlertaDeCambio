import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Views públicas
import Cotacoes from '@/views/Cotacoes.vue'
import MeusAlertas from '@/views/MeusAlertas.vue'
import AlertaForm from '@/views/AlertaForm.vue'

// Views da área do agente
import AgenteLayout from '@/layouts/AgenteLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Rotas públicas
    { 
      path: '/', 
      name: 'home',
      component: Cotacoes 
    },
    { 
      path: '/alertas', 
      name: 'alertas',
      component: MeusAlertas 
    },
    { 
      path: '/novo-alerta', 
      name: 'novo-alerta',
      component: AlertaForm 
    },
    
    // Rotas da área do agente
    {
      path: '/agente',
      component: AgenteLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/agente/dashboard'
        },
        {
          path: 'dashboard',
          name: 'agente-dashboard',
          component: () => import('@/views/agente/Dashboard.vue')
        },
        {
          path: 'alertas',
          name: 'agente-alertas',
          component: () => import('@/views/agente/Alertas.vue')
        },
        {
          path: 'webhook',
          name: 'webhook',
          component: () => import('@/views/agente/Webhook.vue')
        },
        {
          path: 'configuracoes',
          name: 'configuracoes',
          component: () => import('@/views/agente/Configuracoes.vue')
        }
      ]
    },

    // Rota de fallback
    { 
      path: '/:pathMatch(.*)*', 
      redirect: '/' 
    }
  ]
})

// Guarda de navegação para proteger rotas
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      next('/')
    } else if (!authStore.isAgent) {
      next('/')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
