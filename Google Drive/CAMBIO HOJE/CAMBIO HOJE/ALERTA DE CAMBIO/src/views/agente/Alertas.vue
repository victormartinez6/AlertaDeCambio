<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAlertasStore } from '@/stores/alertas'
import { useAuthStore } from '@/stores/auth'
import { useCotacoesTempoReal } from '@/utils/cotacoes'
import { dispatchWebhookEvent } from '@/services/webhookService'
import { 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  CheckIcon, 
  BellSlashIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BanknotesIcon,
  MagnifyingGlassIcon
} from '@heroicons/vue/24/outline'
import { Money3Component } from 'v-money3'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'

const router = useRouter()
const alertasStore = useAlertasStore()
const authStore = useAuthStore()
const showEditModal = ref(false)
const editingAlerta = ref<any>(null)
const cotacaoAtual = ref(null)
const cotacoesAtuais = ref<{ [key: string]: number }>({})
const webhookDisparos = ref<{ [key: string]: { horario: string, cotacao: number } }>({})
const cotacoesService = useCotacoesTempoReal()
const intervalId = ref<number | null>(null)

// Função para buscar cotação atual de um alerta
const buscarCotacaoAtual = async (alerta: any) => {
  try {
    await cotacoesService.buscarCotacoes()
    
    console.log('Buscando cotação para:', alerta)
    console.log('Taxas disponíveis:', cotacoesService.taxas.value)
    console.log('Auth Store:', authStore)
    console.log('Usuário logado:', authStore.user?.uid)
    
    // Usar o mesmo método de cálculo da tela de configurações
    const cotacaoFinal = cotacoesService.calcularCotacaoFinal(alerta.moeda)
    const cotacaoAlvo = Number(alerta.cotacaoAlvo)
    
    console.log(`Cotação final calculada para ${alerta.moeda}:`, cotacaoFinal)
    console.log(`Cotação alvo para ${alerta.moeda}:`, cotacaoAlvo)
    console.log(`Comparação: ${cotacaoFinal} <= ${cotacaoAlvo} = ${cotacaoFinal <= cotacaoAlvo}`)
    
    if (cotacaoFinal > 0) {
      cotacoesAtuais.value[alerta.id] = cotacaoFinal
      
      // Se a cotação atual for menor ou igual à cotação alvo
      if (cotacaoFinal <= cotacaoAlvo) {
        console.log('Cotação atingiu o alvo! Disparando webhook...')

        // Verifica se o webhook já foi disparado para este alerta
        if (alerta.webhookDisparado) {
          console.log('Webhook já foi disparado anteriormente para este alerta')
          return
        }

        try {
          // Disparar webhook via webhookService
          if (authStore.user?.uid) {
            const webhookPayload = {
              ...alerta,
              cotacaoAtual: cotacaoFinal,
              horario: new Date().toISOString(),
              mensagem: `A cotação atual (${cotacaoFinal}) atingiu ou ficou abaixo da cotação alvo (${cotacaoAlvo})!`
            }
            
            console.log('Preparando payload do webhook:', webhookPayload)
            
            await dispatchWebhookEvent(authStore.user.uid, 'alert.triggered', webhookPayload)

            // Marca o alerta como já disparado e salva o horário
            await alertasStore.atualizarAlerta(alerta.id, {
              webhookDisparado: true,
              horarioDisparo: new Date().toISOString(),
              cotacaoDisparo: cotacaoFinal
            })

            // Registrar o disparo do webhook localmente
            webhookDisparos.value[alerta.id] = {
              horario: new Date().toLocaleTimeString(),
              cotacao: cotacaoFinal
            }

            console.log('Webhook disparado com sucesso!')
          } else {
            console.warn('Usuário não está logado, não é possível disparar webhook')
          }
        } catch (error) {
          console.error('Erro ao disparar webhook:', error)
          throw error
        }
      } else {
        console.log('Cotação ainda não atingiu o alvo')
      }
    } else {
      console.warn('Cotação zerada para:', alerta.moeda)
    }
  } catch (error) {
    console.error('Erro ao buscar cotação:', error)
  }
}

