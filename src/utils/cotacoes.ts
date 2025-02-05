import { ref, onMounted, onUnmounted, watch } from 'vue'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useCambioStore } from '@/stores/cambioStore'

// Interface para as taxas
interface Taxas {
  USD: number
  EUR: number
  GBP: number
}

// Interface para cotações
interface Cotacoes {
  USD: number
  EUR: number
  GBP: number
}

// Valores iniciais
const TAXAS_INICIAIS: Taxas = { USD: 0, EUR: 0, GBP: 0 }
const COTACOES_INICIAIS: Cotacoes = { USD: 0, EUR: 0, GBP: 0 }

// Função para buscar taxas do Firestore
export const buscarTaxas = async (): Promise<Taxas> => {
  try {
    const docRef = doc(db, 'configuracoes', 'taxas_turismo')
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        USD: Number(data.USD || 0),
        EUR: Number(data.EUR || 0),
        GBP: Number(data.GBP || 0)
      }
    }
    
    return { ...TAXAS_INICIAIS }
  } catch (error) {
    console.error('Erro ao buscar taxas:', error)
    return { ...TAXAS_INICIAIS }
  }
}

// Função para buscar cotações da API
export const buscarCotacoes = async (): Promise<Cotacoes> => {
  try {
    const moedas = ['USD', 'EUR', 'GBP']
    const resultados = await Promise.all(
      moedas.map(async (moeda) => {
        const response = await fetch(`https://economia.awesomeapi.com.br/json/last/${moeda}-BRL`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        return data[`${moeda}BRL`]?.ask || 0
      })
    )
    
    return {
      USD: Number(resultados[0]),
      EUR: Number(resultados[1]),
      GBP: Number(resultados[2])
    }
  } catch (error) {
    console.error('Erro ao buscar cotações:', error)
    return { ...COTACOES_INICIAIS }
  }
}

// Composable para cotações em tempo real
export const useCotacoesTempoReal = () => {
  const cotacoes = ref<Cotacoes>({ ...COTACOES_INICIAIS })
  const taxas = ref<Taxas>({ ...TAXAS_INICIAIS })
  const taxasTemporarias = ref<Taxas>({ ...TAXAS_INICIAIS })
  const atualizando = ref(false)
  const segundosParaAtualizar = ref(60)
  let intervalo: NodeJS.Timer | null = null
  let contadorIntervalo: NodeJS.Timer | null = null
  let unsubscribe: (() => void) | null = null
  const store = useCambioStore()

  // Atualizar dados
  const atualizarDados = async (apenasAPI: boolean = false) => {
    if (atualizando.value) return
    atualizando.value = true
    store.setLoadingTurismo(true)

    try {
      // Se apenasAPI for true, só atualiza as cotações da API
      if (apenasAPI) {
        const novasCotacoes = await buscarCotacoes()
        cotacoes.value = novasCotacoes
      } else {
        // Caso contrário, atualiza tudo
        const [novasCotacoes, novasTaxas] = await Promise.all([
          buscarCotacoes(),
          buscarTaxas()
        ])
        
        cotacoes.value = novasCotacoes
        taxas.value = novasTaxas
        taxasTemporarias.value = { ...novasTaxas }
      }

      // Reinicia o contador após atualização
      segundosParaAtualizar.value = 60
    } catch (error) {
      console.error('Erro ao atualizar dados:', error)
    } finally {
      atualizando.value = false
      store.setLoadingTurismo(false)
    }
  }

  // Calcular cotação final com base na taxa
  const calcularCotacaoFinal = (moeda: keyof Cotacoes): number => {
    const cotacaoBase = cotacoes.value[moeda] || 0
    const taxa = taxasTemporarias.value[moeda] || 0
    return cotacaoBase * (1 + taxa / 100)
  }

  // Calcular cotação final com base na taxa e cotação base fornecida
  const calcularCotacaoFinalComBase = (moeda: keyof Cotacoes, cotacaoBase: number): number => {
    const taxa = taxasTemporarias.value[moeda] || 0
    return cotacaoBase * (1 + taxa / 100)
  }

  // Atualizar taxa temporária
  const atualizarTaxaTemporaria = (moeda: keyof Taxas, valor: number) => {
    taxasTemporarias.value[moeda] = valor
  }

  // Salvar taxas
  const salvarTaxas = async (novasTaxas: Taxas) => {
    try {
      await setDoc(doc(db, 'configuracoes', 'taxas_turismo'), novasTaxas)
      taxas.value = { ...novasTaxas }
      taxasTemporarias.value = { ...novasTaxas }
      return true
    } catch (error) {
      console.error('Erro ao salvar taxas:', error)
      return false
    }
  }

  // Iniciar atualizações
  const iniciarAtualizacoes = () => {
    // Primeira atualização completa
    atualizarDados()

    // Configurar listener para taxas no Firestore
    unsubscribe = onSnapshot(doc(db, 'configuracoes', 'taxas_turismo'), (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const novasTaxas = {
          USD: Number(data.USD || 0),
          EUR: Number(data.EUR || 0),
          GBP: Number(data.GBP || 0)
        }
        taxas.value = novasTaxas
        taxasTemporarias.value = { ...novasTaxas }
      }
    })

    // Configurar intervalo para atualização automática
    intervalo = setInterval(() => {
      atualizarDados(true)
    }, 60000)

    // Configurar contador regressivo
    contadorIntervalo = setInterval(() => {
      if (segundosParaAtualizar.value > 0) {
        segundosParaAtualizar.value--
      }
    }, 1000)
  }

  // Limpar recursos ao desmontar
  const pararAtualizacoes = () => {
    if (intervalo) clearInterval(intervalo)
    if (contadorIntervalo) clearInterval(contadorIntervalo)
    if (unsubscribe) unsubscribe()
  }

  // Iniciar ao montar o componente
  onMounted(() => {
    iniciarAtualizacoes()
  })

  // Limpar ao desmontar o componente
  onUnmounted(() => {
    pararAtualizacoes()
  })

  return {
    cotacoes,
    taxas: taxasTemporarias,
    atualizando,
    segundosParaAtualizar,
    calcularCotacaoFinal,
    calcularCotacaoFinalComBase,
    atualizarTaxaTemporaria,
    salvarTaxas,
    atualizarDados,
    buscarCotacoes
  }
}

// Formatar valor como moeda BRL
export const formatarMoeda = (valor: number): string => {
  if (!valor) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}
