import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { useCotacoesTempoReal } from '../../src/utils/cotacoes'

// Horários de disparo (UTC)
const DISPATCH_TIMES = [
  { hour: 12, minute: 0 },  // 9:00 AM EDT (UTC-4)
  { hour: 17, minute: 0 },  // 1:00 PM EDT (UTC-4)
  { hour: 20, minute: 0 },  // 4:00 PM EDT (UTC-4)
]

// Função para verificar alertas e enviar notificações
async function checkAlertsAndNotify() {
  try {
    const db = admin.firestore()
    const alertasRef = db.collection('alertas')
    const alertas = await alertasRef.where('ativo', '==', true).get()

    const { calcularCotacaoFinalComBase, buscarCotacoes, taxas } = useCotacoesTempoReal()
    await buscarCotacoes()

    for (const doc of alertas.docs) {
      const alerta = doc.data()
      
      // Buscar cotação atual
      let cotacaoBase
      if (alerta.produto === 'turismo') {
        cotacaoBase = taxas.value?.cotacoesTurismo?.[alerta.moeda]?.venda
      } else {
        cotacaoBase = taxas.value?.cotacoesComercial?.[alerta.moeda]?.ask
      }

      if (cotacaoBase) {
        const cotacaoAtual = calcularCotacaoFinalComBase(alerta.moeda, cotacaoBase)
        
        // Verificar se atingiu a cotação alvo
        const atingiuAlvo = alerta.tipoAlerta === 'acima' 
          ? cotacaoAtual >= alerta.cotacaoAlvo
          : cotacaoAtual <= alerta.cotacaoAlvo

        if (atingiuAlvo) {
          // Preparar dados para o webhook
          const webhookData = {
            id: doc.id,
            nome: alerta.nome,
            produto: alerta.produto,
            moeda: alerta.moeda,
            cotacaoAlvo: alerta.cotacaoAlvo,
            cotacaoAtual: cotacaoAtual,
            tipoAlerta: alerta.tipoAlerta,
            email: alerta.email,
            whatsapp: alerta.whatsapp ? `+${alerta.ddi}${alerta.whatsapp}` : null,
            dataDisparo: new Date().toISOString()
          }

          // Enviar notificações
          if (alerta.notificarEmail && alerta.email) {
            await enviarEmail(webhookData)
          }

          if (alerta.notificarWhatsapp && alerta.whatsapp) {
            await enviarWhatsapp(webhookData)
          }

          // Registrar disparo no histórico
          await db.collection('historicoDisparos').add({
            alertaId: doc.id,
            ...webhookData
          })
        }
      }
    }
  } catch (error) {
    console.error('Erro ao verificar alertas:', error)
  }
}

// Funções de envio de notificações
async function enviarEmail(data: any) {
  // Implementar lógica de envio de email
  console.log('Enviando email:', data)
}

async function enviarWhatsapp(data: any) {
  // Implementar lógica de envio de whatsapp
  console.log('Enviando whatsapp:', data)
}

// Criar funções agendadas para cada horário
DISPATCH_TIMES.forEach(({ hour, minute }) => {
  exports[`checkAlertsSchedule_${hour}_${minute}`] = functions.pubsub
    .schedule(`${minute} ${hour} * * *`)
    .timeZone('America/New_York')
    .onRun(async (context) => {
      await checkAlertsAndNotify()
      return null
    })
})

// Função para teste manual dos webhooks
exports.checkAlertsManual = functions.https.onRequest(async (req, res) => {
  await checkAlertsAndNotify()
  res.status(200).send('Verificação de alertas executada manualmente')
})
