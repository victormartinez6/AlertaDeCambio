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
        if (!authStore.user?.uid) {
          throw new Error('Usuário não autenticado')
        }

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
          userId: authStore.user.uid,
          criadoEm: new Date().toISOString(),
          produto: dados.produto,
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
        const authStore = useAuthStore()
        if (!authStore.user?.uid) {
          throw new Error('Usuário não autenticado')
        }

        const q = query(
          collection(db, 'alertas'),
          where('userId', '==', authStore.user.uid)
        )
        
        const querySnapshot = await getDocs(q)
        
        // Filtramos os inativos e ordenamos por criadoEm na memória
        this.alertas = querySnapshot.docs
          .map(doc => {
            const data = doc.data()
            // Trata diferentes formatos de data
            let criadoEm: Date
            if (data.criadoEm) {
              if (typeof data.criadoEm.toDate === 'function') {
                // É um Timestamp do Firestore
                criadoEm = data.criadoEm.toDate()
              } else if (data.criadoEm instanceof Date) {
                // Já é um Date
                criadoEm = data.criadoEm
              } else if (typeof data.criadoEm === 'string') {
                // É uma string de data
                criadoEm = new Date(data.criadoEm)
              } else {
                // Fallback para data atual
                criadoEm = new Date()
              }
            } else {
              criadoEm = new Date()
            }

            return {
              id: doc.id,
              ...data,
              ativo: data.ativo ?? true,
              criadoEm
            }
          })
          .filter(alerta => alerta.ativo !== false)
          .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime()) as AlertaData[]

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
        const alertaRef = doc(db, 'alertas', id)
        
        // Primeiro busca o documento atual
        const docSnap = await getDoc(alertaRef)
        if (!docSnap.exists()) {
          throw new Error('Alerta não encontrado')
        }

        // Se estiver atualizando o status do webhook, adiciona ao histórico
        if (dados.webhookDisparado && dados.horarioDisparo && dados.cotacaoDisparo) {
          const dadosAtuais = docSnap.data() as AlertaData
          
          // Inicializa ou adiciona ao histórico de disparos
          const historicoDisparos = dadosAtuais.historicoDisparos || []
          historicoDisparos.push({
            horario: dados.horarioDisparo,
            cotacao: dados.cotacaoDisparo,
            mensagem: `Cotação atingiu o alvo de ${dados.cotacaoDisparo}`
          })
          
          dados.historicoDisparos = historicoDisparos
        }

        // Atualiza o documento
        await updateDoc(alertaRef, {
          ...dados,
          atualizadoEm: new Date()
        })

        // Atualiza o estado local
        const index = this.alertas.findIndex(a => a.id === id)
        if (index !== -1) {
          this.alertas[index] = {
            ...this.alertas[index],
            ...dados,
            atualizadoEm: new Date()
          }
        }

        return true
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
