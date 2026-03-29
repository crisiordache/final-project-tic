<template>
  <div class="min-h-screen bg-[#f8f9fa] text-gray-900 p-6 pt-10">
    <div class="max-w-5xl mx-auto">
      <div class="flex justify-between items-center mb-10 border-b border-gray-400 pb-6">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-gray-950">My Bookings</h1>
          <p class="text-gray-700 text-sm mt-1 font-medium">Manage your reservations and digital tickets</p>
        </div>
        <router-link to="/" class="text-blue-700 hover:text-blue-900 text-xs font-bold uppercase tracking-widest">
          Browse More Events →
        </router-link>
      </div>

      <div
        v-if="checkoutNotice"
        class="mb-6 p-6 rounded-xl bg-emerald-50 border border-emerald-400 text-emerald-900"
      >
        <p class="text-sm font-bold mb-3">✓ Payment Completed</p>
        <p class="text-xs mb-4 font-medium">Your tickets should appear below shortly. If not, the webhook may still be processing. You can verify your payment status:</p>
        <button 
          @click="verifyAndRefresh"
          :disabled="verifying"
          class="bg-emerald-700 hover:bg-emerald-900 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all"
        >
          {{ verifying ? 'Checking...' : 'Verify Payment & Refresh' }}
        </button>
        <p v-if="verificationStatus" :class="['text-xs mt-3 font-semibold', verificationStatus.includes('✓') ? 'text-emerald-800' : 'text-blue-800']">
          {{ verificationStatus }}
        </p>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>

      <div v-else-if="fetchError" class="text-center py-20 bg-red-50 rounded-3xl border border-red-400">
        <p class="text-red-800 text-sm font-bold">{{ fetchError }}</p>
        <p class="text-gray-700 text-xs mt-2 font-medium">Try signing out and back in, then refresh.</p>
      </div>

      <div v-else-if="bookings.length === 0" class="text-center py-20 bg-gray-200 rounded-3xl border border-dashed border-gray-400">
        <span class="text-5xl block mb-4">🎫</span>
        <h3 class="text-xl font-bold text-gray-950">No tickets found</h3>
        <p class="text-gray-700 mt-2 font-medium">You haven't booked any events yet.</p>
      </div>

      <div v-else class="space-y-6">
        <div v-for="booking in bookings" :key="booking.bookingId" 
             class="bg-white border border-gray-400 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-xl hover:border-gray-500 transition-all">
          
          <div class="p-8 flex-grow">
            <div class="flex items-center gap-3 mb-4">
              <span :class="[
                'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest',
                booking.payment?.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
              ]">
                {{ booking.payment?.status === 'confirmed' ? 'Confirmed' : 'Pending Payment' }}
              </span>
              <span class="text-gray-700 text-xs font-mono font-semibold">
                #{{ booking.bookingId ? booking.bookingId.slice(-6).toUpperCase() : '------' }}
              </span>
            </div>

            <h2 class="text-2xl font-bold mb-2 text-gray-950">{{ booking.eventSnapshot?.title }}</h2>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div class="text-sm">
                <p class="text-gray-700 uppercase text-[9px] font-bold tracking-widest mb-1">Date & Time</p>
                <p class="text-gray-950">{{ formatDate(booking.eventSnapshot?.date) }} at {{ booking.eventSnapshot?.time }}</p>
              </div>
              <div class="text-sm">
                <p class="text-gray-700 uppercase text-[9px] font-bold tracking-widest mb-1">Location</p>
                <p class="text-gray-950">{{ booking.eventSnapshot?.location?.venue }}, {{ booking.eventSnapshot?.location?.city }}</p>
              </div>
            </div>

            <div class="mt-6 pt-6 border-t border-gray-400">
              <p class="text-gray-700 uppercase text-[9px] font-bold tracking-widest mb-3">Order Details</p>
              <div class="flex flex-wrap gap-4">
                <div v-for="ticket in booking.tickets" :key="ticket.type" class="bg-gray-200 px-3 py-2 rounded-lg border border-gray-400">
                  <span class="text-blue-700 font-bold">{{ ticket.quantity }}x</span> 
                  <span class="text-gray-800 text-sm ml-2 font-medium">{{ ticket.type }}</span>
                </div>
              </div>
              <p class="mt-4 text-xl font-bold text-gray-950">Total Paid: <span class="text-blue-700">${{ booking.totalPrice }}</span></p>
            </div>
          </div>

          <div class="bg-gray-200 p-8 flex flex-col items-center justify-center border-l border-gray-400 min-w-[240px]">
            <div class="relative flex items-center justify-center">
              <!-- Loading ring -->
              <div 
                v-if="qrRefreshing[booking.bookingId]"
                class="absolute inset-0 flex items-center justify-center"
              >
                <div class="w-56 h-56 rounded-full border-4 border-transparent border-t-blue-700 border-r-blue-700 animate-spin"></div>
              </div>
              
              <!-- QR Code -->
              <div class="bg-white p-3 rounded-xl shadow-inner" :class="{ 'opacity-60': qrRefreshing[booking.bookingId] }">
                <qrcode-vue 
                  :value="booking.qrCode" 
                  :size="140" 
                  level="H" 
                  render-as="svg"
                />
              </div>
            </div>
            
            <!-- Timer -->
            <p class="text-[10px] text-gray-700 mt-6 uppercase font-bold tracking-widest flex items-center gap-2">
              <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">{{ timerSeconds[booking.bookingId] || 60 }}s</span>
              Next refresh in
            </p>
            <p class="text-[10px] text-gray-700 mt-4 uppercase font-bold tracking-widest">Scan at Entrance</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import QrcodeVue from 'qrcode.vue';
