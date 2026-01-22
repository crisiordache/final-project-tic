<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth";

const authStore = useAuthStore();

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
        v-if="!authStore.user"
        to="/login"
        class="hover:text-blue-400 transition-colors"
        >Login</router-link
      >
      <router-link
        v-if="!authStore.user"
        to="/register"
        class="hover:text-blue-400 transition-colors"
        >Register</router-link
      >
    </div>

    <div v-if="authStore.user" class="text-sm">
      <span class="text-gray-400 italic"
        >Welcome, {{ authStore.profile?.name || "User" }}</span
      >
      <button
        @click="authStore.logout"
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
/* Ștergem padding-ul care ar putea împinge conținutul în afara ecranului */
body {
  margin: 0;
  padding: 0;
  background-color: #0b0f1a;
}
</style>
