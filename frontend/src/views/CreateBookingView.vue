<template>
  <div class="min-h-screen bg-[#0b0f1a] text-white p-6 pt-10">
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>

    <div v-else-if="event" class="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-[#161b26] border border-gray-800 rounded-2xl p-8 shadow-xl">
          <div class="flex justify-between items-start mb-6">
            <h1 class="text-4xl font-extrabold tracking-tight">{{ event.title }}</h1>
            <span class="bg-blue-600/10 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              Upcoming
            </span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-400 text-sm mb-8">
            <div class="flex items-center gap-3">
              <span class="text-xl">📅</span>
              <div>
                <p class="text-gray-500 uppercase text-[10px] font-bold">Date & Time</p>
                <p class="text-white">{{ formatDate(event.date) }} at {{ event.time }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xl">📍</span>
              <div>
                <p class="text-gray-500 uppercase text-[10px] font-bold">Location</p>
                <p class="text-white">{{ event.location.venue }}, {{ event.location.city }}</p>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-800 pt-6">
            <h3 class="text-gray-500 uppercase text-[10px] font-bold mb-3 tracking-widest">About this event</h3>
            <p class="text-gray-300 leading-relaxed italic">{{ event.description }}</p>
          </div>
        </div>

        <div class="bg-[#161b26] border border-gray-800 rounded-2xl p-8 shadow-xl">
          <h2 class="text-xl font-bold mb-6">Select Your Tickets</h2>
          <div class="space-y-4">
            <div v-for="ticket in bookingForm.tickets" :key="ticket.type" 
                 class="flex items-center justify-between bg-[#1f2533] p-5 rounded-2xl border border-gray-800 transition-all hover:border-blue-500/30">
              <div>
                <p class="font-bold text-blue-400">{{ ticket.type }}</p>
                <p class="text-2xl font-black">${{ ticket.price }}</p>
                <p class="text-[10px] text-gray-500 uppercase">{{ ticket.available }} remaining</p>
              </div>
              <div class="flex items-center gap-4 bg-[#0b0f1a] p-2 rounded-xl">
                <button @click="ticket.quantity > 0 && ticket.quantity--" class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-gray-700">-</button>
                <span class="text-xl font-bold w-6 text-center">{{ ticket.quantity }}</span>
                <button @click="ticket.quantity < ticket.available && ticket.quantity++" class="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center hover:bg-blue-500">+</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="bg-[#161b26] border border-gray-800 rounded-2xl p-6 shadow-xl sticky top-24">
          <h2 class="text-lg font-bold mb-6 pb-4 border-b border-gray-800">Order Summary</h2>
          
          <div class="space-y-3 mb-6">
            <div v-for="t in selectedTickets" :key="t.type" class="flex justify-between text-sm">
              <span class="text-gray-400">{{ t.quantity }}x {{ t.type }}</span>
              <span class="font-bold">${{ t.quantity * t.price }}</span>
            </div>
            <div v-if="selectedTickets.length === 0" class="text-gray-500 text-xs italic text-center py-4">
              No tickets selected yet
            </div>
          </div>

          <div class="flex justify-between items-center mb-8 pt-4 border-t border-gray-800">
            <span class="text-gray-400 font-bold uppercase text-xs">Total</span>
            <span class="text-3xl font-black text-blue-400">${{ totalPrice }}</span>
          </div>

          <div class="mb-6">
            <p class="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-3">Payment Method</p>
            <div class="flex flex-col gap-2">
              <button @click="bookingForm.paymentMethod = 'card'" 
                :class="['w-full py-3 px-4 rounded-xl border text-xs font-bold transition-all flex justify-between items-center', 
                bookingForm.paymentMethod === 'card' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-800 text-gray-500']">
                <span>Credit Card</span>
                <span>💳</span>
              </button>
              <button @click="bookingForm.paymentMethod = 'cash'" 
                :class="['w-full py-3 px-4 rounded-xl border text-xs font-bold transition-all flex justify-between items-center', 
                bookingForm.paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-gray-800 text-gray-500']">
                <span>Cash at Counter</span>
                <span>💵</span>
              </button>
            </div>
          </div>

          <button @click="handleBooking" :disabled="submitting || selectedTickets.length === 0"
                  class="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 py-4 rounded-2xl font-black uppercase tracking-widest transition-all">
            {{ submitting ? 'Processing...' : 'Complete Purchase' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const event = ref(null);
const loading = ref(true);
const submitting = ref(false);

const bookingForm = reactive({
  tickets: [],
  paymentMethod: 'card'
});

const selectedTickets = computed(() => 
  bookingForm.tickets.filter(t => t.quantity > 0)
);

const totalPrice = computed(() => 
  selectedTickets.value.reduce((sum, t) => sum + (t.price * t.quantity), 0)
);

const fetchEvent = async () => {
  try {
    const res = await fetch(`http://localhost:3000/api/events/${route.params.id}`);
    const data = await res.json();
    event.value = data;
    bookingForm.tickets = data.ticketTypes.map(t => ({ ...t, quantity: 0 }));
  } catch (err) {
    console.error(err);
    router.push('/');
  } finally {
    loading.value = false;
  }
};

const handleBooking = async () => {
  submitting.value = true;
  try {
    const response = await fetch("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({
        eventId: route.params.id,
        tickets: selectedTickets.value.map(t => ({ type: t.type, quantity: t.quantity })),
        paymentMethod: bookingForm.paymentMethod
      }),
    });

    if (response.ok) {
      alert("Reservation confirmed!");
      router.push('/my-bookings');
    } else {
      const err = await response.json();
      alert(err.error || "Failed to book");
    }
  } catch (error) {
    alert("Network error");
  } finally {
    submitting.value = false;
  }
};

const formatDate = (d) => {
  if (!d) return "";
  const dateObj = d._seconds ? new Date(d._seconds * 1000) : new Date(d);
  return dateObj.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
};

onMounted(fetchEvent);
</script>