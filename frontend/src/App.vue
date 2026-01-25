<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/');
}

onMounted(() => {
  authStore.init();
});
</script>

<template>
  <nav
    class="flex items-center justify-between p-4 bg-[#161b26] border-b border-gray-800 text-white"
  >
    <div class="flex gap-4">
      <router-link to="/" class="hover:text-blue-400 transition-colors"
        >Home</router-link
      >
      <router-link
        v-if="!authStore.isLoggedIn"
        to="/login"
        class="hover:text-blue-400 transition-colors"
        >Login</router-link
      >
      <router-link
        v-if="!authStore.isLoggedIn"
        to="/register"
        class="hover:text-blue-400 transition-colors"
        >Register</router-link
      >
      <router-link 
        v-if="authStore.isLoggedIn && !authStore.isAdmin" 
        to="/my-bookings" 
        class="hover:text-blue-400 transition-colors"
        >My Bookings</router-link>
      <router-link
        v-if="authStore.isLoggedIn && authStore.isAdmin"
        to="/manage-users"
        class="hove:text-blue-400 transition-colors"
        >Manage users</router-link>
    </div>

    <div v-if="authStore.isLoggedIn" class="text-sm">
      <button
        @click="handleLogout"
        class="ml-4 bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1 rounded-lg text-xs transition-all"
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
    class="fixed inset-0 bg-[#0b0f1a] flex items-center justify-center z-50"
  >
    <div class="text-blue-500 animate-pulse uppercase tracking-widest text-xs">
      Loading Application...
    </div>
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: #0b0f1a;
}
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #0b0f1a;
}
::-webkit-scrollbar-thumb {
  background: #1f2533;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #2d364a;
}
</style>
