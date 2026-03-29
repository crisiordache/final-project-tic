<template>
  <div class="min-h-screen bg-[#f8f9fa] text-gray-900 p-6 pt-10">
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>

    <div v-else-if="event" class="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white border border-gray-400 rounded-2xl overflow-hidden shadow-xl">
          <div v-if="event.posterUrl" class="w-full h-56 overflow-hidden">
            <img :src="event.posterUrl" :alt="event.title" class="w-full h-full object-cover" />
          </div>
          <div class="p-8">
          <div class="flex flex-col gap-3 mb-6">
            <div class="flex flex-wrap items-center gap-2">
              <span
                v-if="event.category"
                class="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold uppercase tracking-widest"
                >{{ event.category }}</span
              >
              <span
                class="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest"
                :class="
                  event.hasSeating
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-700'
                "
              >
                {{
                  event.hasSeating
                    ? "Assigned seating — pick seats at checkout when enabled"
                    : "General admission — no seat numbers"
                }}
              </span>
            </div>
            <div class="flex justify-between items-start gap-4">
              <h1 class="text-4xl font-extrabold tracking-tight text-gray-950">{{ event.title }}</h1>
              <span class="shrink-0 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                Upcoming
              </span>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700 text-sm mb-8">
            <div class="flex items-center gap-3">
              <span class="text-xl">📅</span>
              <div>
                <p class="text-gray-700 uppercase text-[10px] font-bold">Date & Time</p>
                <p class="text-gray-950">{{ formatDate(event.date) }} at {{ event.time }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xl">📍</span>
              <div>
                <p class="text-gray-700 uppercase text-[10px] font-bold">Location</p>
                <p class="text-gray-950">{{ event.location.venue }}, {{ event.location.city }}</p>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-400 pt-6">
            <h3 class="text-gray-700 uppercase text-[10px] font-bold mb-3 tracking-widest">About this event</h3>
            <p class="text-gray-800 leading-relaxed italic">{{ event.description }}</p>
          </div>
          </div>
        </div>

        <div class="bg-white border border-gray-400 rounded-2xl p-8 shadow-xl">
          <h2 class="text-xl font-bold mb-6 text-gray-950">Select Your Tickets</h2>
          <div class="space-y-4">
            <div v-for="ticket in bookingForm.tickets" :key="ticket.type" 
                 class="flex items-center justify-between bg-gray-200 p-5 rounded-2xl border border-gray-400 transition-all hover:border-blue-600">
              <div>
                <p class="font-bold text-blue-700">{{ ticket.type }}</p>
                <p class="text-2xl font-black text-gray-950">${{ ticket.price }}</p>
                <p class="text-[10px] text-gray-700 uppercase font-semibold">{{ ticket.available }} remaining</p>
              </div>
              <div class="flex items-center gap-4 bg-white p-2 rounded-xl border border-gray-400">
                <button @click="ticket.quantity > 0 && ticket.quantity--" class="w-10 h-10 rounded-lg bg-gray-400 flex items-center justify-center hover:bg-gray-500 text-gray-900 font-bold">-</button>
                <span class="text-xl font-bold w-6 text-center text-gray-950">{{ ticket.quantity }}</span>
                <button @click="ticket.quantity < ticket.available && ticket.quantity++" class="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center hover:bg-blue-900 text-white font-bold">+</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="bg-white border border-gray-400 rounded-2xl p-6 shadow-xl sticky top-24">
          <h2 class="text-lg font-bold mb-6 pb-4 border-b border-gray-400 text-gray-950">Order Summary</h2>
          
          <div class="space-y-3 mb-6">
            <div v-for="t in selectedTickets" :key="t.type" class="flex justify-between text-sm">
              <span class="text-gray-800">{{ t.quantity }}x {{ t.type }}</span>
              <span class="font-bold text-gray-950">${{ t.quantity * t.price }}</span>
            </div>
            <div v-if="selectedTickets.length === 0" class="text-gray-700 text-xs italic text-center py-4 font-medium">
              No tickets selected yet
            </div>
          </div>

          <div class="flex justify-between items-center mb-8 pt-4 border-t border-gray-400">
            <span class="text-gray-800 font-bold uppercase text-xs">Total</span>
            <span class="text-3xl font-black text-blue-700">${{ totalPrice }}</span>
          </div>

          <!-- Seated event, seats NOT yet selected → only "Select Seats" -->
          <button @click="goToSeatSelection" 
                  v-if="event.hasSeating && !bookingForm.hasSeats && totalTicketsSelected > 0"
                  :disabled="submitting"
                  class="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all text-sm">
            Select {{ totalTicketsSelected }} {{ totalTicketsSelected === 1 ? 'Seat' : 'Seats' }}
          </button>

          <!-- GA event OR seated event with seats already selected → "Complete Purchase" -->
          <button @click="handleBooking" 
                  v-if="!event.hasSeating || bookingForm.hasSeats"
                  :disabled="submitting || selectedTickets.length === 0"
                  class="w-full bg-blue-700 hover:bg-blue-900 disabled:bg-gray-500 disabled:text-gray-200 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all">
            {{ submitting ? 'Processing...' : 'Complete Purchase' }}
          </button>

          <!-- Seated event with seats selected → option to re-select -->
          <button @click="goToSeatSelection" 
                  v-if="event.hasSeating && bookingForm.hasSeats"
                  class="w-full mt-2 bg-transparent border border-gray-400 text-gray-700 hover:text-gray-950 py-3 rounded-2xl font-bold uppercase tracking-widest transition-all text-xs">
            Change Seats
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
import { API_URL } from '../config';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const event = ref(null);
const loading = ref(true);
const submitting = ref(false);

const bookingForm = reactive({
  tickets: [],
  paymentMethod: 'card',
  hasSeats: false,
  seatReservationId: null
});

const selectedTickets = computed(() => 
  bookingForm.tickets.filter(t => t.quantity > 0)
);

const totalPrice = computed(() => 
  selectedTickets.value.reduce((sum, t) => sum + (t.price * t.quantity), 0)
);

const fetchEvent = async () => {
  try {
    const res = await fetch(`${API_URL}/events/${route.params.id}`);
    const data = await res.json();
    event.value = data;
    bookingForm.tickets = data.ticketTypes.map(t => ({ ...t, quantity: 0 }));
    
    // Restore state when returning from seat selection
    if (route.query.hasSeats) {
      const selectedSeats = JSON.parse(sessionStorage.getItem('selectedSeats') || '[]');
      const ticketsByType = JSON.parse(sessionStorage.getItem('ticketsByType') || '{}');
      if (selectedSeats.length > 0) {
        bookingForm.hasSeats = true;
        bookingForm.seatReservationId = sessionStorage.getItem('seatReservationId');
        // Restore ticket quantities from what was selected before seat map
        for (const t of bookingForm.tickets) {
          if (ticketsByType[t.type]) t.quantity = ticketsByType[t.type];
        }
      }
    }
  } catch (err) {
    console.error(err);
    router.push('/');
  } finally {
    loading.value = false;
  }
};

const totalTicketsSelected = computed(() => 
  bookingForm.tickets.reduce((sum, t) => sum + t.quantity, 0)
);

const goToSeatSelection = () => {
  if (totalTicketsSelected.value === 0) {
    alert('Please select at least one ticket');
    return;
  }
  
  // Store ticket count and per-type breakdown for seat selection
  sessionStorage.setItem('ticketCount', totalTicketsSelected.value);
  const ticketsByType = {};
  bookingForm.tickets.forEach(t => { if (t.quantity > 0) ticketsByType[t.type] = t.quantity; });
  sessionStorage.setItem('ticketsByType', JSON.stringify(ticketsByType));
  sessionStorage.setItem('selectedSeats', JSON.stringify([]));
  sessionStorage.setItem('seatReservationId', '');
  
  router.push(`/seats/${route.params.id}`);
};

const handleBooking = async () => {
  if (!authStore.token) {
    alert("Please sign in to book.");
    router.push("/login");
    return;
  }

  submitting.value = true;
  try {
    if (bookingForm.paymentMethod === "card") {
      // Step 1: Create pending booking first
      const pendingResponse = await fetch(`${API_URL}/bookings/pending`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authStore.token}`
        },
        body: JSON.stringify({
          eventId: route.params.id,
          tickets: selectedTickets.value.map((t) => ({ type: t.type, quantity: t.quantity })),
          seatReservationId: bookingForm.seatReservationId || null
        })
      });

      if (!pendingResponse.ok) {
        const err = await pendingResponse.json();
        alert(err.error || "Failed to create booking");
        return;
      }

      const pendingData = await pendingResponse.json();
      const bookingId = pendingData.bookingId;

      // Step 2: Create Stripe checkout session with bookingId
      const checkoutResponse = await fetch(`${API_URL}/payments/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authStore.token}`
        },
        body: JSON.stringify({
          eventId: route.params.id,
          bookingId,
          tickets: selectedTickets.value.map((t) => ({ type: t.type, quantity: t.quantity }))
        })
      });
      const checkoutData = await checkoutResponse.json().catch(() => ({}));
      if (!checkoutResponse.ok || !checkoutData.url) {
        alert(checkoutData.error || "Could not start payment. Check STRIPE_SECRET_KEY and try again.");
        return;
      }
      window.location.href = checkoutData.url;
      return;
    }

    const response = await fetch(`${API_URL}/bookings`, {
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