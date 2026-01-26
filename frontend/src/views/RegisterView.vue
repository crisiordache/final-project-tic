<template>
  <div class="fixed inset-0 flex items-center justify-center bg-[#0b0f1a] px-4">
    <div
      class="w-full max-w-[380px] bg-[#161b26] rounded-xl shadow-2xl p-6 md:p-8 border border-gray-800"
    >
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-white tracking-tight">
          Create Account
        </h2>
        <p class="text-gray-400 mt-1 text-xs italic font-light">
          Join us to manage your events
        </p>
        <div
          class="h-[1px] bg-gradient-to-r from-transparent via-gray-700 to-transparent w-full mt-4"
        ></div>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div class="group">
          <label
            class="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-blue-500 transition-colors"
          >
            Full Name
          </label>
          <input
            v-model="name"
            type="text"
            placeholder="John Doe"
            class="w-full px-4 py-2.5 bg-[#1f2533] border border-gray-800 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-600"
            required
          />
        </div>

        <div class="group">
          <label
            class="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-blue-500 transition-colors"
          >
            Email Address
          </label>
          <input
            v-model="email"
            placeholder="name@example.com"
            class="w-full px-4 py-2.5 bg-[#1f2533] border border-gray-800 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-600"
            required
          />
        </div>

        <div class="group">
          <label
            class="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1 group-focus-within:text-blue-500 transition-colors"
          >
            Password
          </label>
          <input
            v-model="password"
            type="password"
            placeholder="Min. 6 characters"
            class="w-full px-4 py-2.5 bg-[#1f2533] border border-gray-800 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-600"
            required
          />
        </div>

        <div
          v-if="error && !serverErrors.length"
          class="text-red-500 text-[10px] text-center py-1 animate-pulse italic"
        >
          {{ error }}
        </div>
        <div
          v-if="serverErrors.length"
          class="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <p class="text-red-500 text-[9px] font-black uppercase tracking-widest mb-1">
            Fix the following:
          </p>
            <ul class="list-disc list-inside text-red-400 text-[10px] space-y-0.5">
              <li v-for="(err, index) in serverErrors" :key="index">
                {{ err }}
              </li>
            </ul>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all duration-300 transform active:scale-95 disabled:opacity-50 mt-2 uppercase text-[10px] tracking-widest"
        >
          {{ loading ? "Creating..." : "Register" }}
        </button>
      </form>

      <div class="text-center mt-6 pt-4 border-t border-gray-800/50">
        <p class="text-gray-500 text-[10px] tracking-wide">
          Already have an account?
          <router-link
            to="/login"
            class="text-blue-500 hover:text-blue-400 font-bold ml-1 transition-colors"
            >SIGN IN</router-link
          >
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

const name = ref("");
const email = ref("");
const password = ref("");
const error = ref(null);
const loading = ref(false);
const serverErrors = ref([]);

const router = useRouter();

const handleRegister = async () => {
  loading.value = true;
  error.value = null;
  serverErrors.value = [];

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
    const user = userCredential.user;
    const token = await user.getIdToken();
    const response = await fetch("http://localhost:3000/api/users/register", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
       },
      body: JSON.stringify({
        name: name.value,
        email: email.value,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      if(data.errors) {
        serverErrors.value = data.errors;
        throw new Error("Validation failed");
      }
      throw new Error(data.error);
    }
    router.push("/login");
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>
