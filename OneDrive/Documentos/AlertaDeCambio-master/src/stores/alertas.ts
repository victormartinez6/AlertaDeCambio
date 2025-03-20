import { defineStore } from 'pinia'
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, where, getDoc } from 'firebase/firestore'
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
  cotacaoAtualNaCriacao: number
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
  userId: string
  historicoDisparos?: {
    horario: string
    cotacao: number
    mensagem?: string
  }[]
}

export const useAlertasStore = defineStore('alertas', {
  state: () => ({
    alertas: [] as AlertaData[],
    loading: false,
    error: null as string | null,
    webhookAtivo: false,
    mensagemWebhook: ''
  }),

  actions: {
    async criarAlerta(dados: Partial<AlertaData>) {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        const userId = authStore.user?.uid || 'anonymous-' + new Date().getTime()

        const alerta = {
          nome: dados.nome || '',
          moeda: dados.moeda || '',
          cotacaoAlvo: Number(dados.cotacaoAlvo) || 0,
          cotacaoAtualNaCriacao: Number(dados.cotacaoAtualNaCriacao) || 0,
          email: dados.email || null,
          whatsapp: dados.whatsapp || null,
          ddi: dados.ddi || null,
          webhook: dados.webhook || null,
          notificarEmail: Boolean(dados.notificarEmail),
          notificarWhatsapp: Boolean(dados.notificarWhatsapp),
          ativo: true,
          webhookDisparado: false,
          userId: userId,
          criadoEm: new Date().toISOString(),
          produto: dados.produto,
          dataLimite: dados.dataLimite || null
        }

        if (userId.startsWith('anonymous-') && dados.webhook) {
          alerta.webhook = dados.webhook
        }

        const alertasRef = collection(db, 'alertas')
        const docRef = await addDoc(alertasRef, alerta)

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
        const authStore = useAuthStore()
        const userId = authStore.user?.uid
        const alertasRef = collection(db, 'alertas')

        // Primeiro, excluir alertas expirados
        const hoje = new Date().toISOString().split('T')[0]
        const qExpirados = query(
          alertasRef,
          where('dataLimite', '<', hoje),
          where('dataLimite', '!=', null)
        )
        const snapshotExpirados = await getDocs(qExpirados)
        const promisesExcluir = snapshotExpirados.docs.map(doc => deleteDoc(doc.ref))
        await Promise.all(promisesExcluir)

        // Depois, buscar alertas ativos
        let q
        if (userId) {
          q = query(
            alertasRef,
            where('userId', '==', userId),
            orderBy('criadoEm', 'desc')
          )
        } else {
          const timeThreshold = new Date()
          timeThreshold.setHours(timeThreshold.getHours() - 24)
          
          q = query(
            alertasRef,
            where('userId', '>=', 'anonymous-'),
            where('userId', '<', 'anonymous-\uf8ff'),
            where('criadoEm', '>=', timeThreshold.toISOString()),
            orderBy('criadoEm', 'desc')
          )
        }

        const snapshot = await getDocs(q)
        this.alertas = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            criadoEm: data.criadoEm || new Date().toISOString()
          }
        }) as AlertaData[]

      } catch (error: any) {
        console.error('Erro ao listar alertas:', error)
        this.error = error.message || 'Erro ao listar alertas. Tente novamente mais tarde.'
      } finally {
        this.loading = false
      }
    },

    async excluirAlerta(id: string) {
      try {
        await deleteDoc(doc(db, 'alertas', id))
        await this.listarAlertas()
      } catch (error) {
        console.error('Erro ao excluir alerta:', error)
        throw error
      }
    },

    async atualizarAlerta(id: string, dados: Partial<AlertaData>) {
      try {
        const alertaRef = doc(db, 'alertas', id)
        const alertaDoc = await getDoc(alertaRef)
        
        if (!alertaDoc.exists()) {
          throw new Error('Alerta não encontrado')
        }

        const alertaAtual = alertaDoc.data() as AlertaData
        const historicoDisparos = alertaAtual.historicoDisparos || []

        if (dados.webhookDisparado && !alertaAtual.webhookDisparado) {
          historicoDisparos.push({
            horario: new Date().toISOString(),
            cotacao: dados.cotacaoDisparo || 0,
            mensagem: 'Alerta disparado'
          })
        }

        await updateDoc(alertaRef, {
          ...dados,
          historicoDisparos,
          atualizadoEm: new Date().toISOString()
        })

        await this.listarAlertas()
      } catch (error: any) {
        console.error('Erro ao atualizar alerta:', error)
        throw error
      }
    },

    notificarWebhook(mensagem: string) {
      this.webhookAtivo = true
      this.mensagemWebhook = mensagem
      
      // Resetar após 5 segundos
      setTimeout(() => {
        this.webhookAtivo = false
        this.mensagemWebhook = ''
      }, 5000)
    }
  }
})