// Função para verificar todos os alertas
const verificarAlertas = async () => {
  console.log('Verificando alertas...')
  for (const alerta of alertasStore.alertas) {
    await buscarCotacaoAtual(alerta)
  }
}

// Inicia a verificação periódica
const iniciarVerificacaoPeriodica = () => {
  console.log('Iniciando verificação periódica de alertas...')
  // Verifica a cada 30 segundos
  intervalId.value = window.setInterval(verificarAlertas, 30000)
}

// Para a verificação periódica
const pararVerificacaoPeriodica = () => {
  if (intervalId.value) {
    console.log('Parando verificação periódica de alertas...')
    window.clearInterval(intervalId.value)
    intervalId.value = null
  }
}

// Carregar alertas ao montar o componente
onMounted(async () => {
  console.log('Montando componente...')
  await alertasStore.listarAlertas()
  await verificarAlertas() // Verifica imediatamente
  iniciarVerificacaoPeriodica() // Inicia verificação periódica
})

// Limpar intervalo ao desmontar o componente
onUnmounted(() => {
  pararVerificacaoPeriodica()
})

// Filtrar alertas baseado no termo de busca
const searchTerm = ref('')
const filteredAlertas = computed(() => {
  if (!searchTerm.value) return alertasStore.alertas
  
  const termLower = searchTerm.value.toLowerCase()
  return alertasStore.alertas.filter(alerta => {
    // Converter valores para string para busca
    const searchableFields = [
      alerta.nome,
      alerta.produto,
      alerta.moeda,
      alerta.email,
      alerta.whatsapp,
      alerta.ddi?.toString(),
      alerta.cotacaoAlvo?.toString(),
      new Date(alerta.dataLimite).toLocaleDateString('pt-BR'),
      new Date(alerta.criadoEm).toLocaleDateString('pt-BR'),
      alerta.ativo ? 'ativo' : 'inativo'
    ].filter(Boolean) // Remove campos undefined/null

    // Retorna true se qualquer campo contém o termo de busca
    return searchableFields.some(field => 
      field.toLowerCase().includes(termLower)
    )
  })
})

// Configuração do componente v-money3
const moneyConfig = computed(() => ({
  prefix: '',
  suffix: '',
  thousands: '.',
  decimal: ',',
  precision: editingAlerta.value?.produto === 'remessas' ? 4 : 2,
  masked: false
}))

// Data mínima para o campo de data limite (hoje)
const hoje = computed(() => {
  const data = new Date()
  return data.toISOString().split('T')[0]
})

// Validações
const emailError = ref('')
const whatsappError = ref('')
const emailValido = computed(() => !emailError.value)
const whatsappValido = computed(() => !whatsappError.value)

const editarAlerta = async (alerta: any) => {
  // Copia os dados do alerta para evitar referência direta
  const alertaData = { ...alerta }

  // Garante que os campos de contato não sejam undefined
  alertaData.email = alertaData.email || ''
  alertaData.whatsapp = alertaData.whatsapp || ''
  alertaData.ddi = alertaData.ddi || '55'
  
  // Garante que a data limite seja mantida como está
  alertaData.dataLimite = alertaData.dataLimite || hoje.value

  // Define o estado das notificações
  alertaData.notificarEmail = Boolean(alertaData.notificarEmail)
  alertaData.notificarWhatsapp = Boolean(alertaData.notificarWhatsapp)

  editingAlerta.value = alertaData
  await buscarCotacao()
  showEditModal.value = true
}

