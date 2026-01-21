<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4 bg-gray-900">
    <div
      class="w-full max-w-[440px] bg-[#1c1f26] rounded-2xl shadow-2xl p-10 border border-gray-800 transition-all duration-300"
    >
      <div class="text-center mb-10">
        <h2 class="text-4xl font-semibold text-white tracking-tight">
          Cont Nou
        </h2>
        <div class="h-px bg-gray-800 w-full mt-6"></div>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-6">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-400 ml-1"
            >Nume Complet</label
          >
          <input
            v-model="name"
            type="text"
            placeholder="Numele tău"
            class="w-full px-4 py-3 bg-[#2a2e37] border border-transparent rounded-lg text-white focus:ring-1 focus:ring-blue-500 focus:bg-[#323742] outline-none transition-all placeholder-gray-500"
            required
          />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-400 ml-1"
            >Email</label
          >
          <input
            v-model="email"
            type="email"
            placeholder="Email"
            class="w-full px-4 py-3 bg-[#2a2e37] border border-transparent rounded-lg text-white focus:ring-1 focus:ring-blue-500 focus:bg-[#323742] outline-none transition-all placeholder-gray-500"
            required
          />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-400 ml-1"
            >Parolă</label
          >
          <input
            v-model="password"
            type="password"
            placeholder="Minim 6 caractere"
            class="w-full px-4 py-3 bg-[#2a2e37] border border-transparent rounded-lg text-white focus:ring-1 focus:ring-blue-500 focus:bg-[#323742] outline-none transition-all placeholder-gray-500"
            required
          />
        </div>

        <div class="flex flex-col space-y-4">
          <div
            v-if="error"
            class="text-red-500 text-sm italic ml-1 transition-all"
          >
            {{ error }}
          </div>

          <div class="flex justify-end pt-2">
            <button
              type="submit"
              :disabled="loading"
              class="bg-[#2196f3] hover:bg-[#1e88e5] text-white font-medium py-2.5 px-8 rounded-lg shadow-lg shadow-blue-500/20 transition-all duration-300 transform active:scale-95 disabled:opacity-50"
            >
              <span v-if="loading">Se creează...</span>
              <span v-else>Înregistrare</span>
            </button>
          </div>
        </div>
      </form>

      <p class="text-center text-gray-500 mt-8 text-sm">
        Ai deja cont?
        <router-link to="/login" class="text-blue-500 hover:underline"
          >Autentifică-te</router-link
        >
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

// State-ul formularului
const name = ref("");
const email = ref("");
const password = ref("");
const error = ref(null);
const loading = ref(false);

const router = useRouter();

const handleRegister = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Apelăm API-ul de Backend (Arhitectură Full-Stack obligatorie)
    const response = await fetch("http://localhost:3000/api/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Eroare la înregistrare.");
    }

    // Dacă înregistrarea a reușit, redirecționăm la Login
    router.push("/login");
  } catch (err) {
    error.value = err.message;
    console.error("Register error:", err);
  } finally {
    loading.value = false;
  }
};
</script>
