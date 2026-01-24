import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import HomeView from '../views/HomeView.vue';
import CreateEventView from '../views/CreateEventView.vue';
import { useAuthStore } from '../stores/auth';
import EditEventView from '../views/CreateEventView.vue';
import CreateBookingView from '../views/CreateBookingView.vue';
import MyBookings from '../views/MyBookings.vue';

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
  },
  {
    path: '/book/:id',
    name: 'CreateBooking',
    component: CreateBookingView,
    meta: { requiresAuth: true }
  },
  {
    path: '/my-bookings',
    name: 'MyBookings',
    component: MyBookings,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next('/');
  } 
  if(to.meta.requiresAuth && !authStore.isLoggedIn) {
    return next('/login');
  }

  next();
});

export default router