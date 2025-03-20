import { defineStore } from 'pinia'
import { auth } from '@/config/firebase'
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAgent: (state) => state.user?.email?.endsWith('@cambiohoje.com.br') || false
  },

  actions: {
    init() {
      // Observar mudanças no estado de autenticação
      onAuthStateChanged(auth, (user) => {
        this.user = user
      })
    },

    async login(email: string, password: string) {
      this.loading = true
      this.error = null

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        this.user = userCredential.user
        
        if (!this.isAgent) {
          await this.signOut()
          throw new Error('Acesso permitido apenas para agentes do Câmbio Hoje')
        }
      } catch (error: any) {
        console.error('Erro no login:', error)
        
        switch (error.code) {
          case 'auth/invalid-email':
            this.error = 'Email inválido'
            break
          case 'auth/user-disabled':
            this.error = 'Usuário desabilitado'
            break
          case 'auth/user-not-found':
            this.error = 'Usuário não encontrado'
            break
          case 'auth/wrong-password':
            this.error = 'Senha incorreta'
            break
          default:
            this.error = 'Erro ao fazer login. Tente novamente mais tarde.'
        }
        
        throw error
      } finally {
        this.loading = false
      }
    },

    async signOut() {
      try {
        await signOut(auth)
        this.user = null
      } catch (error) {
        console.error('Erro ao fazer logout:', error)
        this.error = error.message || 'Erro ao fazer logout'
        throw error
      }
    }
  }
})
