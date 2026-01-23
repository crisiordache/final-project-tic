import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import HomeView from '../views/HomeView.vue'
import CreateEventView from '../views/CreateEventView.vue'
import { useAuthStore } from '../stores/auth';
import EditEventView from '../views/CreateEventView.vue';

const routes = [
  { path: '/', component: HomeView },
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  {
    path: '/create-event',
    name: 'CreateEvent',
    component: CreateEventView,
    meta: { requiresAdmin: true }
  },
  {
    path: '/edit-event/:id',
    name: 'EditEvent',
    component: EditEventView,
    meta: { requiresAdmin: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/');
  } else {
    next();
  }
});
export default router