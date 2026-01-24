<template>
  <div class="min-h-screen bg-[#0b0f1a] text-white p-6 pt-10">
    <div class="max-w-5xl mx-auto">
      <div class="flex justify-between items-center mb-10 border-b border-gray-800 pb-6">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p class="text-gray-500 text-sm mt-1">Manage your reservations and digital tickets</p>
        </div>
        <router-link to="/" class="text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-widest">
          Browse More Events →
        </router-link>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>

      <div v-else-if="bookings.length === 0" class="text-center py-20 bg-[#161b26] rounded-3xl border border-dashed border-gray-800">
        <span class="text-5xl block mb-4">🎫</span>
        <h3 class="text-xl font-bold">No tickets found</h3>
        <p class="text-gray-500 mt-2">You haven't booked any events yet.</p>
      </div>

      <div v-else class="space-y-6">
        <div v-for="booking in bookings" :key="booking.bookingId" 
             class="bg-[#161b26] border border-gray-800 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-xl hover:border-gray-700 transition-all">
          
          <div class="p-8 flex-grow">
            <div class="flex items-center gap-3 mb-4">
              <span :class="[
                'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest',
                booking.payment?.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
              ]">
                {{ booking.payment?.status === 'confirmed' ? 'Confirmed' : 'Pending Payment' }}
              </span>
              <span class="text-gray-600 text-xs font-mono">
                #{{ booking.bookingId ? booking.bookingId.slice(-6).toUpperCase() : '------' }}
              </span>
            </div>

            <h2 class="text-2xl font-bold mb-2">{{ booking.eventSnapshot?.title }}</h2>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div class="text-sm">
                <p class="text-gray-500 uppercase text-[9px] font-bold tracking-widest mb-1">Date & Time</p>
                <p>{{ formatDate(booking.eventSnapshot?.date) }} at {{ booking.eventSnapshot?.time }}</p>
              </div>
              <div class="text-sm">
                <p class="text-gray-500 uppercase text-[9px] font-bold tracking-widest mb-1">Location</p>
                <p>{{ booking.eventSnapshot?.location?.venue }}, {{ booking.eventSnapshot?.location?.city }}</p>
              </div>
            </div>

            <div class="mt-6 pt-6 border-t border-gray-800">
              <p class="text-gray-500 uppercase text-[9px] font-bold tracking-widest mb-3">Order Details</p>
              <div class="flex flex-wrap gap-4">
                <div v-for="ticket in booking.tickets" :key="ticket.type" class="bg-[#0b0f1a] px-3 py-2 rounded-lg border border-gray-800">
                  <span class="text-blue-400 font-bold">{{ ticket.quantity }}x</span> 
                  <span class="text-gray-300 text-sm ml-2">{{ ticket.type }}</span>
                </div>
              </div>
              <p class="mt-4 text-xl font-bold text-white">Total Paid: <span class="text-blue-400">${{ booking.totalPrice }}</span></p>
            </div>
          </div>

          <div class="bg-[#1f2533] p-8 flex flex-col items-center justify-center border-l border-gray-800 min-w-[240px]">
            <div class="bg-white p-3 rounded-xl shadow-inner">
              <qrcode-vue 
                :value="booking.qrCode" 
                :size="140" 
                level="H" 
                render-as="svg"
              />
            </div>
            <p class="text-[10px] text-gray-500 mt-4 uppercase font-bold tracking-widest">Scan at Entrance</p>
            
            <div v-if="booking.payment?.method === 'cash' && booking.payment?.status !== 'confirmed'" 
                 class="mt-4 p-2 bg-orange-500/10 border border-orange-500/20 rounded text-[9px] text-orange-400 text-center leading-tight">
              Pay at counter to activate this ticket
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import QrcodeVue from 'qrcode.vue';

const authStore = useAuthStore();
const bookings = ref([]);
const loading = ref(true);

const fetchBookings = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/bookings/my", {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch bookings");
    bookings.value = await response.json();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (rawDate) => {
  if (!rawDate) return "N/A";
  const dateObj = rawDate._seconds ? new Date(rawDate._seconds * 1000) : new Date(rawDate);
  return dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

onMounted(fetchBookings);
</script>