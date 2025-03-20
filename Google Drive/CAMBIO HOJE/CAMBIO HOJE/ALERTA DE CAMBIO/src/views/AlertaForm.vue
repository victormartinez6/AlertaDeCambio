<template>
  <div class="h-screen bg-gray-50/50 flex flex-col" :class="$attrs.class">
    <!-- Conteúdo Principal -->
    <div class="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
      <!-- Card principal -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100">
        <!-- Header do Card -->
        <div class="p-6 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">Alerta de Câmbio</h2>
              <p class="mt-1 text-sm text-gray-500">Configure seu alerta personalizado para acompanhar a cotação desejada.</p>
            </div>
            <router-link
              to="/cotacoes"
              class="inline-flex items-center gap-2 rounded-lg bg-[#654cf0] px-4 py-2 text-sm font-semibold text-[#D6FC49] shadow-sm hover:bg-[#5440d3] transition-all"
            >
              <ArrowLeftIcon class="h-4 w-4" />
              Cotações
            </router-link>
          </div>
        </div>

        <!-- Conteúdo do Card -->
        <div class="p-6">
          <form @submit.prevent="criarAlerta" class="space-y-6">
            <!-- Nome e Email -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="space-y-2">
                <label for="produto" class="block text-sm font-medium text-gray-700">Qual produto?</label>
                <select
                  id="produto"
                  name="produto"
                  v-model="formData.produto"
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
                  v-model="formData.nome"
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
                    v-model="formData.email"
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
                      v-model="formData.notificarEmail"
                      :disabled="!emailValido"
                      class="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600 disabled:opacity-50"
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
                  v-model="formData.ddi"
                  @input="validarDDI"
                  class="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all"
                  placeholder="+1"
                />
              </div>

              <div class="sm:col-span-2">
                <label for="whatsapp" class="block text-sm font-medium text-gray-700">WhatsApp</label>
                <div class="space-y-2">
                  <input
                    type="tel"
                    name="whatsapp"
                    id="whatsapp"
                    v-model="formData.whatsapp"
                    @input="validarWhatsapp"
                    class="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all"
                    :placeholder="formData.ddi === '55' ? '(99) 99999-9999' : 'Digite apenas números'"
                  />
                  <label class="flex items-center gap-3">
                    <input
                      type="checkbox"
                      v-model="formData.notificarWhatsapp"
                      :disabled="!whatsappValido"
                      class="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600 disabled:opacity-50"
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
                  v-model="formData.moeda"
                  class="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all h-[42px]"
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
                  v-model="formData.dataLimite"
                  class="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all h-[42px]"
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
                  {{ formatarMoeda(cotacaoAtual) }}
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
                    v-model="formData.cotacaoAlvo"
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

            <!-- Consentimento LGPD -->
            <div class="mt-6 bg-gray-50 rounded-lg p-4">
              <div class="flex gap-x-3">
                <div class="flex h-6 items-center">
                  <input
                    type="checkbox"
                    v-model="formData.consentimentoLgpd"
                    class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                    required
                  />
                </div>
                <div class="text-sm leading-6">
                  <p class="text-gray-600">
                    Sim, desejo receber e-mails sobre artigos, notícias, tendências ou ofertas. O consentimento pode ser retirado a qualquer momento clicando no link de cancelamento de inscrição presente em todas as comunicações por e-mail.
                  </p>
                  <p class="mt-2 text-gray-600">
                    A nossa empresa está comprometida a proteger e respeitar sua privacidade, seus dados são usados apenas para fins de marketing. 
                    <a href="#" class="text-primary-600 hover:text-primary-700 font-medium">Acesse nossa política de LGPD</a> para saber mais.
                  </p>
                </div>
              </div>
            </div>
            <!-- Botões -->
            <div class="flex justify-end gap-3 pt-4">
              <button
                type="button"
                @click="limparFormulario"
                class="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all"
              >
                <TrashIcon class="h-4 w-4 text-gray-500" />
                Limpar
              </button>
              <button
                type="submit"
                class="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-primary-500 hover:to-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all"
                :disabled="isLoading"
              >
                <BellAlertIcon class="h-4 w-4" />
                <span v-if="isLoading">Carregando...</span>
                <span v-else>Cadastrar Alerta</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal de Confirmação -->
  <TransitionRoot appear :show="showModal" as="template">
    <Dialog as="div" @close="showModal = false" class="relative z-10">
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

      <div class="fixed inset-0 flex items-start justify-center pt-16">
        <div class="w-full max-w-md px-4">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full transform overflow-hidden rounded-2xl bg-white p-5 text-left align-middle shadow-xl transition-all">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                <CheckCircleIcon class="h-8 w-8 text-green-600" aria-hidden="true" />
              </div>

              <DialogTitle as="h3" class="text-lg font-semibold text-center text-gray-900">
                Alerta Cadastrado com Sucesso!
              </DialogTitle>

              <div class="mt-3">
                <p class="text-sm text-center text-gray-500">
                  Seu alerta foi cadastrado e você receberá notificações quando a cotação atingir o valor desejado.
                </p>
              </div>

              <div class="mt-6 flex justify-center">
                <button
                  type="button"
                  @click="fecharModalEVoltar"
                  class="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all"
                >
                  <CheckIcon class="h-5 w-5 text-green-500" aria-hidden="true" />
                  Entendi, obrigado!
                </button>
              </div>

              <div class="mt-6 rounded-lg bg-gray-50 p-4">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <BellAlertIcon class="h-5 w-5 text-primary-500" aria-hidden="true" />
                  <span>Você será notificado pelos meios selecionados:</span>
                </div>
                <div class="mt-3 space-y-2">
                  <div v-if="formData.notificarEmail" class="flex items-center gap-2 text-sm text-gray-500">
                    <EnvelopeIcon class="h-4 w-4" aria-hidden="true" />
                    <span>Email: {{ formData.email }}</span>
                  </div>
                  <div v-if="formData.notificarWhatsapp" class="flex items-center gap-2 text-sm text-gray-500">
                    <PhoneIcon class="h-4 w-4" aria-hidden="true" />
                    <span>WhatsApp: +{{ formData.ddi }} {{ formData.whatsapp }}</span>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, useAttrs } from 'vue'
