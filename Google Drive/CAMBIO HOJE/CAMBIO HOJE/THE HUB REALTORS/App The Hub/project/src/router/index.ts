import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '../firebase/config';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/leads',
    component: () => import('../views/Leads.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/properties',
    component: () => import('../views/Properties.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    component: () => import('../views/Calendar.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/learning',
    component: () => import('../views/Learning.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = auth.currentUser;

  if (requiresAuth && !isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router;