const salvarEdicao = async () => {
  try {
    // Validações
    validarEmailCompleto()
    validarWhatsappCompleto()

    if (emailError.value || whatsappError.value) {
      return
    }

    if (!editingAlerta.value || !editingAlerta.value.id) {
      throw new Error('Alerta inválido')
    }

    // Prepara os dados para salvar
    const dadosAtualizados = {
      nome: editingAlerta.value.nome,
      produto: editingAlerta.value.produto,
      moeda: editingAlerta.value.moeda,
      cotacaoAlvo: Number(editingAlerta.value.cotacaoAlvo),
      dataLimite: editingAlerta.value.dataLimite || hoje.value,
      notificarEmail: Boolean(editingAlerta.value.notificarEmail),
      notificarWhatsapp: Boolean(editingAlerta.value.notificarWhatsapp),
      ativo: editingAlerta.value.ativo
    }

    // Adiciona email apenas se notificarEmail estiver ativo
    if (dadosAtualizados.notificarEmail) {
      dadosAtualizados.email = editingAlerta.value.email
    } else {
      dadosAtualizados.email = null
    }

    // Adiciona whatsapp e DDI apenas se notificarWhatsapp estiver ativo
    if (dadosAtualizados.notificarWhatsapp) {
      dadosAtualizados.whatsapp = editingAlerta.value.whatsapp
      dadosAtualizados.ddi = editingAlerta.value.ddi
    } else {
      dadosAtualizados.whatsapp = null
      dadosAtualizados.ddi = null
    }

    await alertasStore.atualizarAlerta(editingAlerta.value.id, dadosAtualizados)
    showEditModal.value = false
    await alertasStore.listarAlertas() // Recarrega a lista após editar
  } catch (error) {
    console.error('Erro ao editar alerta:', error)
  }
}

// Função para formatar data considerando o fuso horário
const formatarData = (dataString: string) => {
  if (!dataString) return ''
  
  try {
    // Se a data já vier com T, remove a parte do tempo
    if (dataString.includes('T')) {
      dataString = dataString.split('T')[0]
    }
    
    // Adiciona a hora (12:00) para garantir que a data não será alterada por causa do fuso horário
    const data = new Date(dataString + 'T12:00:00')
    return data.toLocaleDateString('pt-BR')
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return ''
  }
}

// Função para calcular dias restantes
const calcularDiasRestantes = (dataString: string) => {
  if (!dataString) return 0
  
  try {
    // Se a data já vier com T, remove a parte do tempo
    if (dataString.includes('T')) {
      dataString = dataString.split('T')[0]
    }
    
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    const dataLimite = new Date(dataString + 'T12:00:00')
    dataLimite.setHours(0, 0, 0, 0)
    
    const diffTime = dataLimite.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  } catch (error) {
    console.error('Erro ao calcular dias restantes:', error)
    return 0
  }
}

// Função para verificar se a data está expirada
const dataExpirada = (dataString: string) => {
  if (!dataString) return true
  
  try {
    // Se a data já vier com T, remove a parte do tempo
    if (dataString.includes('T')) {
      dataString = dataString.split('T')[0]
    }
    
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    const dataLimite = new Date(dataString + 'T12:00:00')
    dataLimite.setHours(0, 0, 0, 0)
    
    return dataLimite < hoje
  } catch (error) {
    console.error('Erro ao verificar se data está expirada:', error)
    return true
  }
}

const excluirAlerta = async (id: string) => {
  if (confirm('Tem certeza que deseja excluir este alerta?')) {
    await alertasStore.excluirAlerta(id)
  }
}

const validarEmail = () => {
  const email = editingAlerta.value.email
  if (!email) {
    emailError.value = ''
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    emailError.value = 'Email inválido'
  } else {
    emailError.value = ''
  }
}

const validarEmailCompleto = () => {
  if (editingAlerta.value.notificarEmail && !editingAlerta.value.email) {
    emailError.value = 'Email é obrigatório quando notificação por email está ativada'
  } else {
    validarEmail()
  }
}

const validarWhatsapp = () => {
  const whatsapp = editingAlerta.value.whatsapp
  if (!whatsapp) {
    whatsappError.value = ''
    return
  }

  // Remove todos os caracteres não numéricos
  editingAlerta.value.whatsapp = whatsapp.replace(/\D/g, '')

  if (editingAlerta.value.ddi === '55') {
    // Validação específica para números brasileiros
    if (!/^[1-9]{2}9?[0-9]{8}$/.test(editingAlerta.value.whatsapp)) {
      whatsappError.value = 'Número de WhatsApp inválido'
    } else {
      whatsappError.value = ''
    }
  } else {
    // Validação genérica para números internacionais
    if (editingAlerta.value.whatsapp.length < 8) {
      whatsappError.value = 'Número muito curto'
    } else {
      whatsappError.value = ''
    }
  }
}

