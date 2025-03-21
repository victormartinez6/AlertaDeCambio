import { defineStore } from 'pinia'
import axios from 'axios'

interface Cotacao {
  moeda: string
  valor: number
  data: Date
}

export const useCotacoesStore = defineStore('cotacoes', {
  state: () => ({
    cotacoes: [] as Cotacao[],
    loading: false,
    error: null as string | null
  }),

  actions: {
    async fetchCotacoes() {
      this.loading = true
      this.error = null
      try {
        // Substitua pela sua API real de cotações
        const response = await axios.get('/api/cotacoes')
        this.cotacoes = response.data
      } catch (error) {
        this.error = 'Erro ao carregar cotações'
        console.error('Erro:', error)
      } finally {
        this.loading = false
      }
    }
  }
})