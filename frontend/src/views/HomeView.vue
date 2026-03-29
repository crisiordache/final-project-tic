<template>
  <div class="min-h-screen bg-[#f8f9fa] text-gray-900 p-6 pt-10">
    <div class="max-w-7xl mx-auto">
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-gray-400 pb-6"
      >
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-gray-950">
            Upcoming Events
          </h1>
          <div v-if="authStore.isLoggedIn" class="mt-2 flex items-center gap-2">
            <span class="text-blue-700 font-semibold italic text-lg">
              Welcome, {{ authStore.firstName }}!
            </span>
            <span
              v-if="authStore.isAdmin"
              class="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-300 uppercase font-bold tracking-tighter"
            >
              Administrator
            </span>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <button
            v-if="authStore.isAdmin"
            @click="router.push('/create-event')"
            class="bg-green-700 hover:bg-green-900 text-white text-[10px] font-bold py-2.5 px-5 rounded-lg uppercase tracking-widest transition-all shadow-lg shadow-green-900/20 active:scale-95"
          >
            + Create Event
          </button>
          <div
            class="bg-white px-4 py-2 rounded-lg border border-gray-400 text-[10px] font-bold uppercase tracking-widest text-blue-700"
          >
            {{ filteredEvents.length }} / {{ events.length }} Events Shown
          </div>
        </div>
      </div>

      <div
        v-if="!loading"
        class="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3"
      >
        <input
          v-model="filters.search"
          type="search"
          placeholder="Search by name…"
          class="bg-white border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 font-medium"
        />
        <select
          v-model="filters.city"
          class="bg-white border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 font-medium"
        >
          <option value="">All cities</option>
          <option v-for="c in cityOptions" :key="c" :value="c">{{ c }}</option>
        </select>
        <select
          v-model="filters.venue"
          class="bg-white border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 font-medium"
        >
          <option value="">All venues</option>
          <option v-for="v in venueOptions" :key="v" :value="v">{{ v }}</option>
        </select>
        <select
          v-model="filters.category"
          class="bg-white border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 font-medium"
        >
          <option value="">All categories</option>
          <option v-for="cat in categoryOptions" :key="cat" :value="cat">{{ cat }}</option>
        </select>
        <input
          v-model="filters.date"
          type="date"
          class="bg-white border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-900 font-medium"
        />
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="bg-red-100 text-red-700 border border-red-300 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-red-200 transition-all"
        >
          ✕ Clear All
        </button>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div
          class="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"
        ></div>
      </div>

      <div
        v-else-if="!filteredEvents.length"
        class="text-center py-16 text-gray-700 text-sm border border-dashed border-gray-400 rounded-2xl"
      >
        No events match your filters.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="event in filteredEvents"
          :key="event.id || event.eventId"
          :class="[
            'bg-white border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col group relative',
            event.isActive
              ? 'border-gray-400 hover:border-blue-600'
              : 'border-red-400 opacity-70 grayscale-[0.2]',
          ]"
        >
          <div v-if="!event.isActive || event.date < new Date()" class="absolute top-0 left-1/2 transform -translate-x-1/2 z-30">
            <span
              class="bg-red-100 text-red-700 text-[9px] px-2 py-1 rounded border border-red-300 uppercase font-bold"
            >
              Inactive
            </span>
          </div>

          <div v-if="event.posterUrl" class="w-full h-48 overflow-hidden">
            <img :src="event.posterUrl" :alt="event.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div v-else class="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <span class="text-4xl opacity-40">🎫</span>
          </div>

          <div class="p-6 flex-grow">
            <div class="flex justify-between items-start mb-4">
              <span
                class="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase font-bold"
                >{{ event.time }}</span
              >
              <span class="text-gray-700 text-[10px] font-semibold uppercase">{{
                formatDate(event.date)
              }}</span>
            </div>
            <div class="flex flex-wrap gap-2 mb-2">
              <span
                v-if="event.category"
                class="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded uppercase font-bold tracking-tighter"
                >{{ event.category }}</span
              >
              <span
                class="text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-tighter"
                :class="
                  event.hasSeating
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-700'
                "
              >
                {{ event.hasSeating ? "Assigned seats" : "General admission" }}
              </span>
            </div>
            <h3
              class="text-lg font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors"
            >
              {{ event.title }}
            </h3>
            <p class="text-[10px] text-gray-700 mb-1 font-medium">
              {{ event.location?.venue }}, {{ event.location?.city }}
            </p>
            <p
              class="text-gray-800 text-xs line-clamp-3 mb-4 italic leading-relaxed"
            >
              {{ event.description }}
            </p>
          </div>

          <div
            class="bg-gray-200 p-4 flex justify-between items-center border-t border-gray-400"
          >
            <div class="flex flex-col">
              <span
                class="text-[9px] text-gray-700 uppercase font-bold tracking-tighter"
                >Starting at</span
              >
              <span class="text-blue-700 font-bold text-lg"
                >${{ getMinPrice(event.ticketTypes) }}</span
              >
            </div>

            <div v-if="authStore.isAdmin" class="flex gap-2">
              <button
                v-if="!event.isActive"
                @click="handleRestore(event.id || event.eventId)"
                class="bg-emerald-700 hover:bg-emerald-900 p-2.5 rounded-lg text-white transition-all active:scale-90"
                title="Restore"
              >
                🔄
              </button>
              <button
                @click="router.push(`/edit-event/${event.id || event.eventId}`)"
                class="bg-blue-700 hover:bg-blue-900 p-2.5 rounded-lg text-white transition-all active:scale-90"
              >
                ✏️
              </button>
              <button
                @click="openDeleteModal(event.id || event.eventId)"
                class="bg-red-700 hover:bg-red-900 p-2.5 rounded-lg text-white transition-all active:scale-90"
              >
                🗑️
              </button>
            </div>
            <button
              v-else
              @click="router.push(`/book/${event.id || event.eventId}`)"
              class="bg-blue-700 hover:bg-blue-900 text-white text-[10px] font-bold py-2.5 px-5 rounded-lg uppercase tracking-widest transition-all"
            >
              Book Tickets
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
      <div
        class="bg-white border border-gray-300 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
      >
        <h3 class="text-xl font-bold text-gray-900 mb-2 text-center">
          Delete Event?
        </h3>
        <p class="text-gray-600 text-xs text-center mb-6">
          Choose how you want to remove this event.
        </p>
        <div class="flex flex-col gap-3">
          <button
            @click="executeDelete('soft')"
            class="w-full bg-orange-100 hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-300 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            Soft Delete (Deactivate)
          </button>
          <button
            @click="executeDelete('hard')"
            class="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            Permanent Delete
          </button>
          <button
            @click="showModal = false"
            class="w-full bg-transparent text-gray-600 py-2 text-[10px] font-bold uppercase tracking-widest hover:text-gray-900 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import { API_URL } from '../config';

