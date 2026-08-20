import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/marketing',
      name: 'marketing-home',
      component: () => import('../views/MarketingHomeView.vue'),
      meta: { requiresAuth: true, role: 'marketing' },
    },
    {
      path: '/sampling',
      name: 'sampling-home',
      component: () => import('../views/SamplingHomeView.vue'),
      meta: { requiresAuth: true, role: 'sampling_admin' },
    },
    {
      path: '/',
      redirect: () => {
        const auth = useAuthStore();
        if (!auth.isAuthenticated) return '/login';
        return auth.isSampling ? '/sampling' : '/marketing';
      },
    },
  ],
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next('/login');
  }

  if (to.meta.requiresGuest && auth.isAuthenticated) {
    return next(auth.isSampling ? '/sampling' : '/marketing');
  }

  if (to.meta.role && auth.user?.role !== to.meta.role) {
    // Wrong role trying to access a role-specific page — redirect to their own home
    return next(auth.isSampling ? '/sampling' : '/marketing');
  }

  next();
});

export default router;