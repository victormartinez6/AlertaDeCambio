<script setup lang="ts">
import { ref, computed } from 'vue';

interface Property {
  id: string;
  address: string;
  price: number;
  type: 'residential' | 'commercial';
  status: 'available' | 'pending' | 'sold';
  bedrooms?: number;
  bathrooms?: number;
  squareFeet: number;
  images: string[];
  description: string;
  createdAt: Date;
}

const properties = ref<Property[]>([
  {
    id: '1',
    address: '123 Main St, Los Angeles, CA 90001',
    price: 750000,
    type: 'residential',
    status: 'available',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 2000,
    images: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be'
    ],
    description: 'Beautiful modern home in prime location',
    createdAt: new Date()
  },
  {
    id: '2',
    address: '456 Business Ave, San Francisco, CA 94105',
    price: 2500000,
    type: 'commercial',
    status: 'pending',
    squareFeet: 5000,
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2'
    ],
    description: 'Prime commercial space in downtown area',
    createdAt: new Date()
  }
]);

const statusColors = {
  available: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-gray-100 text-gray-800'
};

const filterType = ref<string>('all');
const filterStatus = ref<string>('all');

const filteredProperties = computed(() => {
  return properties.value.filter(property => {
    const typeMatch = filterType.value === 'all' || property.type === filterType.value;
    const statusMatch = filterStatus.value === 'all' || property.status === filterStatus.value;
    return typeMatch && statusMatch;
  });
});

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(price);
};
</script>

<template>
  <div class="min-h-full bg-white py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-semibold text-gray-900">Properties</h1>
        <button
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add New Property
        </button>
      </div>

      <!-- Filters -->
      <div class="mt-4 grid grid-cols-2 gap-4">
        <select
          v-model="filterType"
          class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="all">All Types</option>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
        </select>

        <select
          v-model="filterStatus"
          class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="pending">Pending</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      <!-- Properties Grid -->
      <div class="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="property in filteredProperties"
          :key="property.id"
          class="bg-white overflow-hidden shadow rounded-lg"
        >
          <div class="relative h-48">
            <img
              :src="property.images[0]"
              class="w-full h-full object-cover"
              alt="Property"
            />
            <span
              :class="[
                statusColors[property.status],
                'absolute top-2 right-2 inline-flex rounded-full px-2 text-xs font-semibold leading-5'
              ]"
            >
              {{ property.status }}
            </span>
          </div>
          
          <div class="p-4">
            <h3 class="text-lg font-medium text-gray-900 truncate">
              {{ property.address }}
            </h3>
            <p class="mt-1 text-xl font-semibold text-indigo-600">
              {{ formatPrice(property.price) }}
            </p>
            <div class="mt-2 flex items-center text-sm text-gray-500">
              <template v-if="property.type === 'residential'">
                <span>{{ property.bedrooms }} beds</span>
                <span class="mx-1">•</span>
                <span>{{ property.bathrooms }} baths</span>
                <span class="mx-1">•</span>
              </template>
              <span>{{ property.squareFeet.toLocaleString() }} sq ft</span>
            </div>
            <p class="mt-2 text-sm text-gray-500 line-clamp-2">
              {{ property.description }}
            </p>
          </div>

          <div class="border-t border-gray-200 px-4 py-3">
            <button class="text-sm text-indigo-600 hover:text-indigo-900 font-medium">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>