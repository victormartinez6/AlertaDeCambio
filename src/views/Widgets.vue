<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Widgets</h1>
      <router-link 
        to="/agente/widgets/novo" 
        class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        <PlusIcon class="h-5 w-5 mr-1.5" />
        Novo Widget
      </router-link>
    </div>
    
    <!-- Lista de Widgets -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div v-if="carregando" class="p-8 text-center">
        <div class="inline-flex items-center px-4 py-2">
          <ArrowPathIcon class="h-5 w-5 animate-spin mr-2" />
          Carregando widgets...
        </div>
      </div>
      
      <div v-else-if="widgets.length === 0" class="p-8 text-center">
        <div class="max-w-md mx-auto">
          <DocumentIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhum widget encontrado</h3>
          <p class="text-gray-500 mb-6">Você ainda não criou nenhum widget. Crie seu primeiro widget para começar.</p>
          <router-link 
            to="/agente/widgets/novo" 
            class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <PlusIcon class="h-5 w-5 mr-1.5" />
            Criar primeiro widget
          </router-link>
        </div>
      </div>
      
      <div v-else>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Nome
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Moedas
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tema
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Criado em
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="widget in widgets" :key="widget.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">{{ widget.nome }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500 dark:text-gray-300">
                  {{ contarMoedasSelecionadas(widget) }} moedas
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" 
                  :class="widget.config.tema === 'escuro' ? 'bg-gray-800 text-white' : 'bg-yellow-100 text-yellow-800'">
                  {{ widget.config.tema === 'escuro' ? 'Escuro' : 'Claro' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {{ formatarData(widget.criadoEm) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <router-link 
                    :to="`/agente/widgets/${widget.id}`" 
                    class="text-purple-600 hover:text-purple-900"
                    title="Editar"
                  >
                    <PencilIcon class="h-5 w-5" />
                  </router-link>
                  <button 
                    @click="copiarCodigoWidget(widget)" 
                    class="text-blue-600 hover:text-blue-900"
                    title="Copiar código"
                  >
                    <ClipboardDocumentIcon class="h-5 w-5" />
                  </button>
                  <button 
                    @click="confirmarExclusao(widget)" 
                    class="text-red-600 hover:text-red-900"
                    title="Excluir"
                  >
                    <TrashIcon class="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Modal de confirmação de exclusão -->
    <div v-if="modalExclusao.visivel" class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Confirmar exclusão</h3>
        <p class="text-gray-500 mb-6">
          Tem certeza que deseja excluir o widget <span class="font-medium">{{ modalExclusao.widget?.nome }}</span>? 
          Esta ação não pode ser desfeita.
        </p>
        <div class="flex justify-end space-x-4">
          <button 
            @click="modalExclusao.visivel = false" 
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="excluirWidget" 
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
    
    <!-- Toast de notificação -->
    <div 
      v-if="notificacao.visivel" 
      class="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center"
    >
      <CheckCircleIcon v-if="notificacao.tipo === 'sucesso'" class="h-5 w-5 text-green-400 mr-2" />
      <ExclamationCircleIcon v-else class="h-5 w-5 text-red-400 mr-2" />
      {{ notificacao.mensagem }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { 
  PlusIcon, 
  DocumentIcon, 
  ArrowPathIcon, 
  PencilIcon, 
  TrashIcon, 
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'
import { db } from '@/firebase/config'
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'WidgetsView',
  components: {
    PlusIcon,
    DocumentIcon,
    ArrowPathIcon,
    PencilIcon,
    TrashIcon,
    ClipboardDocumentIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
  },
  setup() {
    const authStore = useAuthStore()
    const widgets = ref([])
    const carregando = ref(true)
    
    const modalExclusao = ref({
      visivel: false,
      widget: null
    })
    
    const notificacao = ref({
      visivel: false,
      mensagem: '',
      tipo: 'sucesso'
    })
    
    // Busca os widgets do usuário
    async function buscarWidgets() {
      if (!authStore.user) return
      
      try {
        carregando.value = true
        
        const widgetsRef = collection(db, 'widgets')
        const q = query(widgetsRef, where('userId', '==', authStore.user.uid))
        const querySnapshot = await getDocs(q)
        
        widgets.value = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } catch (error) {
        console.error('Erro ao buscar widgets:', error)
        mostrarNotificacao('Erro ao carregar widgets', 'erro')
      } finally {
        carregando.value = false
      }
    }
    
    // Conta quantas moedas estão selecionadas no widget
    function contarMoedasSelecionadas(widget) {
      if (!widget.moedas || !Array.isArray(widget.moedas)) return 0
      return widget.moedas.filter(m => m.selecionada).length
    }
    
    // Formata a data para exibição
    function formatarData(dataString) {
      if (!dataString) return '-'
      
      try {
        // Verifica se é um timestamp do Firestore
        if (dataString && dataString.seconds) {
          // Converte timestamp do Firestore para Date
          const data = new Date(dataString.seconds * 1000)
          return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).format(data)
        } else {
          // Tenta converter string para Date
          const data = new Date(dataString)
          return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).format(data)
        }
      } catch (error) {
        console.error('Erro ao formatar data:', error, dataString)
        return '-'
      }
    }
    
    // Abre o modal de confirmação de exclusão
    function confirmarExclusao(widget) {
      modalExclusao.value = {
        visivel: true,
        widget
      }
    }
    
    // Exclui o widget
    async function excluirWidget() {
      if (!modalExclusao.value.widget) return
      
      try {
        const widgetId = modalExclusao.value.widget.id
        await deleteDoc(doc(db, 'widgets', widgetId))
        
        // Remove o widget da lista
        widgets.value = widgets.value.filter(w => w.id !== widgetId)
        
        // Fecha o modal
        modalExclusao.value.visivel = false
        
        // Mostra notificação de sucesso
        mostrarNotificacao('Widget excluído com sucesso')
      } catch (error) {
        console.error('Erro ao excluir widget:', error)
        mostrarNotificacao('Erro ao excluir widget', 'erro')
      }
    }
    
    // Copia o código de incorporação do widget
    function copiarCodigoWidget(widget) {
      if (!widget) return
      
      try {
        // Gera o código de incorporação
        const moedasSelecionadas = widget.moedas
          .filter(m => m.selecionada)
          .sort((a, b) => a.ordem - b.ordem)
          .map(m => m.codigo)
          .join(',')
        
        const config = widget.config || {}
        
        // Usamos variáveis para evitar que as tags script sejam interpretadas pelo Vue
        const scriptTagOpen = '<' + 'script>';
        const scriptTagClose = '</' + 'script>';
        
        const embedCode = `<!-- Alerta de Câmbio Widget BEGIN -->
<div class="alerta-cambio-widget-container" style="max-width: 100%; margin: 0 auto;">
  <div id="alerta-cambio-widget" style="width: 100%;"></div>
  <div class="alerta-cambio-widget-copyright" style="font-size: 10px; text-align: right; margin-top: 4px; opacity: 0.6;">
    <a href="https://alerta-de-cambio.vercel.app" rel="noopener nofollow" target="_blank" style="color: #6B7280; text-decoration: none;">
      <span>Powered by Alerta de Câmbio</span>
    </a>
  </div>
  ${scriptTagOpen}
  (function() {
    var script = document.createElement('script');
    script.src = 'https://alerta-de-cambio.vercel.app/widgets/ticker.js';
    script.async = true;
    script.onload = function() {
      if (window.AlertaCambioWidget) {
        window.AlertaCambioWidget.init({
          container: 'alerta-cambio-widget',
          symbols: '${moedasSelecionadas}',
          ${config.tema === 'escuro' ? "theme: 'dark'," : "theme: 'light',"}
          ${!config.fundoTransparente ? `bgColor: '${config.corFundo}',` : "bgColor: 'transparent',"}
          showLogos: ${config.mostrarLogos},
          showVariation: ${config.mostrarVariacao},
          width: '100%',
          lang: '${config.idioma || 'pt-BR'}'
        });
      }
    };
    document.head.appendChild(script);
  })();
  ${scriptTagClose}
</div>
<!-- Alerta de Câmbio Widget END -->`;
        
        // Copia para a área de transferência
        navigator.clipboard.writeText(embedCode)
          .then(() => {
            mostrarNotificacao('Código copiado para a área de transferência')
          })
          .catch(err => {
            console.error('Erro ao copiar código:', err)
            mostrarNotificacao('Erro ao copiar código', 'erro')
          })
      } catch (error) {
        console.error('Erro ao gerar código de incorporação:', error)
        mostrarNotificacao('Erro ao gerar código', 'erro')
      }
    }
    
    // Mostra uma notificação temporária
    function mostrarNotificacao(mensagem, tipo = 'sucesso') {
      notificacao.value = {
        visivel: true,
        mensagem,
        tipo
      }
      
      // Esconde a notificação após 3 segundos
      setTimeout(() => {
        notificacao.value.visivel = false
      }, 3000)
    }
    
    onMounted(() => {
      buscarWidgets()
    })
    
    return {
      widgets,
      carregando,
      modalExclusao,
      notificacao,
      contarMoedasSelecionadas,
      formatarData,
      confirmarExclusao,
      excluirWidget,
      copiarCodigoWidget
    }
  }
}
</script>
