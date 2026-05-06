import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/change-password',
      name: 'change-password',
      component: () => import('../views/ChangePasswordView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/passengers',
      name: 'admin-passengers',
      component: () => import('../views/AdminPassengersView.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/admin/staff',
      name: 'admin-staff',
      component: () => import('../views/AdminStaffView.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/airline',
      name: 'airline',
      component: () => import('../views/AirlineStaffView.vue'),
      meta: { requiresAuth: true, role: 'airline' }
    },
    {
      path: '/ground',
      name: 'ground',
      component: () => import('../views/GroundCrewView.vue'),
      meta: { requiresAuth: true, role: 'ground' }
    },
    {
      path: '/gate',
      name: 'gate',
      component: () => import('../views/GateStaffView.vue'),
      meta: { requiresAuth: true, role: 'gate' }
    },
    {
      path: '/passenger',
      name: 'passenger',
      component: () => import('../views/PassengerView.vue'),
      meta: { requiresAuth: true, role: 'passenger' }
    }
  ]
})

// Route guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (authStore.isAuthenticated && authStore.mustChangePassword && to.name !== 'change-password') {
    next('/change-password')
  } else if (to.meta.role && authStore.userRole !== to.meta.role) {
    next('/login')
  } else {
    next()
  }
})

export default router
