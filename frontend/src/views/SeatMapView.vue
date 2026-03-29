<template>
  <div class="min-h-screen bg-[#f8f9fa] text-gray-900 p-6 pt-10">
    <div class="max-w-5xl mx-auto">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-40">
        <div class="text-center">
          <div class="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-gray-600 font-semibold">Loading seat map...</p>
        </div>
      </div>

      <template v-else-if="event">
        <!-- Header -->
        <div class="mb-6">
          <router-link :to="{ name: 'CreateBooking', params: { id: eventId }, query: { hasSeats: 'true' } }" class="text-blue-700 hover:text-blue-900 text-xs font-bold uppercase tracking-widest mb-4 inline-block">
            ← Back to Booking
          </router-link>
          <div class="flex justify-between items-start gap-4">
            <div>
              <h1 class="text-3xl font-bold tracking-tight text-gray-950 mb-2">{{ event?.title }}</h1>
              <p class="text-gray-700 font-medium">{{ event?.location?.venue }}, {{ event?.location?.city }}</p>
            </div>
            <div class="text-right">
              <p class="text-gray-700 text-sm font-medium">{{ formatDate(event?.date) }} at {{ event?.time }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-400 rounded-2xl p-8 shadow-xl">
          <!-- Ticket requirement + legend bar -->
          <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div class="flex flex-wrap items-center gap-4">
              <p class="text-sm text-blue-900 font-semibold">
                <span class="font-black">{{ selectedSeats.length }}</span> / <span class="font-black">{{ requiredSeats }}</span> {{ requiredSeats === 1 ? 'seat' : 'seats' }} selected
              </p>
              <div v-for="(limit, type) in ticketsByType" :key="'count-' + type" class="text-xs font-bold px-2 py-1 rounded-full" :style="{ backgroundColor: getTicketColor(type) + '20', color: getTicketColor(type) }">
                {{ type }}: {{ selectedCountByType[type] || 0 }}/{{ limit }}
              </div>
            </div>
            <div class="flex flex-wrap gap-4 items-center">
              <div v-for="ticket in ticketTypes" :key="ticket.type" class="flex items-center gap-2">
                <svg width="14" height="14"><circle cx="7" cy="7" r="6" :fill="getTicketColor(ticket.type)" opacity="0.35" :stroke="getTicketColor(ticket.type)" stroke-width="1.5"/></svg>
                <span class="text-xs text-gray-700 font-medium">{{ ticket.type }}</span>
              </div>
              <div class="flex items-center gap-2">
                <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="#16a34a" stroke="#15803d" stroke-width="1.5"/></svg>
                <span class="text-xs text-gray-700 font-medium">Selected</span>
              </div>
              <div class="flex items-center gap-2">
                <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="#9ca3af" stroke="#6b7280" stroke-width="1.5"/></svg>
                <span class="text-xs text-gray-700 font-medium">Sold</span>
              </div>
              <div class="flex items-center gap-2">
                <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/></svg>
                <span class="text-xs text-gray-700 font-medium">Reserved</span>
              </div>
            </div>
          </div>

          <!-- Interactive SVG Seat Map -->
          <div class="overflow-x-auto pb-4">
            <svg
              :width="svgWidth"
              :height="svgHeight"
              :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
              class="mx-auto block"
              style="min-width: 600px;"
            >
              <!-- Stage -->
              <rect
                :x="svgWidth / 2 - 120"
                :y="10"
                width="240"
                height="32"
                rx="16"
                fill="url(#stageGradient)"
                stroke="#1d4ed8"
                stroke-width="2"
              />
              <text
                :x="svgWidth / 2"
                y="31"
                text-anchor="middle"
                fill="#1e40af"
                font-size="11"
                font-weight="700"
                letter-spacing="2"
              >STAGE</text>

              <!-- Gradient definition -->
              <defs>
                <linearGradient id="stageGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#bfdbfe" />
                  <stop offset="100%" stop-color="#93c5fd" />
                </linearGradient>
              </defs>

              <!-- Row labels -->
              <text
                v-for="rowIdx in totalRows"
                :key="'label-' + rowIdx"
                :x="PADDING_LEFT - 20"
                :y="seatY(rowIdx - 1) + 5"
                text-anchor="middle"
                fill="#6b7280"
                font-size="11"
                font-weight="700"
              >{{ String.fromCharCode(65 + rowIdx - 1) }}</text>

              <!-- Seats -->
              <circle
                v-for="seat in flatSeats"
                :key="seat.seatId"
                :cx="seat.x"
                :cy="seat.y"
                :r="SEAT_RADIUS"
                :fill="seatFill(seat)"
                :stroke="seatStroke(seat)"
                :stroke-width="isSeatSelected(seat) ? 2.5 : 1.5"
                :opacity="seat.status === 'sold' || seat.status === 'reserved' ? 0.55 : isSeatCategoryFull(seat) && !isSeatSelected(seat) ? 0.35 : 1"
                :style="{ cursor: seat.status === 'sold' || seat.status === 'reserved' || (isSeatCategoryFull(seat) && !isSeatSelected(seat)) ? 'not-allowed' : 'pointer' }"
                @click="toggleSeat(seat)"
              >
                <title>{{ seat.seatId }} — {{ seat.ticketType }}</title>
              </circle>
            </svg>
          </div>

          <!-- Timer Warning -->
          <div v-if="selectedSeats.length > 0" class="mt-6 p-4 bg-yellow-50 border border-yellow-400 rounded-lg">
            <p class="text-sm text-yellow-900 font-semibold">
              ⏱️ Reservation expires in <span class="font-black">{{ formattedTimer }}</span>
            </p>
          </div>

          <!-- Order Summary -->
          <div v-if="selectedSeats.length > 0" class="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-lg">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex flex-wrap gap-3">
                <span v-for="(count, type) in selectedCountByType" :key="'sum-' + type" class="text-xs font-bold text-gray-800">
                  {{ count }}x {{ type }} &mdash; ${{ (ticketTypes.find(t => t.type === type)?.price || 0) * count }}
                </span>
              </div>
              <span class="text-lg font-black text-blue-700">Total: ${{ orderTotal }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-6 flex flex-wrap items-center gap-4">
            <button
              @click="proceedToPayment"
              :disabled="selectedSeats.length !== requiredSeats || processing"
              class="bg-blue-700 hover:bg-blue-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold uppercase text-[10px] tracking-widest transition-all"
            >
              {{ processing ? 'Processing...' : 'Complete Purchase' }}
            </button>
            <button
              @click="router.back()"
              class="bg-transparent border border-gray-400 text-gray-700 hover:text-gray-950 px-6 py-3 rounded-lg font-bold uppercase text-[10px] tracking-widest transition-all"
            >
              Cancel
            </button>
            <p v-if="selectedSeats.length !== requiredSeats" class="text-xs text-orange-700 font-semibold ml-auto">
              Select {{ requiredSeats - selectedSeats.length }} more {{ (requiredSeats - selectedSeats.length) === 1 ? 'seat' : 'seats' }}
            </p>
          </div>
        </div>
      </template>

      <!-- Error State -->
      <div v-else-if="!loading" class="text-center py-20 text-gray-600">
        <p class="text-lg font-semibold">Unable to load seat map</p>
        <p class="text-sm mb-4">Please check your connection and try again</p>
        <router-link :to="{ name: 'CreateBooking', params: { id: eventId }, query: { hasSeats: 'true' } }" class="text-blue-700 hover:text-blue-900 font-bold">
          ← Back to Booking
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const eventId = route.params.eventId || route.params.id;
const event = ref(null);
const flatSeats = ref([]);
const ticketTypes = ref([]);
const selectedSeats = reactive([]);
const processing = ref(false);
const reservationTimeLeft = ref(600);
const requiredSeats = ref(parseInt(sessionStorage.getItem('ticketCount') || '0'));
const ticketsByType = reactive(JSON.parse(sessionStorage.getItem('ticketsByType') || '{}'));
const loading = ref(true);
let reservationTimer = null;

// Count how many seats of each type are currently selected
const selectedCountByType = computed(() => {
  const counts = {};
  for (const s of selectedSeats) {
    counts[s.ticketType] = (counts[s.ticketType] || 0) + 1;
  }
  return counts;
});

// Order total based on selected seats and ticket prices
const orderTotal = computed(() => {
  let total = 0;
  for (const s of selectedSeats) {
    const tt = ticketTypes.value.find(t => t.type === s.ticketType);
    if (tt) total += tt.price;
  }
  return total;
});

// SVG layout constants
const SEAT_RADIUS = 12;
const SEAT_GAP_X = 34;
const SEAT_GAP_Y = 34;
const PADDING_LEFT = 50;
const PADDING_TOP = 70;
const totalRows = ref(0);
const totalCols = ref(0);

const svgWidth = computed(() => PADDING_LEFT + totalCols.value * SEAT_GAP_X + 30);
const svgHeight = computed(() => PADDING_TOP + totalRows.value * SEAT_GAP_Y + 30);

const seatX = (col) => PADDING_LEFT + col * SEAT_GAP_X + SEAT_RADIUS;
const seatY = (row) => PADDING_TOP + row * SEAT_GAP_Y + SEAT_RADIUS;

const formattedTimer = computed(() => {
  const m = Math.floor(reservationTimeLeft.value / 60);
  const s = reservationTimeLeft.value % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
});

import { API_URL } from '../config';

// Fetch event and seats
const fetchEventAndSeats = async () => {
  try {
    const eventRes = await fetch(`${API_URL}/events/${eventId}`);
    if (!eventRes.ok) {
      console.error('Event fetch failed:', eventRes.status);
      return;
    }
    const eventData = await eventRes.json();
    event.value = eventData.event || eventData;
    ticketTypes.value = event.value.ticketTypes || [];
    totalRows.value = event.value.venueRows || 12;
    totalCols.value = event.value.venueSeatsPerRow || 15;

    // Try fetching existing seats from Firestore
    let seatData = [];
    try {
      const seatsRes = await fetch(`${API_URL}/bookings/seats/${eventId}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
      if (seatsRes.ok) {
        const seatsJson = await seatsRes.json();
        seatData = seatsJson.seats || [];
      }
    } catch (seatError) {
      console.error('Seat fetch error:', seatError);
    }

    buildFlatSeats(seatData);
  } catch (error) {
    console.error('Error fetching event or seats:', error);
  } finally {
    loading.value = false;
  }
};

// Build flat array of seat objects with x,y coordinates
const buildFlatSeats = (seatData) => {
  const types = event.value?.ticketTypes || [];
  const seats = [];

  for (let row = 1; row <= totalRows.value; row++) {
    // Derive ticket type from ticketTypes[].rows arrays
    let ticketType = 'Standard';
    const match = types.find(t => t.rows && t.rows.includes(row));
    if (match) ticketType = match.type;

    for (let seat = 1; seat <= totalCols.value; seat++) {
      const seatId = `${String.fromCharCode(64 + row)}${seat}`;
      const seatInfo = seatData.find(s => s.seatId === seatId);

      seats.push({
        seatId,
        row,
        col: seat,
        x: seatX(seat - 1),
        y: seatY(row - 1),
        status: seatInfo?.status || 'available',
        ticketType: seatInfo?.ticketType || ticketType
      });
    }
  }

  flatSeats.value = seats;
};

// SVG fill colour per seat
const seatFill = (seat) => {
  if (seat.status === 'sold') return '#9ca3af';
  if (seat.status === 'reserved') return '#facc15';
  if (isSeatSelected(seat)) return '#16a34a';
  // Translucent ticket-type colour for available
  return getTicketColor(seat.ticketType) + '40';
};

// SVG stroke colour per seat
const seatStroke = (seat) => {
  if (seat.status === 'sold') return '#6b7280';
  if (seat.status === 'reserved') return '#ca8a04';
  if (isSeatSelected(seat)) return '#15803d';
  return getTicketColor(seat.ticketType);
};

const isSeatSelected = (seat) => selectedSeats.some(s => s.seatId === seat.seatId);

// Check if this seat's ticket category has reached its limit
const isSeatCategoryFull = (seat) => {
  const limit = ticketsByType[seat.ticketType] || 0;
  const count = selectedCountByType.value[seat.ticketType] || 0;
  return count >= limit;
};

// Toggle seat selection
const toggleSeat = (seat) => {
  if (seat.status === 'sold' || seat.status === 'reserved') return;

  const idx = selectedSeats.findIndex(s => s.seatId === seat.seatId);

  if (idx > -1) {
    selectedSeats.splice(idx, 1);
  } else {
    if (selectedSeats.length >= requiredSeats.value) {
      alert(`You can only select ${requiredSeats.value} ${requiredSeats.value === 1 ? 'seat' : 'seats'}`);
      return;
    }
    const typeLimit = ticketsByType[seat.ticketType] || 0;
    const typeCount = selectedCountByType.value[seat.ticketType] || 0;
    if (typeCount >= typeLimit) {
      alert(`You can only select ${typeLimit} ${seat.ticketType} ${typeLimit === 1 ? 'seat' : 'seats'}`);
      return;
    }
    selectedSeats.push({
      row: seat.row,
      col: seat.col,
      seatId: seat.seatId,
      ticketType: seat.ticketType
    });
  }
};

// Get ticket color
const getTicketColor = (ticketType) => {
  const colors = {
    'VIP': '#dc2626',
    'Premium': '#2563eb',
    'Standard': '#16a34a',
    'General': '#16a34a'
  };
  return colors[ticketType] || '#9ca3af';
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

// Reserve seats
const reserveSeats = async () => {
  const response = await fetch(`${API_URL}/bookings/reserve-seats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authStore.token}`
    },
    body: JSON.stringify({
      eventId,
      seats: selectedSeats.map(s => s.seatId)
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to reserve seats');
  return data.reservationId;
};

// Proceed to payment — create pending booking + Stripe session directly
const proceedToPayment = async () => {
  if (selectedSeats.length === 0) return;
  if (!authStore.token) {
    alert('Please sign in to continue.');
    router.push('/login');
    return;
  }
  processing.value = true;

  try {
    // 1. Reserve seats
    const reservationId = await reserveSeats();

    // 2. Build ticket quantities from selected seats
    const ticketsByType = JSON.parse(sessionStorage.getItem('ticketsByType') || '{}');
    const tickets = Object.entries(ticketsByType).map(([type, quantity]) => ({ type, quantity }));

    // 3. Create pending booking
    const pendingRes = await fetch(`${API_URL}/bookings/pending`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        eventId,
        tickets,
        seatReservationId: reservationId
      })
    });
    if (!pendingRes.ok) {
      const err = await pendingRes.json();
      throw new Error(err.error || 'Failed to create booking');
    }
    const { bookingId } = await pendingRes.json();

    // 4. Create Stripe checkout session
    const checkoutRes = await fetch(`${API_URL}/payments/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ eventId, bookingId, tickets })
    });
    const checkoutData = await checkoutRes.json().catch(() => ({}));
    if (!checkoutRes.ok || !checkoutData.url) {
      throw new Error(checkoutData.error || 'Could not start payment.');
    }

    // 5. Redirect to Stripe
    window.location.href = checkoutData.url;
  } catch (error) {
    alert(error.message || 'Failed to process payment. Please try again.');
    processing.value = false;
  }
};

// Reservation timer
const startReservationTimer = () => {
  reservationTimeLeft.value = 600;
  reservationTimer = setInterval(() => {
    reservationTimeLeft.value--;
    if (reservationTimeLeft.value <= 0) {
      clearInterval(reservationTimer);
      selectedSeats.splice(0);
      alert('Your seat reservation has expired. Please select seats again.');
    }
  }, 1000);
};

onMounted(() => {
  fetchEventAndSeats();
  startReservationTimer();
});

onUnmounted(() => {
  if (reservationTimer) clearInterval(reservationTimer);
});
</script>
