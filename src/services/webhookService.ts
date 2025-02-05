import { db } from '@/config/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

export interface WebhookPayload {
  event: string
  data: any
  timestamp: Date
}

export async function dispatchWebhookEvent(userId: string, event: string, data: any) {
  try {
    console.log('Iniciando disparo de webhook:', { userId, event, data })
    console.log('Buscando webhooks para o usuário:', userId)
    
    // Busca webhooks do usuário que estão inscritos no evento
    const q = query(
      collection(db, 'webhooks'),
      where('userId', '==', userId)
    )
    
    console.log('Query preparada:', q)
    const querySnapshot = await getDocs(q)
    console.log('Query executada, número de resultados:', querySnapshot.size)
    
    // Filtra os webhooks que têm o evento na lista de events
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
      
      // Verifica se o webhook tem a propriedade events e se o evento está incluído
      const eventosConfigurados = Array.isArray(webhook.events) ? webhook.events : []
      const eventoHabilitado = eventosConfigurados.includes(event)
      
      console.log('Evento está habilitado?', eventoHabilitado)
      return eventoHabilitado
    })

    console.log('\nWebhooks encontrados após filtro:', JSON.stringify(webhooks, null, 2))

    console.log('Webhooks encontrados:', webhooks)

    if (webhooks.length === 0) {
      console.warn('Nenhum webhook configurado para este evento')
      return
    }

    // Prepara o payload
    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date()
    }

    console.log('Payload preparado:', payload)

    // Dispara o webhook para cada URL configurada
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
        // Não rejeitamos a promise para não interromper os outros envios
        return error
      })
    })

    // Aguarda todos os envios terminarem
    const results = await Promise.all(promises)
    console.log('Resultados dos webhooks:', results)
    console.log('Todos os webhooks foram processados')
  } catch (error) {
    console.error('Erro ao despachar evento webhook:', error)
    throw error
  }
}
