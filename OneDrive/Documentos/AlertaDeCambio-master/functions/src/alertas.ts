import * as functions from 'firebase-functions'
import { getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import fetch from 'node-fetch'
import admin from 'firebase-admin'

// Inicializar Firebase Admin apenas se não estiver inicializado
if (getApps().length === 0) {
  console.log('Inicializando Firebase Admin...')
  initializeApp({
    credential: admin.credential.applicationDefault()
  })
  console.log('Firebase Admin inicializado com sucesso')
}

// Referência ao Firestore
const db = getFirestore()
const { collection, query, where, getDocs, updateDoc, deleteDoc, doc } = require('firebase-admin/firestore')

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
async function buscarCotacaoAtual(moeda: string, produto: string, operacao: 'compra' | 'venda' = 'venda'): Promise<number | null> {
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

    // Se for remessas, retorna a cotação comercial diretamente
    if (produto === 'remessas') {
      const cotacaoComercial = operacao === 'compra' ? Number(cotacao.bid) : Number(cotacao.ask)
      console.log(`Cotação comercial (${operacao}) para ${moeda}: ${cotacaoComercial}`)
      return cotacaoComercial
    }

    // Se for turismo, aplica a taxa
    const taxas = await buscarTaxas()
    const taxa = operacao === 'compra' ? 
      taxas[`${moeda}_COMPRA`] || 0 : 
      taxas[moeda] || 0
    
    const cotacaoBase = operacao === 'compra' ? Number(cotacao.bid) : Number(cotacao.ask)
    const cotacaoFinal = operacao === 'compra' ? 
      cotacaoBase * (1 - taxa / 100) : // Para compra, subtrai a taxa
      cotacaoBase * (1 + taxa / 100)   // Para venda, soma a taxa

    console.log(`Cotação base para ${moeda} (${operacao}): ${cotacaoBase}`)
    console.log(`Taxa para ${moeda} (${operacao}): ${taxa}%`)
    console.log(`Cotação final calculada para ${moeda} (${operacao}): ${cotacaoFinal}`)

    return cotacaoFinal
  } catch (error) {
    console.error('Erro ao buscar cotação:', error)
    return null
  }
}

// Função para verificar se a data está expirada
function verificarDataExpirada(dataLimite: string | null): boolean {
  if (!dataLimite) return false
  
  const dataLimiteObj = new Date(dataLimite)
  const agora = new Date()
  
  // Compara apenas as datas, ignorando o horário
  const dataLimiteSemHora = new Date(dataLimiteObj.getFullYear(), dataLimiteObj.getMonth(), dataLimiteObj.getDate())
  const agoraSemHora = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  
  return agoraSemHora > dataLimiteSemHora
}

// Função principal para verificar alertas
export const verificarAlertas = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    try {
      console.log('Iniciando verificação automática de alertas...')
      
      // Buscar todos os alertas ativos
      const alertasRef = collection(db, 'alertas')
      const q = query(alertasRef, where('ativo', '==', true))
      const snapshot = await getDocs(q)
      
      for (const doc of snapshot.docs) {
        const alerta = doc.data()
        const alertaId = doc.id
        
        // Buscar cotação atual
        const cotacaoAtual = await buscarCotacaoAtual(alerta.moeda, alerta.produto)
        
        if (cotacaoAtual) {
          const cotacaoAlvo = Number(alerta.cotacaoAlvo)
          const atingiuAlvo = alerta.tipoAlerta === 'acima' 
            ? cotacaoAtual >= cotacaoAlvo
            : cotacaoAtual <= cotacaoAlvo

          if (atingiuAlvo) {
            console.log(`Alerta ${alertaId} atingiu o alvo. Disparando webhook...`)
            
            const webhookPayload = {
              id: alertaId,
              ...alerta,
              cotacaoAtual,
              horario: new Date().toISOString(),
              mensagem: `A cotação atual (${cotacaoAtual}) ${alerta.tipoAlerta === 'acima' ? 'atingiu ou ficou acima' : 'atingiu ou ficou abaixo'} da cotação alvo (${cotacaoAlvo})!`
            }

            try {
              // Disparar webhook
              const webhookResponse = await fetch(alerta.webhookUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(webhookPayload)
              })

              if (webhookResponse.ok) {
                console.log(`Webhook disparado com sucesso para alerta ${alertaId}`)
                
                // Atualizar status do alerta
                await updateDoc(doc.ref, {
                  webhookDisparado: true,
                  horarioDisparo: new Date().toISOString(),
                  cotacaoDisparo: cotacaoAtual
                })
              } else {
                console.error(`Erro ao disparar webhook para alerta ${alertaId}:`, await webhookResponse.text())
              }
            } catch (error) {
              console.error(`Erro ao disparar webhook para alerta ${alertaId}:`, error)
            }
          }
        }
      }
      
      console.log('Verificação automática de alertas concluída')
      return null
    } catch (error) {
      console.error('Erro na verificação automática de alertas:', error)
      return null
    }
  })

// Função para limpar alertas expirados ou já disparados
export const limparAlertasExpirados = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    try {
      const alertasRef = collection(db, 'alertas')
      const agora = new Date()

      // Busca todos os alertas
      const querySnapshot = await getDocs(alertasRef)
      const alertasParaExcluir: string[] = []

      querySnapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const alerta = doc.data()
        const dataLimite = new Date(alerta.dataLimite)
        const dataDisparo = alerta.horarioDisparo ? new Date(alerta.horarioDisparo) : null

        // Caso 1: Data limite expirada há mais de 24 horas
        if (dataLimite) {
          const horasDesdeExpiracao = (agora.getTime() - dataLimite.getTime()) / (1000 * 60 * 60)
          if (horasDesdeExpiracao > 24) {
            alertasParaExcluir.push(doc.id)
            return
          }
        }

        // Caso 2: Webhook disparado há mais de 24 horas
        if (dataDisparo) {
          const horasDesdeDisparo = (agora.getTime() - dataDisparo.getTime()) / (1000 * 60 * 60)
          if (horasDesdeDisparo > 24) {
            alertasParaExcluir.push(doc.id)
            return
          }
        }
      })

      // Exclui os alertas em lote
      const operacoes = alertasParaExcluir.map(alertaId => 
        deleteDoc(doc(db, 'alertas', alertaId))
      )

      await Promise.all(operacoes)

      console.log(`Limpeza automática: ${alertasParaExcluir.length} alertas excluídos`)
      return null
    } catch (error) {
      console.error('Erro ao limpar alertas:', error)
      return null
    }
  })
