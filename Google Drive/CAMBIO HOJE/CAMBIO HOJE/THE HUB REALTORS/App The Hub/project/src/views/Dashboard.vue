<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const chartData = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June'],
  datasets: [
    {
      label: 'Sales Performance',
      data: [65, 59, 80, 81, 56, 55],
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }
  ]
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
};

const stats = ref([
  { name: 'Total Leads', value: '71,897' },
  { name: 'Meetings Scheduled', value: '58' },
  { name: 'Properties Listed', value: '24' },
  { name: 'Conversion Rate', value: '24.57%' }
]);
</script>

<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      <!-- Stats -->
      <div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="item in stats"
          :key="item.name"
          class="bg-white overflow-hidden shadow rounded-lg"
        >
          <div class="px-4 py-5 sm:p-6">
            <dt class="text-sm font-medium text-gray-500 truncate">
              {{ item.name }}
            </dt>
            <dd class="mt-1 text-3xl font-semibold text-gray-900">
              {{ item.value }}
            </dd>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="mt-8 bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Performance Overview</h3>
        <div class="h-96">
          <Line :data="chartData" :options="chartOptions" />
        </div>
      </div>
    </div>
  </div>
</template>