const validarWhatsappCompleto = () => {
  if (editingAlerta.value.notificarWhatsapp) {
    if (!editingAlerta.value.whatsapp) {
      whatsappError.value = 'WhatsApp é obrigatório quando notificação está ativada'
    } else {
      validarWhatsapp()
    }
  }
}

const validarDDI = () => {
  const ddi = editingAlerta.value.ddi
  if (ddi) {
    // Remove todos os caracteres não numéricos
    editingAlerta.value.ddi = ddi.replace(/\D/g, '')
  }
}

const buscarCotacao = async () => {
  if (!editingAlerta.value.produto || !editingAlerta.value.moeda) {
    cotacaoAtual.value = null
    return
  }

  try {
    console.log('Buscando cotação para:', {
      produto: editingAlerta.value.produto,
      moeda: editingAlerta.value.moeda
    })

    // Verifica se é Remessa (aceita 'remessas' ou 'Remessa')
    if (['remessas', 'remessa'].includes(editingAlerta.value.produto.toLowerCase())) {
      console.log('Buscando cotação da API para Remessa')
      // Busca cotação de venda da API para remessas
      const response = await fetch(`https://economia.awesomeapi.com.br/json/${editingAlerta.value.moeda}-BRL`)
      const data = await response.json()
      console.log('Dados da API:', data)
      
      if (data && data[0]) {
        // Pega o valor de venda (ask)
        cotacaoAtual.value = parseFloat(data[0].ask)
      }
    } else if (editingAlerta.value.produto.toLowerCase() === 'turismo') {
      console.log('Buscando cotação para Turismo')
      // Busca cotações usando o composable
      const cotacoes = await cotacoesService.buscarCotacoes()
      
      if (cotacoes) {
        const cotacaoBase = cotacoes[editingAlerta.value.moeda]
        const taxa = cotacoesService.taxas.value[editingAlerta.value.moeda]
        console.log('Cotação base:', cotacaoBase, 'Taxa:', taxa)
        // Calcula a cotação final usando a função do useCotacoesTempoReal
        cotacaoAtual.value = cotacoesService.calcularCotacaoFinalComBase(editingAlerta.value.moeda, cotacaoBase, editingAlerta.value.produto)
      }
    }

    console.log('Cotação atual definida:', cotacaoAtual.value)
  } catch (error) {
    console.error('Erro ao buscar cotação:', error)
    cotacaoAtual.value = null
  }
}

// Formatar moeda com 4 casas decimais para remessa
const formatarMoeda = (valor: number) => {
  if (!valor) return 'R$ 0,00'
  
  const casasDecimais = editingAlerta.value?.produto === 'remessas' ? 4 : 2
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais
  }).format(valor)
}

// Watch para atualizar cotações quando mudar produto ou moeda
watch(
  [
    () => editingAlerta.value?.produto, 
    () => editingAlerta.value?.moeda
  ],
  () => {
    if (editingAlerta.value) {
      buscarCotacao()
    }
  }
)

// Watch para atualizar cotações quando alertas mudarem
watch(() => alertasStore.alertas, async (novosAlertas) => {
  console.log('Alertas mudaram, atualizando cotações...')
  for (const alerta of novosAlertas) {
    await buscarCotacaoAtual(alerta)
  }
}, { deep: true })
</script>

