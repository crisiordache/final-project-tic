<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth";

const authStore = useAuthStore();

onMounted(() => {
  authStore.init();
});
</script>

<template>
  <nav v-if="!authStore.loading">
    <router-link to="/">Acasă</router-link> |
    <router-link v-if="!authStore.user" to="/login">Login</router-link>
    <span v-else>
      Salut, {{ authStore.profile?.name || "Utilizator" }} |
      <button @click="authStore.logout">Logout</button>
    </span>
  </nav>

  <main v-if="!authStore.loading">
    <router-view />
  </main>

  <div v-else>Se încarcă...</div>
</template>

<style>
nav {
  padding: 20px;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}
main {
  padding: 0 20px;
}
button {
  cursor: pointer;
  margin-left: 10px;
}
</style>
