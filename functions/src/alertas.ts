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
    console.log('Iniciando verificação de alertas...')
    
    try {
      const alertasRef = collection(db, 'alertas')
      const q = query(alertasRef, where('ativo', '==', true))
      const querySnapshot = await getDocs(q)
      
      const promises = querySnapshot.docs.map(async (doc: any) => {
        const alerta = doc.data()
        console.log(`Verificando alerta ${doc.id} para ${alerta.moeda} (${alerta.produto})`)

        // Verifica se a data expirou
        if (alerta.dataLimite && verificarDataExpirada(alerta.dataLimite)) {
          console.log(`Data expirada para alerta ${doc.id}`)
          
          // Marca o alerta como inativo e registra a expiração
          await updateDoc(doc.ref, {
            ativo: false,
            dataExpirada: true,
            horarioExpiracao: new Date().toISOString()
          })

          // Dispara webhook de expiração se configurado
          if (alerta.webhook) {
            try {
              const response = await fetch(alerta.webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  alerta_id: doc.id,
                  tipo: 'data_expirada',
                  moeda: getNomeMoeda(alerta.moeda),
                  moeda_codigo: alerta.moeda,
                  data_limite: alerta.dataLimite,
                  horario_expiracao: new Date().toISOString()
                })
              })

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
              }

              console.log(`Webhook de expiração disparado com sucesso para ${doc.id}`)
            } catch (error) {
              console.error(`Erro ao disparar webhook de expiração para ${doc.id}:`, error)
            }
            return
          }
        }
        
        // Busca cotação atual baseada no produto
        const cotacaoAtual = await buscarCotacaoAtual(alerta.moeda, alerta.produto)
        
        if (!cotacaoAtual) {
          console.error(`Não foi possível obter cotação para ${alerta.moeda}`)
          return
        }

        // Formatar cotações com 4 casas decimais
        const cotacaoAtualFormatada = Number(cotacaoAtual).toFixed(4)
        const cotacaoAlvoFormatada = Number(alerta.cotacaoAlvo).toFixed(4)
        const cotacaoAtualNaCriacaoFormatada = Number(alerta.cotacaoAtualNaCriacao).toFixed(4)

        console.log(`Cotação alvo para ${alerta.moeda}: ${cotacaoAlvoFormatada}`)
        console.log(`Comparação: ${cotacaoAtualFormatada} <= ${cotacaoAlvoFormatada} = ${Number(cotacaoAtualFormatada) <= Number(cotacaoAlvoFormatada)}`)

        // Verifica se a cotação atual atingiu o alvo
        if (Number(cotacaoAtualFormatada) <= Number(cotacaoAlvoFormatada)) {
          console.log(`Cotação atingiu o alvo para ${alerta.moeda}!`)
          
          // Marca o alerta como inativo e registra o momento do disparo
          await updateDoc(doc.ref, {
            ativo: false,
            webhookDisparado: true,
            horarioDisparo: new Date().toISOString(),
            cotacaoDisparo: cotacaoAtualFormatada
          })

          // Dispara webhook se configurado
          try {
            if (alerta.userId) {
              await dispatchWebhookEvent(alerta.userId, 'alert.triggered', {
                alerta_id: doc.id,
                tipo: 'cotacao_atingida',
                moeda: getNomeMoeda(alerta.moeda),
                moeda_codigo: alerta.moeda,
                cotacao_alvo: cotacaoAlvoFormatada,
                cotacao_atual: cotacaoAtualFormatada,
                cotacao_criacao: cotacaoAtualNaCriacaoFormatada,
                horario_disparo: new Date().toISOString()
              })
            }
          } catch (error) {
            console.error(`Erro ao disparar webhook para ${doc.id}:`, error)
          }
        }
      })

      await Promise.all(promises)
      console.log('Verificação de alertas concluída')
    } catch (error) {
      console.error('Erro ao verificar alertas:', error)
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
