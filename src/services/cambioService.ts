import axios from 'axios'

const API_BASE_URL = 'https://economia.awesomeapi.com.br/json'

export interface CotacaoResponse {
  code: string
  codein: string
  name: string
  high: string
  low: string
  varBid: string
  pctChange: string
  bid: string
  ask: string
  timestamp: string
  create_date: string
}

export const buscarCotacoes = async (moedas: string[] = ['USD', 'EUR', 'GBP', 'CAD']): Promise<CotacaoResponse[]> => {
  try {
    const moedasStr = moedas.map(moeda => `${moeda}-BRL`).join(',')
    const response = await axios.get(`${API_BASE_URL}/last/${moedasStr}`)
    const cotacoes = Object.values(response.data)
    
    // Validação básica dos valores recebidos
    return cotacoes.filter(cotacao => {
      const ask = parseFloat(cotacao.ask)
      const bid = parseFloat(cotacao.bid)
      
      return !isNaN(ask) && !isNaN(bid) && ask > 0 && bid > 0 && ask > bid
    })

  } catch (error) {
    console.error('Erro ao buscar cotações:', error)
    throw error
  }
}

export const buscarHistorico = async (moeda: string, dias: number = 30): Promise<CotacaoResponse[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${moeda}-BRL/${dias}`)
    return response.data
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    throw error
  }
}

// Função para formatar o valor da cotação
export const formatarCotacao = (valor: string | number): string => {
  const numero = typeof valor === 'string' ? parseFloat(valor) : valor
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

// Função para calcular a variação entre duas cotações
export const calcularVariacao = (cotacaoAtual: number, cotacaoAnterior: number): number => {
  return ((cotacaoAtual - cotacaoAnterior) / cotacaoAnterior) * 100
}
