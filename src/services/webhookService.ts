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

    // Se for um usuário anônimo e o alerta tem webhook direto, usa ele
    if (userId.startsWith('anonymous-') && data.webhook) {
      console.log('Usuário anônimo, usando webhook direto do alerta:', data.webhook)
      
      const payload: WebhookPayload = {
        event,
        data,
        timestamp: new Date()
      }

      console.log('Payload preparado:', payload)
      
      try {
        const response = await fetch(data.webhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': event
          },
          body: JSON.stringify(payload)
        })

        console.log('Resposta do webhook direto:', {
          status: response.status,
          ok: response.ok
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        console.log('Webhook direto enviado com sucesso')
        return response
      } catch (error) {
        console.error('Erro ao enviar webhook direto:', error)
        throw error
      }
      return
    }
    
    // Para usuários autenticados, continua usando a coleção webhooks
    console.log('Buscando webhooks para o usuário:', userId)
    
    const q = query(
      collection(db, 'webhooks'),
      where('userId', '==', userId)
    )
    
    console.log('Query preparada:', q)
    const querySnapshot = await getDocs(q)
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
