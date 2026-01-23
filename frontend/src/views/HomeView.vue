<template>
  <div class="min-h-screen bg-[#0b0f1a] text-white p-6 pt-20">
    <div class="max-w-7xl mx-auto">
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-gray-800 pb-6"
      >
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-white">
            Upcoming Events
          </h1>
          <div v-if="authStore.isLoggedIn" class="mt-2 flex items-center gap-2">
            <span class="text-blue-400 font-medium italic text-lg">
              Welcome, {{ authStore.firstName }}!
            </span>
            <span
              v-if="authStore.isAdmin"
              class="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 uppercase font-bold tracking-tighter"
            >
              Administrator
            </span>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <button
            v-if="authStore.isAdmin"
            @click="router.push('/create-event')"
            class="bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold py-2.5 px-5 rounded-lg uppercase tracking-widest transition-all shadow-lg shadow-green-900/20 active:scale-95"
          >
            + Create Event
          </button>
          <div
            class="bg-[#161b26] px-4 py-2 rounded-lg border border-gray-800 text-[10px] font-bold uppercase tracking-widest text-blue-500"
          >
            {{ filteredEvents.length }} Events Available
          </div>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div
          class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"
        ></div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="event in filteredEvents"
          :key="event.eventId"
          :class="[
            'bg-[#161b26] border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col group relative',
            event.isActive
              ? 'border-gray-800 hover:border-blue-500/50'
              : 'border-red-900/30 opacity-70 grayscale-[0.2]',
          ]"
        >
          <div v-if="!event.isActive" class="absolute top-3 left-3 z-20">
            <span
              class="bg-red-950 text-red-400 text-[9px] px-2 py-1 rounded border border-red-500/20 uppercase font-bold"
            >
              Inactive
            </span>
          </div>

          <div class="p-6 flex-grow">
            <div class="flex justify-between items-start mb-4">
              <span
                class="text-[10px] bg-blue-600/10 text-blue-400 px-2 py-1 rounded uppercase font-bold"
                >{{ event.time }}</span
              >
              <span class="text-gray-500 text-[10px] font-medium uppercase">{{
                formatDate(event.date)
              }}</span>
            </div>
            <h3
              class="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors"
            >
              {{ event.title }}
            </h3>
            <p
              class="text-gray-400 text-xs line-clamp-3 mb-4 italic leading-relaxed"
            >
              {{ event.description }}
            </p>
          </div>

          <div
            class="bg-[#1f2533] p-4 flex justify-between items-center border-t border-gray-800"
          >
            <div class="flex flex-col">
              <span
                class="text-[9px] text-gray-500 uppercase font-bold tracking-tighter"
                >Starting at</span
              >
              <span class="text-blue-400 font-bold text-lg"
                >${{ getMinPrice(event.ticketTypes) }}</span
              >
            </div>

            <div v-if="authStore.isAdmin" class="flex gap-2">
              <button
                v-if="!event.isActive"
                @click="handleRestore(event.eventId)"
                class="bg-emerald-600 p-2.5 rounded-lg text-white transition-all active:scale-90"
                title="Restore"
              >
                🔄
              </button>
              <button
                @click="router.push(`/edit-event/${event.id || event.eventId}`)"
                class="bg-blue-600 p-2.5 rounded-lg text-white transition-all active:scale-90"
              >
                ✏️
              </button>
              <button
                @click="openDeleteModal(event.id || event.eventId)"
                class="bg-red-600 p-2.5 rounded-lg text-white transition-all active:scale-90"
              >
                🗑️
              </button>
            </div>
            <button
              v-else
              class="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-2.5 px-5 rounded-lg uppercase tracking-widest transition-all"
            >
              Book Tickets
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div
        class="bg-[#161b26] border border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
      >
        <h3 class="text-xl font-bold text-white mb-2 text-center">
          Delete Event?
        </h3>
        <p class="text-gray-400 text-xs text-center mb-6">
          Choose how you want to remove this event.
        </p>
        <div class="flex flex-col gap-3">
          <button
            @click="executeDelete('soft')"
            class="w-full bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white border border-orange-600/20 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            Soft Delete (Deactivate)
          </button>
          <button
            @click="executeDelete('hard')"
            class="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            Permanent Delete
          </button>
          <button
            @click="showModal = false"
            class="w-full bg-transparent text-gray-500 py-2 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();
const events = ref([]);
const loading = ref(true);
const showModal = ref(false);
const selectedEventId = ref(null);

const filteredEvents = computed(() => {
  if (authStore.isAdmin) return events.value;
  return events.value.filter((e) => e.isActive);
});

const fetchEvents = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/events", {
      headers: {
        Authorization: authStore.isLoggedIn ? `Bearer ${authStore.token}` : "",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch");
    events.value = await response.json();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const openDeleteModal = (id) => {
  selectedEventId.value = id;
  showModal.value = true;
};

const executeDelete = async (type) => {
  const id = selectedEventId.value;
  const url = `http://localhost:3000/api/events/${id}/${type}`;
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    if (response.ok) {
      if (type === "hard") {
        events.value = events.value.filter((e) => (e.id || e.eventId) !== id);
      } else {
        const index = events.value.findIndex((e) => (e.id || e.eventId) === id);
        if (index !== -1) {
          events.value[index].isActive = false;
        }
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    showModal.value = false;
    selectedEventId.value = null;
  }
};

const handleRestore = async (id) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/events/${id}/restore`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${authStore.token}` },
      },
    );
    if (response.ok) {
      const index = events.value.findIndex((e) => (e.id || e.eventId) === id);
      if (index !== -1) events.value[index].isActive = true;
    }
  } catch (err) {
    console.error(err);
  }
};

const formatDate = (rawDate) => {
  if (!rawDate) return "N/A";
  let dateObj;

  try {
    if (rawDate && typeof rawDate === "object" && rawDate._seconds) {
      dateObj = new Date(rawDate._seconds * 1000);
    } else {
      dateObj = new Date(rawDate);
    }
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    return dateObj.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (err) {
    console.error("Format error:", err);
    return "N/A";
  }
};
const getMinPrice = (t) => (t?.length ? Math.min(...t.map((x) => x.price)) : 0);

onMounted(fetchEvents);
</script>
