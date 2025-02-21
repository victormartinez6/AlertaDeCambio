import { ref } from 'vue';
import { db } from "../firebase/config";
import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, where } from 'firebase/firestore';

export interface Webhook {
  id?: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
  createdAt?: Date;
  lastTriggered?: Date;
  failureCount?: number;
}

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: number;
  signature: string;
}

const webhooksCollection = collection(db, 'webhooks');

export const webhookService = {
  // Criar novo webhook
  async create(webhook: Omit<Webhook, 'id' | 'createdAt'>): Promise<Webhook> {
    const newWebhook = {
      ...webhook,
      createdAt: new Date(),
      failureCount: 0
    };
    const docRef = await addDoc(webhooksCollection, newWebhook);
    return { ...newWebhook, id: docRef.id };
  },

  // Listar todos os webhooks
  async list(): Promise<Webhook[]> {
    const querySnapshot = await getDocs(webhooksCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Webhook[];
  },

  // Atualizar webhook
  async update(id: string, webhook: Partial<Webhook>): Promise<void> {
    const webhookRef = doc(webhooksCollection, id);
    await updateDoc(webhookRef, webhook);
  },

  // Excluir webhook
  async delete(id: string): Promise<void> {
    const webhookRef = doc(webhooksCollection, id);
    await deleteDoc(webhookRef);
  },

  // Enviar payload para webhook
  async trigger(event: string, payload: any): Promise<void> {
    try {
      const webhooks = await this.list();
      const activeWebhooks = webhooks.filter(webhook => 
        webhook.active && webhook.events.includes(event)
      );

      const promises = activeWebhooks.map(async webhook => {
        try {
          const signature = await this.generateSignature(payload, webhook.secret || '');
          
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Hub-Signature': signature,
              'X-Event-Type': event
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // Atualizar o webhook com sucesso
          await this.update(webhook.id, {
            lastTriggered: new Date(),
            failureCount: 0
          });

        } catch (error) {
          console.error(`Failed to trigger webhook ${webhook.id}:`, error);
          
          // Incrementar contador de falhas
          await this.update(webhook.id, {
            failureCount: (webhook.failureCount || 0) + 1
          });
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error triggering webhooks:', error);
      throw error;
    }
  },

  // Gerar assinatura HMAC para payload
  async generateSignature(payload: any, secret: string): Promise<string> {
    if (!secret) return '';
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, data);
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
};