import { useRouter } from 'vue-router'
import { useAlertasStore } from '@/stores/alertas'
import { useCambioStore } from '@/stores/cambioStore'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { 
  ArrowLeftIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  TrashIcon,
  BellAlertIcon,
  CheckCircleIcon,
  CheckIcon,
  BellIcon,
  BellSlashIcon
} from '@heroicons/vue/24/outline'
import { Money3Component } from 'v-money3'

const router = useRouter()
const alertasStore = useAlertasStore()
const cambioStore = useCambioStore()

// Data mínima para o campo de data limite (hoje)
const hoje = computed(() => {
  const data = new Date()
  return data.toISOString().split('T')[0]
})

// Form data
const formData = ref({
  produto: '',
  nome: '',
  email: '',
  whatsapp: '',
  ddi: '55',
  moeda: '',
  cotacaoAlvo: '',
  dataLimite: hoje.value,
  notificarEmail: false,
  notificarWhatsapp: false
})

// Estado do formulário
const isLoading = ref(false)
const emailError = ref('')
const whatsappError = ref('')
const emailValido = computed(() => !emailError.value)
const whatsappValido = computed(() => !whatsappError.value)
const showModal = ref(false)
const modalMessage = ref('')

// Configurações
const moneyConfig = computed(() => ({
  masked: false,
  thousands: '.',
  decimal: ',',
  precision: formData.value.produto === 'remessas' ? 4 : 2,
  prefix: '',
  suffix: ''
}))

// Cotação atual
const cotacaoAtual = ref(null)

// Buscar cotação quando produto ou moeda mudar
watch(
  [() => formData.value.produto, () => formData.value.moeda],
  async () => {
    if (formData.value.produto && formData.value.moeda) {
      await buscarCotacao()
    }
  }
)

