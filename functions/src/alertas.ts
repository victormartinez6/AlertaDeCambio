import * as functions from 'firebase-functions'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import fetch from 'node-fetch'

// Inicializar Firebase Admin
initializeApp()

// Referência ao Firestore
const db = getFirestore()
const { collection, query, where, getDocs, updateDoc } = require('firebase-admin/firestore')

// Função para buscar taxas do Firestore
async function buscarTaxas(): Promise<Record<string, number>> {
  try {
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

// Função para buscar cotação atual
async function buscarCotacaoAtual(moeda: string, produto: string): Promise<number | null> {
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

// Função principal para verificar alertas
export const verificarAlertas = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    console.log('Iniciando verificação de alertas...')
    
    try {
      const alertasRef = collection(db, 'alertas')
      const q = query(alertasRef, where('ativo', '==', true))
      const querySnapshot = await getDocs(q)
      
      const promises = querySnapshot.docs.map(async (doc: any) => {
        const alerta = doc.data()
        console.log(`Verificando alerta ${doc.id} para ${alerta.moeda} (${alerta.produto})`)
        
        // Busca cotação atual baseada no produto
        const cotacaoAtual = await buscarCotacaoAtual(alerta.moeda, alerta.produto)
        
        if (!cotacaoAtual) {
          console.error(`Não foi possível obter cotação para ${alerta.moeda}`)
          return
        }

        console.log(`Cotação alvo para ${alerta.moeda}: ${alerta.cotacaoAlvo}`)
        console.log(`Comparação: ${cotacaoAtual} <= ${alerta.cotacaoAlvo} = ${cotacaoAtual <= alerta.cotacaoAlvo}`)

        // Verifica se a cotação atual atingiu o alvo
        if (cotacaoAtual <= alerta.cotacaoAlvo) {
          console.log(`Cotação atingiu o alvo para ${alerta.moeda}!`)
          
          // Marca o alerta como inativo e registra o momento do disparo
          await updateDoc(doc.ref, {
            ativo: false,
            webhookDisparado: true,
            horarioDisparo: new Date().toISOString(),
            cotacaoDisparo: cotacaoAtual
          })

          // Dispara webhooks se configurados
          if (alerta.webhook) {
            try {
              const response = await fetch(alerta.webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  alerta_id: doc.id,
                  moeda: alerta.moeda,
                  cotacao_alvo: alerta.cotacaoAlvo,
                  cotacao_disparo: cotacaoAtual,
                  horario_disparo: new Date().toISOString()
                })
              })

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
              }

              console.log(`Webhook disparado com sucesso para ${doc.id}`)
            } catch (error) {
              console.error(`Erro ao disparar webhook para ${doc.id}:`, error)
            }
          }
        } else {
          console.log('Cotação ainda não atingiu o alvo')
        }
      })

      await Promise.all(promises)
      console.log('Verificação de alertas concluída')
    } catch (error) {
      console.error('Erro ao verificar alertas:', error)
      throw error
    }
  })
