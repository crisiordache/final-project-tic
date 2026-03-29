<template>
  <div class="fixed inset-0 flex items-center justify-center bg-[#f8f9fa] px-4">
    <div
      class="w-full max-w-[380px] bg-white rounded-xl shadow-2xl p-6 md:p-8 border border-gray-400"
    >
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-gray-950 tracking-tight">
          Welcome Back
        </h2>
        <p class="text-gray-700 mt-1 text-xs italic font-medium">
          Please enter your details
        </p>
        <div
          class="h-[1px] bg-gradient-to-r from-transparent via-gray-400 to-transparent w-full mt-4"
        ></div>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div class="group">
          <label
            class="block text-[9px] font-bold text-gray-700 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-blue-700 transition-colors"
          >
            Email Address
          </label>
          <input
            v-model="email"
            type="email"
            placeholder="name@example.com"
            class="w-full px-4 py-2.5 bg-white border border-gray-400 rounded-lg text-gray-950 text-sm focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all placeholder-gray-500"
            required
          />
        </div>

        <div class="group">
          <label
            class="block text-[9px] font-bold text-gray-700 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-blue-700 transition-colors"
          >
            Password
          </label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full px-4 py-2.5 bg-white border border-gray-400 rounded-lg text-gray-950 text-sm focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all placeholder-gray-500"
            required
          />
        </div>

        <div
          v-if="error"
          class="text-red-700 text-[10px] text-center py-1 animate-pulse italic font-semibold"
        >
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-700 hover:bg-blue-900 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all duration-300 transform active:scale-95 disabled:opacity-50 mt-2 uppercase text-[10px] tracking-widest"
        >
          {{ loading ? "Signing in..." : "Sign In" }}
        </button>
      </form>

      <div class="text-center mt-6 pt-4 border-t border-gray-400/50">
        <p class="text-gray-700 text-[10px] tracking-wide font-medium">
          Don't have an account?
          <router-link
            to="/register"
            class="text-blue-700 hover:text-blue-900 font-bold ml-1 transition-colors"
            >REGISTER</router-link
          >
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const error = ref(null);
const loading = ref(false);

const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
  loading.value = true;
  error.value = null;
  try {
    await authStore.login(email.value, password.value);
    router.push("/");
  } catch (err) {
    error.value = "Invalid email or password";
    console.error(err);
  } finally {
    loading.value = false;
  }
};
</script>
