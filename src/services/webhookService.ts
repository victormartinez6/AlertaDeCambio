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

    // Se não tiver webhook configurado no alerta, não faz nada
    if (!data.webhook) {
      console.log('Nenhum webhook configurado para este alerta')
      return
    }

    console.log('Usando webhook do alerta:', data.webhook)
    
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

      console.log('Resposta do webhook:', {
        status: response.status,
        ok: response.ok
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      console.log('Webhook enviado com sucesso')
      return response
    } catch (error) {
      console.error('Erro ao enviar webhook:', error)
      throw error
    }
  } catch (error) {
    console.error('Erro ao despachar evento webhook:', error)
    throw error
  }
}