<template>
  <div class="py-6">
    <!-- Cabeçalho -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Alertas de Câmbio</h2>
        <p class="mt-1 text-sm text-gray-500">
          Gerencie seus alertas de cotação
        </p>
      </div>
      
      <div class="flex items-center gap-4">
        <!-- Campo de Busca -->
        <div class="relative">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
          </div>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Buscar em alertas..."
            class="block w-full rounded-lg border-0 py-2 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>
    </div>

    <!-- Lista de Alertas -->
    <div class="grid grid-cols-1 gap-6">
      <div v-if="!filteredAlertas.length" class="text-center py-12">
        <p class="text-sm text-gray-500">
          {{ searchTerm ? 'Nenhum alerta encontrado para sua busca.' : 'Nenhum alerta cadastrado.' }}
        </p>
      </div>

      <div
        v-for="alerta in filteredAlertas"
        :key="alerta.id"
        class="bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-200 transition-all shadow-sm">
        <!-- Cabeçalho do Card -->
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-lg font-semibold text-gray-900">{{ alerta.nome }}</h3>
              <span v-if="alerta.ativo" 
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                <CheckIcon class="h-3 w-3" />
                Ativo
              </span>
              <span v-else
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                <XMarkIcon class="h-3 w-3" />
                Inativo
              </span>
            </div>
            <p class="text-sm text-gray-500">
              Criado em {{ new Date(alerta.criadoEm).toLocaleDateString('pt-BR') }} às {{ new Date(alerta.criadoEm).toLocaleTimeString('pt-BR') }}
            </p>
          </div>
          
          <!-- Botões de ação -->
          <div class="flex items-center gap-2">
            <button @click="editarAlerta(alerta)" 
                    class="rounded-lg p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <PencilIcon class="h-5 w-5" />
            </button>
            <button @click="excluirAlerta(alerta.id)"
                    class="rounded-lg p-2 text-gray-400 hover:text-red-500 hover:bg-red-50">
              <TrashIcon class="h-5 w-5" />
            </button>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Produto e Moeda -->
          <div class="space-y-4">
            <div>
              <div class="flex items-center gap-2">
                <ShoppingBagIcon class="h-4 w-4 text-gray-400" />
                <h4 class="text-sm font-medium text-gray-500">Produto</h4>
              </div>
              <p class="mt-1 text-sm text-gray-900 ml-6">{{ alerta.produto === 'turismo' ? 'Turismo' : 'Remessas' }}</p>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <CurrencyDollarIcon class="h-4 w-4 text-gray-400" />
                <h4 class="text-sm font-medium text-gray-500">Moeda</h4>
              </div>
              <p class="mt-1 text-sm text-gray-900 ml-6">{{ alerta.moeda }}</p>
            </div>
          </div>

          <!-- Cotação e Data -->
          <div class="space-y-4">
            <div>
              <div class="flex items-center gap-2">
                <BanknotesIcon class="h-4 w-4 text-gray-400" />
                <h4 class="text-sm font-medium text-gray-500">Cotação Alvo</h4>
              </div>
              <div class="mt-1 ml-6 space-y-1">
                <p class="text-sm text-gray-900">{{ formatarMoeda(alerta.cotacaoAlvo) }}</p>
                <div class="flex items-center gap-2">
                  <p class="text-sm text-gray-500">Atual: 
                    <span :class="[
                      'font-medium',
                      cotacoesAtuais[alerta.id] > alerta.cotacaoAlvo ? 'text-green-600' : 'text-red-600'
                    ]">
                      {{ formatarMoeda(cotacoesAtuais[alerta.id]) }}
                    </span>
                  </p>
                  <span v-if="cotacoesAtuais[alerta.id]" 
                        :class="[
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          cotacoesAtuais[alerta.id] > alerta.cotacaoAlvo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        ]">
                    {{ cotacoesAtuais[alerta.id] > alerta.cotacaoAlvo ? '↗ Acima' : '↘ Abaixo' }}
                  </span>
                  <div v-if="webhookDisparos[alerta.id]" class="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                    </svg>
                    <span>
                      Alvo atingido às {{ webhookDisparos[alerta.id].horario }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div class="flex items-center gap-2">
                <CalendarIcon class="h-4 w-4 text-gray-400" />
                <h4 class="text-sm font-medium text-gray-500">Data Limite</h4>
              </div>
              <p class="mt-1 text-sm text-gray-900 ml-6">
                {{ formatarData(alerta.dataLimite) }}
                <span v-if="!dataExpirada(alerta.dataLimite)" class="ml-2 text-xs text-gray-500">
                  ({{ calcularDiasRestantes(alerta.dataLimite) }} dias restantes)
                </span>
                <span v-else class="ml-2 text-xs text-red-500">(Expirado)</span>
              </p>
            </div>
          </div>

          <!-- Contatos -->
          <div class="space-y-4">
            <div v-if="alerta.email">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <EnvelopeIcon class="h-4 w-4 text-gray-400" />
                  <h4 class="text-sm font-medium text-gray-500">Email</h4>
                </div>
                <span v-if="alerta.notificarEmail" 
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                  <CheckIcon class="h-3 w-3" />
                  Ativo
                </span>
                <span v-else
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                  <BellSlashIcon class="h-3 w-3" />
                  Inativo
                </span>
              </div>
              <div class="mt-1 flex items-center gap-2 ml-6">
                <p class="text-sm text-gray-900">{{ alerta.email }}</p>
              </div>
            </div>
            <div v-if="alerta.whatsapp">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <PhoneIcon class="h-4 w-4 text-gray-400" />
                  <h4 class="text-sm font-medium text-gray-500">WhatsApp</h4>
                </div>
                <span v-if="alerta.notificarWhatsapp" 
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                  <CheckIcon class="h-3 w-3" />
                  Ativo
                </span>
                <span v-else
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                  <BellSlashIcon class="h-3 w-3" />
                  Inativo
                </span>
              </div>
              <div class="mt-1 flex items-center gap-2 ml-6">
                <p class="text-sm text-gray-900">+{{ alerta.ddi }} {{ alerta.whatsapp }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mensagem quando não há alertas -->
    <div v-if="!alertasStore.loading && !alertasStore.error && alertasStore.alertas.length === 0" 
         class="text-center py-8 text-gray-500">
      Nenhum alerta cadastrado ainda.
    </div>

    <!-- Modal de Edição -->
    <TransitionRoot appear :show="showEditModal" as="template">
      <Dialog as="div" @close="showEditModal = false" class="relative z-10">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle as="div" class="border-b border-gray-100 pb-4 mb-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-2xl font-bold text-gray-900">Editar Alerta</h3>
                      <p class="mt-1 text-sm text-gray-500">Atualize as configurações do seu alerta.</p>
                    </div>
                    <button
                      @click="showEditModal = false"
                      class="rounded-lg p-2 text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon class="h-6 w-6" />
                    </button>
                  </div>
                </DialogTitle>

                <form @submit.prevent="salvarEdicao" class="space-y-6" v-if="editingAlerta">
                  <!-- Nome e Produto -->
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div class="space-y-2">
                      <label for="produto" class="block text-sm font-medium text-gray-700">Qual produto?</label>
                      <select
                        id="produto"
                        name="produto"
                        v-model="editingAlerta.produto"
                        class="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all h-[42px]"
                        required
                      >
                        <option value="">Selecione um produto</option>
                        <option value="turismo">Turismo</option>
                        <option value="remessas">Remessas</option>
                      </select>
                    </div>

                    <div class="space-y-2">
                      <label for="nome" class="block text-sm font-medium text-gray-700">Nome Completo</label>
                      <input
                        type="text"
                        name="nome"
                        id="nome"
                        v-model="editingAlerta.nome"
                        class="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all"
                        placeholder="Digite seu nome completo"
                        required
                      />
                    </div>
                  </div>

                  <!-- Email -->
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-6">
                    <div class="sm:col-span-3">
                      <label for="email" class="block text-sm font-medium text-gray-700">E-mail</label>
                      <div class="space-y-2">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          v-model="editingAlerta.email"
                          @input="validarEmail"
                          @blur="validarEmailCompleto"
                          :class="[
                            'block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all',
                            emailError ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-primary-600'
                          ]"
                          placeholder="seu@email.com"
                        />
                        <label class="flex items-center gap-3">
                          <input
                            type="checkbox"
                            v-model="editingAlerta.notificarEmail"
                            class="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                          />
                          <span class="text-sm text-gray-600">Receber por e-mail</span>
                        </label>
                        <p v-if="emailError" class="mt-1 text-sm text-red-600">{{ emailError }}</p>
                      </div>
                    </div>

                    <div class="sm:col-span-1">
                      <label for="ddi" class="block text-sm font-medium text-gray-700">DDI</label>
                      <input
                        type="text"
                        name="ddi"
                        id="ddi"
                        v-model="editingAlerta.ddi"
                        @input="validarDDI"
                        class="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all"
                        placeholder="55"
                      />
                    </div>

                    <div class="sm:col-span-2">
                      <label for="whatsapp" class="block text-sm font-medium text-gray-700">WhatsApp</label>
                      <div class="space-y-2">
                        <input
                          type="tel"
                          name="whatsapp"
                          id="whatsapp"
                          v-model="editingAlerta.whatsapp"
                          @input="validarWhatsapp"
                          class="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all"
                          :placeholder="editingAlerta.ddi === '55' ? '(99) 99999-9999' : 'Digite apenas números'"
                        />
                        <label class="flex items-center gap-3">
                          <input
                            type="checkbox"
                            v-model="editingAlerta.notificarWhatsapp"
                            class="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                          />
                          <span class="text-sm text-gray-600">Receber via WhatsApp</span>
                        </label>
                        <p v-if="whatsappError" class="mt-1 text-sm text-red-600">{{ whatsappError }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Moeda e Data Limite -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Moeda -->
                    <div>
                      <label for="moeda" class="block text-sm font-medium text-gray-700">Moeda</label>
                      <select
                        id="moeda"
                        name="moeda"
                        v-model="editingAlerta.moeda"
                        class="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all"
                        required
                      >
                        <option value="">Selecione uma moeda</option>
                        <option value="USD">Dólar Americano (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="GBP">Libra Esterlina (GBP)</option>
                      </select>
                    </div>

                    <!-- Data Limite -->
                    <div>
                      <label for="dataLimite" class="block text-sm font-medium text-gray-700">Data Limite</label>
                      <input
                        type="date"
                        id="dataLimite"
                        name="dataLimite"
                        v-model="editingAlerta.dataLimite"
                        class="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all"
                        required
                        :min="hoje"
                      />
                    </div>
                  </div>

                  <!-- Cotação Atual e Desejada -->
                  <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 mt-4">
                    <!-- Cotação Atual -->
                    <div class="sm:col-span-3">
                      <label class="block text-sm font-medium text-gray-700 mb-2">Cotação Atual</label>
                      <div class="block w-full rounded-lg border-0 py-2.5 px-3 bg-gray-50 text-gray-900 font-medium sm:text-sm sm:leading-6 h-[42px] ring-1 ring-inset ring-gray-300">
                        {{ cotacaoAtual ? formatarMoeda(cotacaoAtual) : '' }}
                      </div>
                    </div>

                    <!-- Cotação Desejada -->
                    <div class="sm:col-span-9">
                      <label for="cotacaoDesejada" class="block text-sm font-semibold text-primary-600 mb-2">
                        Cotação Desejada
                        <span class="ml-1 text-xs font-normal text-gray-500">(Este é o valor que você deseja ser alertado)</span>
                      </label>
                      <div class="relative">
                        <div class="absolute inset-0 bg-primary-50 rounded-lg transition-all animate-pulse"></div>
                        <Money3Component 
                          v-model="editingAlerta.cotacaoAlvo"
                          :config="moneyConfig"
                          class="relative block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-2 ring-inset ring-primary-500 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all bg-white font-medium"
                          placeholder="0,00"
                          required
                        />
                      </div>
                      <p class="text-sm text-primary-600 font-medium">
                        Você será notificado quando a cotação atingir este valor
                      </p>
                    </div>
                  </div>

                  <!-- Status do Alerta -->
                  <div class="mt-6 bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="ativo"
                        v-model="editingAlerta.ativo"
                        class="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                      />
                      <label for="ativo" class="text-sm text-gray-700">
                        Manter alerta ativo
                      </label>
                    </div>
                  </div>

                  <!-- Botões -->
                  <div class="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      @click="showEditModal = false"
                      class="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      class="inline-flex items-center gap-2 rounded-lg bg-[#654cf0] px-4 py-2.5 text-sm font-semibold text-[#D6FC49] shadow-sm hover:bg-[#5440d3] transition-all"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>
