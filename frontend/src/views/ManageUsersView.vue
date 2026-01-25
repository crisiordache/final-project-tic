<template>
  <div class="min-h-screen bg-[#0b0f1a] text-white p-6 pt-10">
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-10 border-b border-gray-800 pb-6">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Manage Users</h1>
          <p class="text-gray-400 text-sm mt-1">View all registered members and manage permissions</p>
        </div>
        <div class="bg-[#161b26] px-4 py-2 rounded-lg border border-gray-800 text-[10px] font-bold uppercase text-blue-500">
          {{ users?.length || 0 }} Total Users
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>

      <div v-else class="bg-[#161b26] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-[#1f2533] text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              <th class="px-6 py-4">User Info</th>
              <th class="px-6 py-4">Role</th>
              <th class="px-6 py-4">User ID</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800">
            <tr v-for="user in users" :key="user.uid" class="hover:bg-white/5 transition-colors">
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="font-bold text-white">{{ user.name }}</span>
                  <span class="text-xs text-gray-500">{{ user.email }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span :class="[
                  'px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter border',
                  user.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                ]">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="font-mono text-[10px] text-gray-600">{{ user.uid }}</span>
              </td>
              <td class="px-6 py-4 text-right">
                <button 
                  v-if="user.role !== 'admin'"
                  @click="promoteToAdmin(user)"
                  class="bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold py-1.5 px-4 rounded uppercase tracking-widest transition-all active:scale-95"
                >
                  Grant Admin
                </button>

                <button
                  v-else-if="user.role === 'admin'"
                  @click="revokeAdmin(user)"
                  class="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-[9px] px-4 py-1.5 rounded uppercase font-bold border border-red-500/30 transition-all"
                >
                  Revoke Admin
                </button>
                <span v-else class="text-[9px] text-gray-600 font-bold uppercase italic mr-4">Master Access</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const users = ref([]);
const loading = ref(true);

const fetchUsers = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/users", {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch users");
    users.value = await response.json();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const promoteToAdmin = async (user) => {
  if (!confirm(`Are you sure you want to grant Admin access to ${user.name}?`)) return;

  try {
    const response = await fetch(`http://localhost:3000/api/users/${user.uid}/grant-admin`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });

    if (response.ok) {
      user.role = 'admin';
      alert(`${user.name} is now an administrator.`);
    } else {
      const err = await response.json();
      alert(err.error || "Operation failed");
    }
  } catch (error) {
    alert("Network error occurred.");
  }
};

const revokeAdmin = async (user) => {
  if (!confirm(`Are you sure you want to revoke Admin access from ${user.name}?`)) return;

  try {
    const response = await fetch(`http://localhost:3000/api/users/${user.uid}/revoke-admin`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });

    if (response.ok) {
      user.role = 'user';
      alert(`Admin access revoked from ${user.name}.`);
    } else {
      const err = await response.json();
      alert(err.error || "Operation failed");
    }
  } catch (error) {
    alert("Network error occurred.");
  }
};

onMounted(fetchUsers);
</script>