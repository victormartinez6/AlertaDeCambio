import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// Horários de disparo (UTC)
const DISPATCH_TIMES = [
  { hour: 12, minute: 0 },  // 9:00 AM EDT (UTC-4)
  { hour: 17, minute: 0 },  // 1:00 PM EDT (UTC-4)
  { hour: 20, minute: 0 },  // 4:00 PM EDT (UTC-4)
]

// Função para buscar cotação atual
async function buscarCotacao(moeda: string, produto: string): Promise<number | null> {
  try {
    const response = await fetch(`https://economia.awesomeapi.com.br/json/last/${moeda}-BRL`)
    if (!response.ok) {
      console.error(`Erro ao buscar cotação para ${moeda}:`, response.statusText)
      return null
    }

    const data = await response.json()
    const cotacao = data[`${moeda}BRL`]

    if (!cotacao) {
      console.error(`Cotação não encontrada para ${moeda}`)
      return null
    }

    // Se for remessas, retorna a cotação comercial de venda diretamente
    if (produto === 'remessas') {
      const cotacaoComercial = Number(cotacao.ask)
      console.log(`Cotação comercial (ask) para ${moeda}: ${cotacaoComercial}`)
      return cotacaoComercial
    }

    // Se for turismo, aplica a taxa
    const taxas = await buscarTaxas()
    const taxa = taxas[moeda] || 0
    const cotacaoBase = Number(cotacao.ask)
    const cotacaoFinal = cotacaoBase * (1 + taxa / 100)

    console.log(`Cotação base para ${moeda}: ${cotacaoBase}`)
    console.log(`Taxa para ${moeda}: ${taxa}%`)
    console.log(`Cotação final calculada para ${moeda}: ${cotacaoFinal}`)

    return cotacaoFinal
  } catch (error) {
    console.error('Erro ao buscar cotação:', error)
    return null
  }
}

// Função para buscar taxas do Firestore
async function buscarTaxas(): Promise<Record<string, number>> {
  try {
    const db = admin.firestore()
    const docRef = db.collection('configuracoes').doc('taxas_turismo')
    const docSnap = await docRef.get()
    
    if (docSnap.exists) {
      return docSnap.data() as Record<string, number>
    }
    
    return {
      'USD': 3,
      'EUR': 3,
      'GBP': 3
    }
  } catch (error) {
    console.error('Erro ao buscar taxas:', error)
    return {
      'USD': 3,
      'EUR': 3,
      'GBP': 3
    }
  }
}

// Função para verificar alertas e enviar notificações
async function checkAlertsAndNotify() {
  try {
    const db = admin.firestore()
    const alertasRef = db.collection('alertas')
    const alertas = await alertasRef.where('ativo', '==', true).get()

    for (const doc of alertas.docs) {
      const alerta = doc.data()
      
      // Buscar cotação atual
      const cotacaoAtual = await buscarCotacao(alerta.moeda, alerta.produto)

      if (cotacaoAtual) {
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