// Função para buscar cotação
async function buscarCotacao() {
  try {
    if (!formData.value.produto || !formData.value.moeda) {
      cotacaoAtual.value = null
      return
    }

    // Para turismo usa cotações do turismo, para remessas usa cotações comerciais
    if (formData.value.produto === 'turismo') {
      const cotacaoTurismo = cambioStore.cotacoesTurismo[formData.value.moeda]
      if (cotacaoTurismo) {
        cotacaoAtual.value = Number(cotacaoTurismo.venda)
      }
    } else {
      const cotacaoComercial = cambioStore.cotacoesComercial[formData.value.moeda]
      if (cotacaoComercial) {
        cotacaoAtual.value = Number(cotacaoComercial.ask)
      }
    }

    if (!cotacaoAtual.value) {
      console.error('Cotação não encontrada para', formData.value.produto, formData.value.moeda)
      cotacaoAtual.value = null
    }
  } catch (error) {
    console.error('Erro ao buscar cotação:', error)
    cotacaoAtual.value = null
  }
}

function limparFormulario() {
  formData.value = {
    produto: '',
    nome: '',
    email: '',
    whatsapp: '',
    ddi: '55',
    moeda: '',
    cotacaoAlvo: '',
    dataLimite: hoje.value,
    notificarEmail: false,
    notificarWhatsapp: false
  }
  emailError.value = ''
  whatsappError.value = ''
}

function voltarParaInicio() {
  router.push('/cotacoes')
}

async function criarAlerta() {
  try {
    // Validações
    validarEmailCompleto()
    validarWhatsappCompleto()

    if (emailError.value || whatsappError.value) {
      return
    }

    // Ativa loading
    isLoading.value = true

    // Preparar dados para envio
    const dados = {
      ...formData.value,
      cotacaoAlvo: Number(formData.value.cotacaoAlvo),
      email: formData.value.email || null,
      whatsapp: formData.value.whatsapp || null,
      ddi: formData.value.ddi || null,
      notificarEmail: Boolean(formData.value.notificarEmail),
      notificarWhatsapp: Boolean(formData.value.notificarWhatsapp),
      dataLimite: formData.value.dataLimite
    }

    // Criar alerta
    await alertasStore.criarAlerta(dados)

    showModal.value = true
    modalMessage.value = 'Alerta criado com sucesso!'
  } catch (error) {
    console.error('Erro ao criar alerta:', error)
    showModal.value = true
    modalMessage.value = 'Erro ao criar alerta. Por favor, tente novamente.'
  } finally {
    // Desativa loading
    isLoading.value = false
  }
}

function fecharModalEVoltar() {
  showModal.value = false
  router.push('/cotacoes')
}

function validarEmail() {
  const email = formData.value.email.trim()
  
  if (!email) {
    emailError.value = ''
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValid = emailRegex.test(email)
  
  if (isValid) {
    emailError.value = ''
  } else {
    emailError.value = 'E-mail inválido'
  }
}

function validarEmailCompleto() {
  if (!formData.value.email.trim() && formData.value.notificarEmail) {
    emailError.value = 'Insira um e-mail válido'
    return false
  }
  return emailValido.value
}

function validarWhatsapp() {
  const whatsapp = formData.value.whatsapp.replace(/\D/g, '')
  const ddi = formData.value.ddi.replace(/\D/g, '')

  if (!whatsapp) {
    whatsappError.value = ''
    return
  }

  if (ddi === '55') {
    // Validação para números brasileiros
    if (whatsapp.length === 11 || whatsapp.length === 10) {
      whatsappError.value = ''
    } else {
      whatsappError.value = 'WhatsApp inválido'
    }
  } else {
    // Validação para números internacionais (mínimo 8 dígitos)
    if (whatsapp.length >= 8) {
      whatsappError.value = ''
    } else {
      whatsappError.value = 'WhatsApp inválido'
    }
  }
}

function validarWhatsappCompleto() {
  if (!formData.value.whatsapp.trim() && formData.value.notificarWhatsapp) {
    whatsappError.value = 'Insira um número válido'
    return false
  }
  return whatsappValido.value
}

function validarDDI() {
  // Remove todos os caracteres não numéricos
  formData.value.ddi = formData.value.ddi.replace(/[^\d]/g, '')
  
  if (!formData.value.ddi) {
    return false
  }

  return true
}

function formatarMoeda(valor: number): string {
  if (!valor) return '0,00'
  
  // Para remessas, usa 4 casas decimais
  const precisao = formData.value.produto === 'remessas' ? 4 : 2
  
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: precisao,
    maximumFractionDigits: precisao
  })
}

onMounted(() => {
  cambioStore.iniciarAtualizacoesAutomaticas()
})
</script>
