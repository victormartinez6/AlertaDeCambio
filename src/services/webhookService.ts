import { db } from '@/firebase/config'
import { collection, getDocs } from 'firebase/firestore'

export interface WebhookPayload {
  event: string
  data: any
  timestamp: Date
}

// Mapeamento de moedas
const MOEDAS: { [key: string]: string } = {
  'USD': 'Dólar Americano (USD)',
  'EUR': 'Euro (EUR)',
  'GBP': 'Libra Esterlina (GBP)'
}

// Função para obter o nome completo da moeda
function getNomeMoeda(codigo: string): string {
  return MOEDAS[codigo] || codigo
}

// Função auxiliar para formatar cotações
function formatarCotacao(valor: number): string {
  return valor.toFixed(4)
}

export async function dispatchWebhookEvent(userId: string, event: string, data: any) {
  try {
    console.log('Iniciando disparo de webhook:', { userId, event, data })
    
    // Formatar cotações no payload
    if (data) {
      if (data.cotacaoAlvo !== undefined) {
        data.cotacaoAlvo = formatarCotacao(Number(data.cotacaoAlvo))
      }
      if (data.cotacaoAtualNaCriacao !== undefined) {
        data.cotacaoAtualNaCriacao = formatarCotacao(Number(data.cotacaoAtualNaCriacao))
      }
      if (data.cotacaoAtual !== undefined) {
        data.cotacaoAtual = formatarCotacao(Number(data.cotacaoAtual))
      }
      // Formatar nome da moeda se presente
      if (data.moeda) {
        data.moeda = getNomeMoeda(data.moeda)
      }
    }
    
    // Buscar todos os webhooks
    console.log('Buscando todos os webhooks')
    
    const querySnapshot = await getDocs(collection(db, 'webhooks'))
    console.log('Query executada, número de resultados:', querySnapshot.size)
    
    const webhooksData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    console.log('Webhooks antes do filtro:', JSON.stringify(webhooksData, null, 2))
    
    const webhooks = webhooksData.filter(webhook => {
      console.log(`\nVerificando webhook ${webhook.id}:`)
      console.log('URL:', webhook.url)
      console.log('Eventos configurados:', webhook.events || [])
      console.log('Evento a ser disparado:', event)
      
      const eventosConfigurados = Array.isArray(webhook.events) ? webhook.events : []
      const eventoHabilitado = eventosConfigurados.includes(event)
      
      console.log('Evento está habilitado?', eventoHabilitado)
      return eventoHabilitado
    })

    console.log('\nWebhooks encontrados após filtro:', JSON.stringify(webhooks, null, 2))

    if (webhooks.length === 0) {
      console.warn('Nenhum webhook configurado para este evento')
      return
    }

    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date()
    }

    console.log('Payload preparado:', payload)

    const promises = webhooks.map(webhook => {
      console.log(`Disparando para URL ${webhook.url}`)
      console.log('Headers:', {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event
      })
      console.log('Body:', JSON.stringify(payload))
      
      return fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event
        },
        body: JSON.stringify(payload)
      })
      .then(response => {
        console.log(`Resposta do webhook ${webhook.id}:`, {
          status: response.status,
          ok: response.ok
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        console.log(`Webhook ${webhook.id} enviado com sucesso`)
        return response
      })
      .catch(error => {
        console.error(`Erro ao enviar webhook ${webhook.id} para ${webhook.url}:`, error)
        throw error
      })
    })

    const results = await Promise.all(promises)
    console.log('Resultados dos webhooks:', results)
    return results
  } catch (error) {
    console.error('Erro ao despachar evento webhook:', error)
    throw error
  }
}
