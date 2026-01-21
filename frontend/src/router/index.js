import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

const routes = [
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/', component: () => import('../views/HomeView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router