const authStore = useAuthStore();
const router = useRouter();
const events = ref([]);
const loading = ref(true);
const showModal = ref(false);
const selectedEventId = ref(null);

const listLimit = 300;

const filters = ref({
  search: "",
  city: "",
  venue: "",
  date: "",
  category: ""
});

const hasActiveFilters = computed(() => {
  const f = filters.value;
  return f.search || f.city || f.venue || f.date || f.category;
});

const clearFilters = () => {
  filters.value = { search: "", city: "", venue: "", date: "", category: "" };
};

const normalizedDay = (rawDate) => {
  if (!rawDate) return "";
  const dateObj =
    rawDate && rawDate._seconds ? new Date(rawDate._seconds * 1000) : new Date(rawDate);
  if (Number.isNaN(dateObj.getTime())) return "";
  return dateObj.toISOString().split("T")[0];
};

const cityOptions = computed(() => {
  return [...new Set(events.value.map((e) => e?.location?.city).filter(Boolean))].sort();
});

const venueOptions = computed(() => {
  const scoped = !filters.value.city
    ? events.value
    : events.value.filter((e) => e?.location?.city === filters.value.city);
  return [...new Set(scoped.map((e) => e?.location?.venue).filter(Boolean))].sort();
});

const categoryOptions = computed(() => {
  return [...new Set(events.value.map((e) => e?.category).filter(Boolean))].sort();
});

const filteredEvents = computed(() => {
  const q = filters.value.search.trim().toLowerCase();
  return events.value.filter((event) => {
    const title = String(event.title || "").toLowerCase();
    const matchSearch = !q || title.includes(q);
    const matchCity = !filters.value.city || event?.location?.city === filters.value.city;
    const matchVenue = !filters.value.venue || event?.location?.venue === filters.value.venue;
    const matchCat =
      !filters.value.category || event?.category === filters.value.category;
    const matchDate =
      !filters.value.date || normalizedDay(event.date) === filters.value.date;
    return matchSearch && matchCity && matchVenue && matchCat && matchDate;
  });
});

watch(
  () => filters.value.city,
  () => {
    filters.value.venue = "";
  }
);

const fetchEvents = async () => {
  loading.value = true;
  try {
    const url = new URL(`${API_URL}/events`);
    url.searchParams.append("limit", String(listLimit));

    const response = await fetch(url, {
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
  const url = `${API_URL}/events/${id}/${type}`;
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
      `${API_URL}/events/${id}/restore`,
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

onMounted(() => {
  fetchEvents();
});
</script>
