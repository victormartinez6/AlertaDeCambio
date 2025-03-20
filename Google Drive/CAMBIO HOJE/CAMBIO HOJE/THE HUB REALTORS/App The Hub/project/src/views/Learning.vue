<script setup lang="ts">
import { ref, computed } from 'vue';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  progress: number;
  thumbnail: string;
  category: 'sales' | 'marketing' | 'legal' | 'technology';
  level: 'beginner' | 'intermediate' | 'advanced';
  modules: {
    id: string;
    title: string;
    duration: string;
    completed: boolean;
  }[];
}

const courses = ref<Course[]>([
  {
    id: '1',
    title: 'Real Estate Sales Mastery',
    description: 'Learn advanced techniques for closing deals and building client relationships',
    duration: '4 hours',
    progress: 75,
    thumbnail: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11',
    category: 'sales',
    level: 'intermediate',
    modules: [
      {
        id: 'm1',
        title: 'Building Trust with Clients',
        duration: '45 min',
        completed: true
      },
      {
        id: 'm2',
        title: 'Negotiation Strategies',
        duration: '60 min',
        completed: true
      },
      {
        id: 'm3',
        title: 'Closing Techniques',
        duration: '75 min',
        completed: false
      }
    ]
  },
  {
    id: '2',
    title: 'Digital Marketing for Realtors',
    description: 'Master social media and online marketing strategies for real estate',
    duration: '6 hours',
    progress: 30,
    thumbnail: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a',
    category: 'marketing',
    level: 'beginner',
    modules: [
      {
        id: 'm1',
        title: 'Social Media Fundamentals',
        duration: '60 min',
        completed: true
      },
      {
        id: 'm2',
        title: 'Content Creation',
        duration: '90 min',
        completed: false
      },
      {
        id: 'm3',
        title: 'Lead Generation',
        duration: '60 min',
        completed: false
      }
    ]
  }
]);

const categories = [
  { id: 'all', name: 'All Courses' },
  { id: 'sales', name: 'Sales' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'legal', name: 'Legal' },
  { id: 'technology', name: 'Technology' }
];

const selectedCategory = ref('all');

const filteredCourses = computed(() => {
  if (selectedCategory.value === 'all') return courses.value;
  return courses.value.filter(course => course.category === selectedCategory.value);
});

const getLevelBadgeColor = (level: string) => {
  switch (level) {
    case 'beginner':
      return 'bg-green-100 text-green-800';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800';
    case 'advanced':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
</script>

<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-semibold text-gray-900">Learning Center</h1>
      </div>

      <!-- Category Filter -->
      <div class="mt-6">
        <div class="sm:hidden">
          <select
            v-model="selectedCategory"
            class="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        <div class="hidden sm:block">
          <nav class="flex space-x-4">
            <button
              v-for="category in categories"
              :key="category.id"
              @click="selectedCategory = category.id"
              :class="[
                selectedCategory === category.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700',
                'px-3 py-2 rounded-md text-sm font-medium'
              ]"
            >
              {{ category.name }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Courses Grid -->
      <div class="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="course in filteredCourses"
          :key="course.id"
          class="bg-white overflow-hidden shadow rounded-lg"
        >
          <div class="relative h-48">
            <img
              :src="course.thumbnail"
              class="w-full h-full object-cover"
              alt="Course thumbnail"
            />
            <span
              :class="[
                getLevelBadgeColor(course.level),
                'absolute top-2 right-2 inline-flex rounded-full px-2 text-xs font-semibold leading-5'
              ]"
            >
              {{ course.level }}
            </span>
          </div>
          
          <div class="p-4">
            <h3 class="text-lg font-medium text-gray-900">{{ course.title }}</h3>
            <p class="mt-1 text-sm text-gray-500">{{ course.description }}</p>
            
            <div class="mt-4">
              <div class="flex justify-between text-sm text-gray-500">
                <span>Progress</span>
                <span>{{ course.progress }}%</span>
              </div>
              <div class="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-indigo-600 h-2 rounded-full"
                  :style="{ width: `${course.progress}%` }"
                ></div>
              </div>
            </div>

            <div class="mt-4 flex items-center justify-between">
              <span class="text-sm text-gray-500">{{ course.duration }}</span>
              <button class="text-sm text-indigo-600 hover:text-indigo-900 font-medium">
                Continue Learning
              </button>
            </div>
          </div>

          <!-- Course Modules -->
          <div class="border-t border-gray-200 px-4 py-3">
            <h4 class="text-sm font-medium text-gray-900 mb-2">Modules</h4>
            <ul class="space-y-2">
              <li
                v-for="module in course.modules"
                :key="module.id"
                class="flex items-center justify-between text-sm"
              >
                <div class="flex items-center">
                  <span
                    :class="[
                      module.completed ? 'bg-green-400' : 'bg-gray-200',
                      'h-2 w-2 rounded-full mr-2'
                    ]"
                  ></span>
                  <span :class="module.completed ? 'text-gray-900' : 'text-gray-500'">
                    {{ module.title }}
                  </span>
                </div>
                <span class="text-gray-400">{{ module.duration }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>