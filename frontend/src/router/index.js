import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '数据统计', requiresAuth: true }
      },
      {
        path: 'submissions',
        name: 'Submissions',
        component: () => import('../views/Submissions.vue'),
        meta: { title: '提交记录', requiresAuth: true }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/Users.vue'),
        meta: { title: '用户管理', requiresAuth: true }
      },
      {
        path: 'home-config',
        name: 'HomeConfig',
        component: () => import('../views/HomeConfig.vue'),
        meta: { title: '首页配置', requiresAuth: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isLoggedIn = userStore.isLoggedIn

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 后台管理系统` : '后台管理系统'

  // 需要登录的页面
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && isLoggedIn) {
    // 已登录时访问登录页，跳转到首页
    next('/')
  } else {
    next()
  }
})

export default router