import { API_URL } from '../config';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const bookings = ref([]);
const loading = ref(true);
const fetchError = ref(null);
const checkoutNotice = ref(false);
const verifying = ref(false);
const verificationStatus = ref(null);
const currentSessionId = ref(null);
const qrRefreshing = reactive({});
const timerSeconds = reactive({});
let refreshInterval = null;
let timerInterval = null;

const fetchBookings = async (showLoading = false) => {
  if (showLoading) {
    bookings.value.forEach(booking => {
      qrRefreshing[booking.bookingId] = true;
    });
  }
  
  fetchError.value = null;
  try {
    const response = await fetch(`${API_URL}/bookings/my`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      fetchError.value = data.message || data.error || `Could not load bookings (${response.status})`;
      bookings.value = [];
      return;
    }
    bookings.value = Array.isArray(data) ? data : [];
    // Initialize timer for each booking
    bookings.value.forEach(booking => {
      if (!timerSeconds[booking.bookingId]) {
        timerSeconds[booking.bookingId] = 60;
      }
      qrRefreshing[booking.bookingId] = false;
    });
  } catch (error) {
    console.error(error);
    fetchError.value = "Network error while loading bookings.";
    bookings.value = [];
  } finally {
    loading.value = false;
  }
};

const startTimers = () => {
  timerInterval = setInterval(() => {
    bookings.value.forEach(booking => {
      if (timerSeconds[booking.bookingId] > 0) {
        timerSeconds[booking.bookingId]--;
      } else {
        timerSeconds[booking.bookingId] = 60;
      }
    });
  }, 1000);
};

const startAutoRefresh = () => {
  refreshInterval = setInterval(() => {
    fetchBookings(true);
  }, 60000); // 60 seconds
};

const formatDate = (rawDate) => {
  if (!rawDate) return "N/A";
  const dateObj = rawDate._seconds ? new Date(rawDate._seconds * 1000) : new Date(rawDate);
  return dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

const verifyAndRefresh = async () => {
  if (!currentSessionId.value) return;
  verifying.value = true;
  verificationStatus.value = null;
  
  try {
    const response = await fetch(`${API_URL}/payments/verify-session/${currentSessionId.value}`);
    const data = await response.json();
    
    if (response.ok) {
      verificationStatus.value = data.message;
      // Refresh bookings after verification
      setTimeout(() => {
        fetchBookings();
      }, 1000);
    } else {
      verificationStatus.value = `❌ Verification failed: ${data.error}`;
    }
  } catch (error) {
    verificationStatus.value = `❌ Error checking payment: ${error.message}`;
  } finally {
    verifying.value = false;
  }
};

onMounted(async () => {
  if (route.query.session_id) {
    currentSessionId.value = route.query.session_id;
    checkoutNotice.value = true;
    router.replace({ path: route.path, query: {} });
  }
  await fetchBookings();
  if (checkoutNotice.value && currentSessionId.value) {
    // Auto-verify the Stripe session — this finalizes the booking if the webhook hasn't yet
    await verifyAndRefresh();
  }
  
  // Start auto-refresh and timers
  startAutoRefresh();
  startTimers();
});

onUnmounted(() => {
  // Clean up intervals when leaving the page
  if (refreshInterval) clearInterval(refreshInterval);
  if (timerInterval) clearInterval(timerInterval);
});
</script>