import { defineStore } from 'pinia'
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, where } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuthStore } from './auth'

export interface AlertaData {
  id?: string
  nome: string
  email: string | null
  whatsapp: string | null
  ddi: string | null
  moeda: string
  cotacaoAlvo: number
  produto: string
  notificarEmail: boolean
  notificarWhatsapp: boolean
  ativo: boolean
  webhook?: string | null
  dataLimite?: string | null
  criadoEm?: string
  atualizadoEm?: string
  webhookDisparado?: boolean
  horarioDisparo?: string
  cotacaoDisparo?: number
}

export const useAlertasStore = defineStore('alertas', {
  state: () => ({
    alertas: [] as AlertaData[],
    loading: false,
    error: null as string | null
  }),

  actions: {
    async criarAlerta(dados: Partial<AlertaData>) {
      this.loading = true
      this.error = null
      
      try {
        const alerta = {
          nome: dados.nome || '',
          moeda: dados.moeda || '',
          cotacaoAlvo: Number(dados.cotacaoAlvo) || 0,
          email: dados.email || null,
          whatsapp: dados.whatsapp || null,
          ddi: dados.ddi || null,
          webhook: dados.webhook || null,
          notificarEmail: Boolean(dados.notificarEmail),
          notificarWhatsapp: Boolean(dados.notificarWhatsapp),
          ativo: true,
          criadoEm: new Date().toISOString(),
          produto: dados.produto || 'turismo',
          dataLimite: dados.dataLimite || new Date().toISOString().split('T')[0]
        }

        const alertasRef = collection(db, 'alertas')
        const docRef = await addDoc(alertasRef, alerta)

        // Atualiza a lista de alertas após criar
        await this.listarAlertas()

        return docRef.id
      } catch (error: any) {
        console.error('Erro ao criar alerta:', error)
        this.error = error.message || 'Erro ao criar alerta. Tente novamente mais tarde.'
        throw error
      } finally {
        this.loading = false
      }
    },

    async listarAlertas() {
      this.loading = true
      this.error = null
      
      try {
        const q = query(
          collection(db, 'alertas'),
          orderBy('criadoEm', 'desc')
        )
        
        const querySnapshot = await getDocs(q)
        this.alertas = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AlertaData[]
      } catch (error: any) {
        console.error('Erro ao listar alertas:', error)
        this.error = 'Erro ao carregar alertas. Tente novamente mais tarde.'
        throw error
      } finally {
        this.loading = false
      }
    },

    async atualizarAlerta(id: string, dados: Partial<AlertaData>) {
      try {
        console.log('Atualizando alerta:', { id, dados })
        const alertaRef = doc(db, 'alertas', id)
        
        const dadosAtualizacao = {
          ...dados,
          atualizadoEm: new Date().toISOString()
        }
        
        await updateDoc(alertaRef, dadosAtualizacao)
        console.log('Alerta atualizado com sucesso')
        
        // Atualiza o estado local
        const index = this.alertas.findIndex(a => a.id === id)
        if (index !== -1) {
          this.alertas[index] = {
            ...this.alertas[index],
            ...dadosAtualizacao
          }
        }
      } catch (error) {
        console.error('Erro ao atualizar alerta:', error)
        throw error
      }
    },

    async excluirAlerta(id: string) {
      try {
        await deleteDoc(doc(db, 'alertas', id))
        this.alertas = this.alertas.filter(alerta => alerta.id !== id)
      } catch (error) {
        console.error('Erro ao excluir alerta:', error)
        throw error
      }
    },

    async editarAlerta(id: string, dados: Partial<AlertaData>) {
      this.loading = true
      this.error = null

      try {
        const alertaRef = doc(db, 'alertas', id)
        const dadosAtualizados = {
          nome: dados.nome,
          moeda: dados.moeda,
          cotacaoAlvo: Number(dados.cotacaoAlvo),
          email: dados.email || null,
          whatsapp: dados.whatsapp || null,
          ddi: dados.ddi || null,
          webhook: dados.webhook || null,
          notificarEmail: Boolean(dados.notificarEmail),
          notificarWhatsapp: Boolean(dados.notificarWhatsapp),
          produto: dados.produto,
          dataLimite: dados.dataLimite,
          ativo: dados.ativo
        }

        await updateDoc(alertaRef, dadosAtualizados)

        // Atualiza a lista de alertas após editar
        await this.listarAlertas()
      } catch (error: any) {
        console.error('Erro ao editar alerta:', error)
        this.error = error.message || 'Erro ao editar alerta. Tente novamente mais tarde.'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
