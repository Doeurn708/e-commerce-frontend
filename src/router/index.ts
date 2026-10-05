import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { setUnauthorizedHandler } from '../api/client'
import { useAuth, useAuthStore } from '../stores/auth'
import { getResetEmail, isResetVerified } from '../utils/passwordReset'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/home',
      redirect: '/',
    },
    {
      path: '/shop',
      name: 'shop',
      component: () => import('../views/ShopView.vue'),
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('../views/CategoriesView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/product/:id',
      name: 'product',
      component: () => import('../views/ProductDetailView.vue'),
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../views/CartView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('../views/CheckoutView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/verify-otp',
      name: 'verify-otp',
      component: () => import('../views/VerifyOtpView.vue'),
      meta: { guestOnly: true, requiresResetEmail: true },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/ResetPasswordView.vue'),
      meta: { guestOnly: true, requiresResetVerified: true },
    },
    {
      path: '/auth/google/callback',
      name: 'auth-google-callback',
      component: () => import('../views/GoogleCallbackView.vue'),
    },
    {
      // Standalone profile page reached from the navbar dropdown.
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/account',
      component: () => import('../layouts/AccountLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          // The profile now lives at /profile; keep the old path working so
          // bookmarks and the account sidebar link do not 404.
          path: '',
          name: 'account-profile',
          redirect: { name: 'profile' },
        },
        {
          path: 'orders',
          name: 'account-orders',
          component: () => import('../views/OrdersView.vue'),
        },
        {
          path: 'orders/:id',
          name: 'account-order-detail',
          component: () => import('../views/OrderDetailView.vue'),
        },
        {
          path: 'wishlist',
          name: 'account-wishlist',
          component: () => import('../views/WishlistView.vue'),
        },
        {
          path: 'settings',
          name: 'account-settings',
          component: () => import('../views/SettingsView.vue'),
        },
      ],
    },
    {
      path: '/admin/overview',
      redirect: { name: 'admin-dashboard' },
    },
    {
      path: '/admin',
      component: () => import('../layouts/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      children: [
        {
          path: '',
          redirect: { name: 'admin-dashboard' },
        },
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('../views/admin/DashboardView.vue'),
        },
        {
          path: 'products',
          name: 'admin-products',
          component: () => import('../views/admin/ProductsView.vue'),
        },
        {
          path: 'products/create',
          name: 'admin-product-create',
          component: () => import('../views/admin/ProductFormView.vue'),
        },
        {
          path: 'products/:id',
          name: 'admin-product-view',
          component: () => import('../views/admin/ProductFormView.vue'),
        },
        {
          path: 'products/:id/edit',
          name: 'admin-product-edit',
          component: () => import('../views/admin/ProductFormView.vue'),
        },
        {
          path: 'categories',
          name: 'admin-categories',
          component: () => import('../views/admin/CategoriesView.vue'),
        },
        {
          path: 'categories/create',
          name: 'admin-category-create',
          component: () => import('../views/admin/CategoryFormView.vue'),
        },
        {
          path: 'categories/:id/edit',
          name: 'admin-category-edit',
          component: () => import('../views/admin/CategoryFormView.vue'),
        },
        {
          path: 'orders',
          name: 'admin-orders',
          component: () => import('../views/admin/OrdersView.vue'),
        },
        {
          path: 'orders/:id',
          name: 'admin-order-detail',
          component: () => import('../views/admin/OrderDetailView.vue'),
        },
        {
          path: 'customers',
          name: 'admin-customers',
          component: () => import('../views/admin/CustomersView.vue'),
        },
        {
          path: 'users',
          redirect: { name: 'admin-customers' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const { isAuthenticated, isAdmin } = useAuth()

  if (to.meta.requiresAdmin && !isAuthenticated.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !isAdmin.value) {
    return { name: 'home' }
  }
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresResetEmail && !getResetEmail()) {
    return { name: 'forgot-password' }
  }
  if (to.meta.requiresResetVerified && (!getResetEmail() || !isResetVerified())) {
    return { name: 'forgot-password' }
  }
  if (to.meta.guestOnly && isAuthenticated.value) {
    return { name: 'home' }
  }
})

/**
 * A 401 from the API means the stored Sanctum token is gone or revoked. Drop
 * the session and send the visitor to the login page, remembering where they
 * were. `useAuthStore` is used here rather than `useAuth()` because the guard
 * runs before any component is mounted.
 */
setUnauthorizedHandler(() => {
  const auth = useAuthStore()
  auth.clearAuth()

  if (router.currentRoute.value.name === 'login') return

  void router.replace({
    name: 'login',
    query: { redirect: router.currentRoute.value.fullPath },
  })
})

export default router