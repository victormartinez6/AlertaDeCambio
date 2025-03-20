<template>
  <div class="dashboard-container min-h-screen bg-white">
    <!-- Header com Stats Principais -->
    <div class="stats-container p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div v-for="stat in mainStats" :key="stat.title" 
           class="stat-card bg-white rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 border border-[#01FBA1]/30 hover:border-[#01FBA1] group shadow-sm hover:shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-gray-500 text-sm font-medium mb-2">{{ stat.title }}</h3>
            <p class="text-3xl font-bold text-gray-900 group-hover:text-primary-600">{{ stat.value }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-[#01FBA1]/10 flex items-center justify-center group-hover:bg-[#01FBA1]/20">
            <component :is="stat.icon" class="w-6 h-6 text-[#01FBA1]" />
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center space-x-2">
            <span :class="[
              'text-sm font-medium',
              stat.trend > 0 ? 'text-[#01FBA1]' : 'text-red-600'
            ]">
              {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
            </span>
            <span class="text-gray-400 text-sm">vs último mês</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Grid Principal -->
    <div class="main-grid p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Gráfico Principal -->
      <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#01FBA1]/30 shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-900">Performance de Vendas</h2>
          <div class="flex items-center space-x-4">
            <button v-for="period in periods" 
                    :key="period"
                    @click="setActivePeriod(period)"
                    :class="[
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                      activePeriod === period 
                        ? 'bg-primary-600 text-white' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-primary-50'
                    ]">
              {{ period }}
            </button>
          </div>
        </div>
        <div class="relative h-[400px]">
          <canvas ref="salesChart"></canvas>
        </div>
      </div>

      <!-- Cards de Informação -->
      <div class="flex flex-col space-y-6">
        <!-- Card de Leads -->
        <div class="bg-white rounded-2xl p-6 border border-[#01FBA1]/30 shadow-sm">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Leads Recentes</h3>
          <div class="space-y-4">
            <div v-for="lead in recentLeads" 
                 :key="lead.id" 
                 class="flex items-center space-x-4 p-3 rounded-xl border border-transparent hover:border-[#01FBA1] transition-all duration-300">
              <div class="w-10 h-10 rounded-full bg-[#01FBA1]/10 flex items-center justify-center text-[#01FBA1] font-bold">
                {{ lead.name.charAt(0) }}
              </div>
              <div class="flex-1">
                <h4 class="text-gray-900 font-medium">{{ lead.name }}</h4>
                <p class="text-gray-500 text-sm">{{ lead.email }}</p>
              </div>
              <span :class="[
                'px-2 py-1 rounded-full text-xs font-medium',
                statusColors[lead.status]
              ]">
                {{ lead.status }}
              </span>
            </div>
          </div>
        </div>

        <!-- Card de Alertas -->
        <div class="bg-white rounded-2xl p-6 border border-[#01FBA1]/30 shadow-sm">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Alertas Ativos</h3>
          <div class="space-y-4">
            <div v-for="alert in activeAlerts" 
                 :key="alert.id" 
                 class="p-4 rounded-xl bg-white border border-[#01FBA1]/20 hover:border-[#01FBA1] transition-all duration-300">
              <div class="flex items-center justify-between mb-2">
                <span class="text-primary-700 font-medium">{{ alert.pair }}</span>
                <span class="text-gray-500 text-sm">{{ alert.date }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-700">Taxa Alvo: {{ alert.targetRate }}</span>
                <span :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  alert.type === 'above' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                ]">
                  {{ alert.type === 'above' ? '↑ Acima' : '↓ Abaixo' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Seção de Atividades -->
    <div class="activity-section p-6">
      <div class="bg-white rounded-2xl p-6 border border-[#01FBA1]/30 shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-900">Atividades Recentes</h2>
          <button class="text-[#01FBA1] hover:text-[#01FBA1]/80 transition-colors duration-300">
            Ver todas
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="activity in recentActivities" 
               :key="activity.id" 
               class="p-4 rounded-xl bg-white border border-[#01FBA1]/20 hover:border-[#01FBA1] transition-all duration-300">
            <div class="flex items-start space-x-4">
              <div class="w-8 h-8 rounded-lg bg-[#01FBA1]/10 flex items-center justify-center group-hover:bg-[#01FBA1]/20 transition-all duration-300">
                <component :is="activity.icon" class="w-4 h-4 text-[#01FBA1]" />
              </div>
              <div class="flex-1">
                <p class="text-gray-900 font-medium">{{ activity.title }}</p>
                <p class="text-gray-600 text-sm">{{ activity.description }}</p>
                <p class="text-gray-400 text-xs mt-2">{{ activity.time }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Chart from 'chart.js/auto';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/vue/24/outline';

// Dados mockados
const mainStats = [
  {
    title: 'Total de Leads',
    value: '2,543',
    trend: 12.5,
    icon: UserGroupIcon
  },
  {
    title: 'Vendas do Mês',
    value: 'R$ 125K',
    trend: 8.2,
    icon: CurrencyDollarIcon
  },
  {
    title: 'Taxa de Conversão',
    value: '18.2%',
    trend: -2.4,
    icon: ChartBarIcon
  },
  {
    title: 'Alertas Ativos',
    value: '156',
    trend: 5.7,
    icon: BellIcon
  }
];

const periods = ['7D', '30D', '90D', 'YTD'];
const activePeriod = ref('30D');

const recentLeads = [
  {
    id: 1,
    name: 'João Silva',
    email: 'joao@email.com',
    status: 'Novo'
  },
  {
    id: 2,
    name: 'Maria Santos',
    email: 'maria@email.com',
    status: 'Em Progresso'
  },
  {
    id: 3,
    name: 'Pedro Costa',
    email: 'pedro@email.com',
    status: 'Convertido'
  }
];

const statusColors = {
  'Novo': 'bg-blue-100 text-blue-700',
  'Em Progresso': 'bg-yellow-100 text-yellow-700',
  'Convertido': 'bg-green-100 text-green-700'
};

const activeAlerts = [
  {
    id: 1,
    pair: 'USD/BRL',
    targetRate: 'R$ 4,85',
    type: 'above',
    date: 'Hoje, 14:30'
  },
  {
    id: 2,
    pair: 'EUR/BRL',
    targetRate: 'R$ 5,25',
    type: 'below',
    date: 'Hoje, 15:45'
  }
];

const recentActivities = [
  {
    id: 1,
    icon: UserIcon,
    title: 'Novo Lead Cadastrado',
    description: 'João Silva foi adicionado como novo lead',
    time: 'Há 5 minutos'
  },
  {
    id: 2,
    icon: CheckCircleIcon,
    title: 'Venda Concluída',
    description: 'Venda de R$ 50.000 para Maria Santos',
    time: 'Há 2 horas'
  },
  {
    id: 3,
    icon: ClockIcon,
    title: 'Alerta Disparado',
    description: 'USD/BRL atingiu R$ 4,85',
    time: 'Há 3 horas'
  }
];

const salesChart = ref(null);

onMounted(() => {
  const ctx = salesChart.value.getContext('2d');
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{
        label: 'Vendas',
        data: [65, 59, 80, 81, 56, 95],
        borderColor: '#312E81', // primary-900 (dark)
        backgroundColor: 'rgba(49, 46, 129, 0.1)', // primary-900 com transparência
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          grid: {
            color: 'rgba(49, 46, 129, 0.1)' // primary-900 com transparência
          },
          ticks: {
            color: '#312E81' // primary-900
          }
        },
        x: {
          grid: {
            color: 'rgba(49, 46, 129, 0.1)' // primary-900 com transparência
          },
          ticks: {
            color: '#312E81' // primary-900
          }
        }
      }
    }
  });
});

const setActivePeriod = (period: string) => {
  activePeriod.value = period;
};
</script>

<style scoped>
.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.1), 0 4px 6px -2px rgba(99, 102, 241, 0.05);
}
</style>