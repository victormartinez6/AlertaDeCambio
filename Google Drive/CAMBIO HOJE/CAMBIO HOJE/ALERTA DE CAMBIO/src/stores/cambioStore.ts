import { defineStore } from 'pinia'
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useCotacoesTempoReal } from '@/utils/cotacoes'

// Constantes
const MOEDAS_COMERCIAL = ['USD', 'EUR', 'GBP', 'CAD']
const MOEDAS_TURISMO = ['USD', 'EUR', 'GBP']

export const useCambioStore = defineStore('cambio', () => {
  const loading = ref(false)
  const loadingTurismo = ref(false)
  const loadingComercial = ref(false)
  const error = ref<string | null>(null)
  const cotacoes = ref([])
  const historicoCotacoes = ref({})
  const segundosParaAtualizarComercial = ref(10)
  const { cotacoes: cotacoesBase, taxas, calcularCotacaoFinal, atualizarDados } = useCotacoesTempoReal()

  // Estado das cotações
  const cotacoesComercial = ref({
    USD: 0,
    EUR: 0,
    GBP: 0,
    CAD: 0
  })

  // Cotações de turismo computadas
  const cotacoesTurismo = computed(() => {
    // Só recalcula se houver mudanças reais nas cotações base ou taxas
    const cotacoesTurismoAtualizadas = {}

    MOEDAS_TURISMO.forEach(code => {
      const cotacaoBase = cotacoesBase.value[code]
      const taxa = taxas.value[code]
      
      // Se não tiver os dados necessários, mantém o valor anterior
      if (!cotacaoBase || taxa === undefined) {
        if (cotacoesTurismo.value?.[code]) {
          cotacoesTurismoAtualizadas[code] = cotacoesTurismo.value[code]
          return
        }
      }

      const cotacaoFinal = calcularCotacaoFinal(code as 'USD' | 'EUR' | 'GBP')
      const dadosComercial = cotacoesComercial.value[code]
      
      // Só atualiza se houver mudança real nos valores
      const cotacaoAtual = cotacoesTurismo.value?.[code]
      if (cotacaoAtual && 
          cotacaoAtual.venda === cotacaoFinal && 
          cotacaoAtual.variacao === (dadosComercial ? parseFloat(dadosComercial.pctChange) : 0)) {
        cotacoesTurismoAtualizadas[code] = cotacaoAtual
        return
      }
      
      cotacoesTurismoAtualizadas[code] = {
        code,
        name: getNomeMoeda(code),
        venda: cotacaoFinal,
        variacao: dadosComercial ? parseFloat(dadosComercial.pctChange) : 0
      }
    })

    return cotacoesTurismoAtualizadas
  })

  // Atualizar cotações comerciais
  const atualizarCotacoesComercial = async () => {
    if (loadingComercial.value) return

    loadingComercial.value = true
    error.value = null

    try {
      // Buscar todas as cotações comerciais
      const promises = MOEDAS_COMERCIAL.map(async (moeda) => {
        const response = await fetch(`https://economia.awesomeapi.com.br/json/last/${moeda}-BRL`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        return data[`${moeda}BRL`]
      })

      const resultados = await Promise.all(promises)
      const cotacoesAtualizadas = []

      // Processar cotações comerciais
      resultados.forEach((resultado) => {
        if (resultado) {
          const novosDados = {
            code: resultado.code.substring(0, 3),
            name: getNomeMoeda(resultado.code.substring(0, 3)),
            ask: parseFloat(resultado.ask),
            timestamp: resultado.timestamp,
            pctChange: resultado.pctChange,
            high: resultado.high,
            low: resultado.low
          }

          // Verificar se houve mudança real nos valores
          const dadosAtuais = cotacoes.value.find(c => c.code === novosDados.code)
          if (!dadosAtuais || 
              dadosAtuais.ask !== novosDados.ask || 
              dadosAtuais.pctChange !== novosDados.pctChange) {
            cotacoesAtualizadas.push(novosDados)
          } else {
            cotacoesAtualizadas.push(dadosAtuais)
          }
        }
      })

      // Só atualiza se houver mudanças reais
      if (JSON.stringify(cotacoes.value) !== JSON.stringify(cotacoesAtualizadas)) {
        cotacoes.value = cotacoesAtualizadas
        cotacoesComercial.value = {
          USD: cotacoes.value.find(c => c.code === 'USD'),
          EUR: cotacoes.value.find(c => c.code === 'EUR'),
          GBP: cotacoes.value.find(c => c.code === 'GBP'),
          CAD: cotacoes.value.find(c => c.code === 'CAD')
        }
      }
    } catch (e) {
      console.error('Erro ao atualizar cotações:', e)
      error.value = 'Erro ao carregar cotações. Tente novamente mais tarde.'
    } finally {
      loadingComercial.value = false
    }
  }

  // Observar mudanças nas cotações base
  watch(() => cotacoesBase.value, () => {
    atualizarCotacoesComercial()
  }, { deep: true })

  // Observar mudanças nas taxas
  watch(() => taxas.value, () => {
    // Força uma reavaliação das cotações de turismo apenas se houver mudança real
    const novasCotacoes = cotacoesTurismo.value
    if (JSON.stringify(novasCotacoes) !== JSON.stringify(cotacoesTurismo.value)) {
      cotacoesTurismo.value = novasCotacoes
    }
  }, { deep: true })

  // Iniciar atualizações automáticas
  let intervaloAtualizacao: NodeJS.Timer | null = null
  let contadorIntervalo: NodeJS.Timer | null = null
  let intervaloComercial: NodeJS.Timer | null = null

  const iniciarAtualizacoesAutomaticas = () => {
    // Primeira atualização
    atualizarDados()
    atualizarCotacoesComercial()

    // Atualizar turismo a cada 60 segundos
    intervaloAtualizacao = setInterval(() => {
      atualizarDados()
    }, 60000)

    // Atualizar comercial a cada 10 segundos
    intervaloComercial = setInterval(() => {
      atualizarCotacoesComercial()
      segundosParaAtualizarComercial.value = 10
    }, 10000)

    // Contador regressivo para câmbio comercial
    contadorIntervalo = setInterval(() => {
      segundosParaAtualizarComercial.value = Math.max(0, segundosParaAtualizarComercial.value - 1)
    }, 1000)

    return () => {
      if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao)
        intervaloAtualizacao = null
      }
      if (contadorIntervalo) {
        clearInterval(contadorIntervalo)
        contadorIntervalo = null
      }
      if (intervaloComercial) {
        clearInterval(intervaloComercial)
        intervaloComercial = null
      }
    }
  }

  // Buscar histórico de cotação
  const buscarHistoricoCotacao = async (code: string) => {
    if (historicoCotacoes.value[code]) return

    try {
      const response = await fetch(`https://economia.awesomeapi.com.br/json/daily/${code}-BRL/7`)
      const data = await response.json()
      
      historicoCotacoes.value[code] = data.map((item: any) => ({
        timestamp: new Date(item.timestamp * 1000),
        valor: parseFloat(item.bid)
      }))
    } catch (e) {
      console.error(`Erro ao buscar histórico de ${code}:`, e)
    }
  }

  // Utilitário para obter nome da moeda
  const getNomeMoeda = (code: string): string => {
    const nomes: Record<string, string> = {
      'USD': 'Dólar Americano',
      'EUR': 'Euro',
      'GBP': 'Libra Esterlina',
      'CAD': 'Dólar Canadense'
    }
    return nomes[code] || code
  }

  // Funções para controle de loading
  const setLoadingTurismo = (value: boolean) => {
    loadingTurismo.value = value
  }

  const setLoadingComercial = (value: boolean) => {
    loadingComercial.value = value
  }

  return {
    loading,
    loadingTurismo,
    loadingComercial,
    error,
    cotacoes,
    cotacoesComercial,
    cotacoesTurismo,
    historicoCotacoes,
    atualizarCotacoesComercial,
    buscarHistoricoCotacao,
    iniciarAtualizacoesAutomaticas,
    segundosParaAtualizarComercial,
    setLoadingTurismo,
    setLoadingComercial
  }
})
