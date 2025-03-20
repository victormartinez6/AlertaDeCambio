import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import fetch from 'node-fetch'

// Interfaces
interface AlertaData {
  id?: string
  userId: string
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

interface CotacaoInfo {
  bid: string
  [key: string]: any
}

interface CotacoesResponse {
  [moeda: string]: CotacaoInfo
}

// Inicializa o admin do Firebase
if (!admin.apps.length) {
  admin.initializeApp()
}

// Função para buscar cotações da API
async function buscarCotacoes(): Promise<CotacoesResponse> {
  try {
    const response = await fetch('https://economia.awesomeapi.com.br/json/all')
    const data = await response.json() as CotacoesResponse
    return data
  } catch (error) {
    console.error('Erro ao buscar cotações:', error)
    throw error
  }
}

// Função para calcular cotação final com base no produto
function calcularCotacaoFinal(moeda: string, cotacaoBase: number, produto: string): number {
  // Taxas por moeda (mover para configuração no Firestore depois)
  const taxas: { [key: string]: number } = {
    'USD': 1,
    'EUR': 2,
    'GBP': 3
  }

  const taxa = taxas[moeda] || 1
  return cotacaoBase * (1 + taxa / 100)
}

// Cloud Function que verifica os alertas a cada minuto
export const verificarAlertas = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    console.log('Iniciando verificação de alertas...')

    try {
      // Busca cotações atualizadas
      const cotacoes = await buscarCotacoes()
      
      // Busca todos os alertas ativos que ainda não foram disparados
      const alertasSnapshot = await admin.firestore()
        .collection('alertas')
        .where('ativo', '==', true)
        .where('webhookDisparado', '==', false)
        .get()

      console.log(`Encontrados ${alertasSnapshot.size} alertas para verificar`)

      // Para cada alerta
      for (const doc of alertasSnapshot.docs) {
        const alerta = { id: doc.id, ...doc.data() } as AlertaData
        console.log('Verificando alerta:', alerta.id)

        // Pega a cotação base da API
        const cotacaoInfo = cotacoes[alerta.moeda]
        if (!cotacaoInfo) {
          console.log(`Cotação não encontrada para ${alerta.moeda}`)
          continue
        }

        // Calcula cotação final
        const cotacaoBase = parseFloat(cotacaoInfo.bid)
        const cotacaoFinal = calcularCotacaoFinal(alerta.moeda, cotacaoBase, alerta.produto)
        const cotacaoAlvo = Number(alerta.cotacaoAlvo)

        console.log(`Cotação final para ${alerta.moeda}: ${cotacaoFinal} (alvo: ${cotacaoAlvo})`)

        // Se atingiu o alvo
        if (cotacaoFinal <= cotacaoAlvo) {
          console.log('Cotação atingiu o alvo! Buscando webhooks...')

          // Busca webhooks do usuário
          const webhooksSnapshot = await admin.firestore()
            .collection('webhooks')
            .where('userId', '==', alerta.userId)
            .where('events', 'array-contains', 'alert.triggered')
            .get()

          // Prepara o payload
          const webhookPayload = {
            event: 'alert.triggered',
            data: {
              ...alerta,
              cotacaoAtual: cotacaoFinal,
              horario: new Date().toISOString(),
              mensagem: `A cotação atual (${cotacaoFinal}) atingiu ou ficou abaixo da cotação alvo (${cotacaoAlvo})!`
            },
            timestamp: new Date().toISOString()
          }

          // Dispara para cada webhook configurado
          const promises = webhooksSnapshot.docs.map(async (webhookDoc) => {
            const webhook = webhookDoc.data()
            console.log(`Disparando webhook ${webhookDoc.id} para URL ${webhook.url}`)

            try {
              const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Webhook-Event': 'alert.triggered'
                },
                body: JSON.stringify(webhookPayload)
              })

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
              }

              console.log(`Webhook ${webhookDoc.id} disparado com sucesso`)
            } catch (error) {
              console.error(`Erro ao disparar webhook ${webhookDoc.id}:`, error)
            }
          })

          // Aguarda todos os webhooks serem disparados
          await Promise.all(promises)

          // Marca o alerta como disparado
          await doc.ref.update({
            webhookDisparado: true,
            horarioDisparo: new Date().toISOString(),
            cotacaoDisparo: cotacaoFinal
          })

          console.log(`Alerta ${alerta.id} marcado como disparado`)
        }
      }

      console.log('Verificação de alertas concluída')
      return null
    } catch (error) {
      console.error('Erro ao verificar alertas:', error)
      return null
    }
  })
