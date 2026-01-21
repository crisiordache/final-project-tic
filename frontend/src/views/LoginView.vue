<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div
      class="w-full max-w-[440px] bg-[#1c1f26] rounded-2xl shadow-2xl p-10 border border-gray-800 transition-all duration-300"
    >
      <div class="text-center mb-10">
        <h2 class="text-4xl font-semibold text-white tracking-tight">
          Autentificare
        </h2>
        <div class="h-px bg-gray-800 w-full mt-6"></div>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
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
            placeholder="Parolă"
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

          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="loading"
              class="bg-[#2196f3] hover:bg-[#1e88e5] text-white font-medium py-2.5 px-8 rounded-lg shadow-lg shadow-blue-500/20 transition-all duration-300 transform active:scale-95 disabled:opacity-50"
            >
              <span v-if="loading">...</span>
              <span v-else>Login</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
