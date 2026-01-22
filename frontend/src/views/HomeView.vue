<template>
  <div class="min-h-screen bg-[#0b0f1a] text-white p-6 pt-20">
    <div class="max-w-7xl mx-auto">
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-gray-800 pb-6"
      >
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Upcoming Events</h1>
          <p class="text-gray-400 text-sm mt-1 italic">
            Discover professional experiences tailored for you
          </p>
        </div>
        <div
          class="bg-[#161b26] px-4 py-2 rounded-lg border border-gray-800 text-[10px] font-bold uppercase tracking-widest text-blue-500"
        >
          {{ events.length }} Total Events
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div
          class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"
        ></div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="event in events"
          :key="event.eventId"
          class="bg-[#161b26] border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 flex flex-col group"
        >
          <div class="p-6 flex-grow">
            <div class="flex justify-between items-start mb-4">
              <span
                class="text-[10px] bg-blue-600/10 text-blue-400 px-2 py-1 rounded uppercase font-bold tracking-wider"
              >
                {{ event.time }}
              </span>
              <span class="text-gray-500 text-[10px] font-medium uppercase">
                {{ formatDate(event.date) }}
              </span>
            </div>

            <h3
              class="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors leading-tight"
            >
              {{ event.title }}
            </h3>

            <p
              class="text-gray-400 text-xs line-clamp-3 mb-4 italic font-light leading-relaxed"
            >
              {{ event.description }}
            </p>

            <div class="space-y-2 mb-4 border-t border-gray-800 pt-4">
              <div class="flex items-center text-xs text-gray-300">
                <span class="text-blue-500 mr-2">📍</span>
                {{ event.location.city }} • {{ event.location.venue }}
              </div>
              <div class="flex items-center text-[10px] text-gray-500">
                <span class="mr-2">👤</span>
                Organized by {{ event.organizer.name }}
              </div>
            </div>
          </div>

          <div
            class="bg-[#1f2533] p-4 flex justify-between items-center border-t border-gray-800"
          >
            <div class="flex flex-col">
              <span class="text-[9px] text-gray-500 uppercase font-bold"
                >Starting from</span
              >
              <span class="text-blue-400 font-bold text-lg"
                >${{ getMinPrice(event.ticketTypes) }}</span
              >
            </div>
            <button
              class="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-2 px-4 rounded-lg transition-all active:scale-95 uppercase tracking-widest"
            >
              View Tickets
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const events = ref([]);
const loading = ref(true);

const fetchEvents = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/events");
    if (!response.ok) throw new Error("Failed to fetch");
    events.value = await response.json();
  } catch (error) {
    console.error("Error fetching events:", error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  const options = { day: "numeric", month: "short", year: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

const getMinPrice = (ticketTypes) => {
  return Math.min(...ticketTypes.map((t) => t.price));
};

onMounted(fetchEvents);
</script>
