<template>
  <div class="relative group">
    <div class="absolute -inset-1 bg-gradient-to-r from-[#01FBA1] to-[#01FBA1] rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
    <div class="relative px-4 py-4 bg-white ring-1 ring-gray-900/5 rounded-lg leading-none flex items-top justify-start">
      <div class="w-full">
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-2">
            <CountryFlag :country-code="fromCountry" show-code />
            <span class="text-secondary-400">/</span>
            <CountryFlag :country-code="toCountry" show-code />
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-primary-500 mb-1">{{ formatCurrency(currentRate) }}</div>
            <div :class="variationClass">
              <span class="flex items-center gap-1">
                <svg v-if="variation >= 0" class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L20 10H4L12 2Z" />
                </svg>
                <svg v-else class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22L20 14H4L12 22Z" />
                </svg>
                {{ variation > 0 ? '+' : ''}}{{ variation }}%
              </span>
            </div>
          </div>
        </div>
        <div class="h-[8.75rem] w-full">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import CountryFlag from './CountryFlag.vue';

Chart.register(...registerables);

const props = defineProps<{
  currencyPair: string;
  currentRate: number;
  variation: number;
  historicalData: { date: string; rate: number }[];
}>();

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

const fromCountry = computed(() => {
  const [from] = props.currencyPair.split('/');
  if (from === 'USD') return 'US';
  if (from === 'EUR') return 'EU';
  if (from === 'GBP') return 'GB';
  return from;
});

const toCountry = computed(() => {
  const [, to] = props.currencyPair.split('/');
  if (to === 'BRL') return 'BR';
  return to;
});

const variationClass = computed(() => {
  const baseClasses = 'inline-flex px-3 py-1 rounded-full text-sm font-semibold';
  return props.variation >= 0
    ? `${baseClasses} bg-green-500/20 text-green-600`
    : `${baseClasses} bg-red-500/20 text-red-600`;
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  }).format(value);
};

const createChart = () => {
  if (!chartCanvas.value) return;

  const ctx = chartCanvas.value.getContext('2d');
  if (!ctx) return;

  if (chart) {
    chart.destroy();
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, 160);
  gradient.addColorStop(0, 'rgba(1, 251, 161, 0.2)');
  gradient.addColorStop(1, 'rgba(1, 251, 161, 0)');

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: props.historicalData.map(item => item.date),
      datasets: [{
        label: props.currencyPair,
        data: props.historicalData.map(item => item.rate),
        borderColor: '#01FBA1',
        backgroundColor: gradient,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#01FBA1',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            display: true,
            maxRotation: 0,
            font: {
              size: 10
            }
          }
        },
        y: {
          display: false
        }
      }
    }
  });
};

onMounted(() => {
  createChart();
});

watch(() => props.historicalData, () => {
  createChart();
}, { deep: true });
</script>
