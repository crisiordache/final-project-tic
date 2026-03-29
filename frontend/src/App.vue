<script setup>
import { onMounted, ref } from "vue";
import { useAuthStore } from "./stores/auth";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();
const menuOpen = ref(false);

const handleLogout = () => {
  authStore.logout();
  router.push('/');
  menuOpen.value = false;
}

const closeMenu = () => {
  menuOpen.value = false;
}

onMounted(() => {
  authStore.init();
});
</script>

<template>
  <nav class="bg-white border-b border-gray-400 text-gray-900 sticky top-0 z-40 shadow-md">
    <div class="flex items-center justify-between p-4">
      <!-- Logo/Home -->
      <router-link to="/" class="text-xl font-bold text-blue-700 hover:text-blue-900 transition-colors">
        🎫 ReserveIT
      </router-link>

      <!-- Desktop Menu -->
      <div class="hidden md:flex items-center gap-6">
        <router-link to="/" class="text-gray-800 hover:text-blue-700 transition-colors text-sm font-semibold">
          Home
        </router-link>
        <router-link
          v-if="!authStore.isLoggedIn"
          to="/login"
          class="text-gray-800 hover:text-blue-700 transition-colors text-sm font-semibold"
        >
          Login
        </router-link>
        <router-link
          v-if="!authStore.isLoggedIn"
          to="/register"
          class="text-gray-800 hover:text-blue-700 transition-colors text-sm font-semibold"
        >
          Register
        </router-link>
        <router-link 
          v-if="authStore.isLoggedIn && !authStore.isAdmin" 
          to="/my-bookings" 
          class="text-gray-800 hover:text-blue-700 transition-colors text-sm font-semibold"
        >
          My Bookings
        </router-link>
        <router-link
          v-if="authStore.isLoggedIn && authStore.isAdmin"
          to="/manage-users"
          class="text-gray-800 hover:text-blue-700 transition-colors text-sm font-semibold"
        >
          Manage Users
        </router-link>
        <button
          v-if="authStore.isLoggedIn"
          @click="handleLogout"
          class="bg-red-700 hover:bg-red-900 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
        >
          Logout
        </button>
      </div>

      <!-- Burger Menu Button (Mobile) -->
      <button
        @click="menuOpen = !menuOpen"
        class="md:hidden flex flex-col gap-1.5 w-8 h-8 justify-center items-center"
      >
        <span :class="['w-6 h-0.5 bg-gray-800 transition-all', menuOpen && 'rotate-45 translate-y-2']"></span>
        <span :class="['w-6 h-0.5 bg-gray-800 transition-all', menuOpen && 'opacity-0']"></span>
        <span :class="['w-6 h-0.5 bg-gray-800 transition-all', menuOpen && '-rotate-45 -translate-y-2']"></span>
      </button>
    </div>

    <!-- Mobile Menu -->
    <div
      v-if="menuOpen"
      class="md:hidden bg-white border-t border-gray-400 p-4 space-y-3"
    >
      <router-link 
        to="/" 
        @click="closeMenu"
        class="block text-gray-800 hover:text-blue-700 transition-colors font-semibold py-2 border-b border-gray-300"
      >
        Home
      </router-link>
      <router-link
        v-if="!authStore.isLoggedIn"
        to="/login"
        @click="closeMenu"
        class="block text-gray-800 hover:text-blue-700 transition-colors font-semibold py-2 border-b border-gray-300"
      >
        Login
      </router-link>
      <router-link
        v-if="!authStore.isLoggedIn"
        to="/register"
        @click="closeMenu"
        class="block text-gray-800 hover:text-blue-700 transition-colors font-semibold py-2 border-b border-gray-300"
      >
        Register
      </router-link>
      <router-link 
        v-if="authStore.isLoggedIn && !authStore.isAdmin" 
        to="/my-bookings" 
        @click="closeMenu"
        class="block text-gray-800 hover:text-blue-700 transition-colors font-semibold py-2 border-b border-gray-300"
      >
        My Bookings
      </router-link>
      <router-link
        v-if="authStore.isLoggedIn && authStore.isAdmin"
        to="/manage-users"
        @click="closeMenu"
        class="block text-gray-800 hover:text-blue-700 transition-colors font-semibold py-2 border-b border-gray-300"
      >
        Manage Users
      </router-link>
      <button
        v-if="authStore.isLoggedIn"
        @click="handleLogout"
        class="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all mt-2"
      >
        Logout
      </button>
    </div>
  </nav>

  <main class="w-full">
    <router-view />
  </main>

  <div
    v-if="authStore.loading"
    class="fixed inset-0 bg-gray-100 flex items-center justify-center z-50"
  >
    <div class="text-blue-600 animate-pulse uppercase tracking-widest text-xs">
      Loading Application...
    </div>
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: #f8f9fa;
}
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #f8f9fa;
}
::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
