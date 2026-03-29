<template>
  <div class="min-h-screen bg-[#f8f9fa] text-gray-900 p-6 pt-10">
    <div
      class="max-w-3xl mx-auto bg-white border border-gray-400 rounded-2xl p-8 shadow-2xl"
    >
      <div class="mb-8 border-b border-gray-400 pb-4">
        <h2 class="text-2xl font-bold text-gray-950">
          {{ isEditMode ? "Edit Event" : "Create New Event" }}
        </h2>
        <p class="text-gray-700 text-sm italic font-medium">
          {{
            isEditMode
              ? "Modify the event details"
              : "Fill in the details to publish a professional experience"
          }}
        </p>
      </div>

      <div
        v-if="serverErrors.length"
        class="mb-6 p-4 bg-red-50 border border-red-400 rounded-lg"
      >
        <p
          class="text-red-800 text-xs font-bold uppercase mb-2 tracking-widest"
        >
          Validation Errors:
        </p>
        <ul class="list-disc list-inside text-red-700 text-xs space-y-1 font-medium">
          <li v-for="(err, index) in serverErrors" :key="index">{{ err }}</li>
        </ul>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex flex-col gap-2">
            <label
              class="text-[10px] uppercase font-bold text-gray-700 tracking-widest"
              >Event Title</label
            >
            <input
              v-model="form.title"
              type="text"
              required
              class="bg-white border border-gray-400 rounded-lg px-4 py-2.5 focus:border-blue-700 outline-none transition-all text-gray-950"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label
              class="text-[10px] uppercase font-bold text-gray-700 tracking-widest"
              >Date & Time</label
            >
            <div class="flex gap-2">
              <input
                v-model="form.date"
                type="date"
                required
                class="flex-grow bg-white border border-gray-400 rounded-lg px-4 py-2.5 focus:border-blue-700 outline-none text-gray-950"
              />
              <input
                v-model="form.time"
                type="time"
                step="900"
                required
                class="w-32 bg-white border border-gray-400 rounded-lg px-4 py-2.5 focus:border-blue-700 outline-none text-gray-950"
              />
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label
            class="text-[10px] uppercase font-bold text-gray-700 tracking-widest"
            >Description</label
          >
          <textarea
            v-model="form.description"
            rows="3"
            required
            class="bg-white border border-gray-400 rounded-lg px-4 py-2.5 focus:border-blue-700 outline-none text-gray-950"
          ></textarea>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[10px] uppercase font-bold text-gray-700 tracking-widest">Poster Image URL</label>
          <input
            v-model="form.posterUrl"
            type="url"
            placeholder="https://example.com/poster.jpg"
            class="bg-white border border-gray-400 rounded-lg px-4 py-2.5 focus:border-blue-700 outline-none text-gray-950"
          />
          <div v-if="form.posterUrl" class="mt-2 rounded-lg overflow-hidden border border-gray-300 max-h-48">
            <img :src="form.posterUrl" alt="Poster preview" class="w-full h-48 object-cover" @error="$event.target.style.display='none'" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex flex-col gap-2">
            <label class="text-[10px] uppercase font-bold text-gray-700 tracking-widest"
              >Category</label
            >
            <select
              v-model="form.category"
              required
              class="bg-white border border-gray-400 rounded-lg px-4 py-2.5 focus:border-blue-700 outline-none text-gray-950"
            >
              <option value="" disabled>Select category</option>
              <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] uppercase font-bold text-gray-700 tracking-widest"
              >Venue (saved layouts)</label
            >
            <select
              v-model="form.venueId"
              class="bg-white border border-gray-400 rounded-lg px-4 py-2.5 focus:border-blue-700 outline-none text-gray-950"
              @change="onVenueChange"
            >
              <option value="">— Custom location (type below) —</option>
              <option v-for="v in venues" :key="v.id" :value="v.id">
                {{ v.name }} — {{ v.address }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex items-start gap-3 p-4 bg-gray-100 rounded-xl border border-gray-400">
           <input id="hasSeating" v-model="form.hasSeating" type="checkbox" class="mt-1 rounded border-gray-600" @change="onSeatingToggle" />
           <label for="hasSeating" class="text-sm text-gray-800 cursor-pointer font-medium">
             <span class="font-bold text-gray-950">Assigned seating</span>
             — patrons pick specific seats (uses the venue layout). Leave off for general admission / non‑nominal seats.
           </label>
        </div>

        <!-- Venue dimensions info (when seating enabled) -->
        <div v-if="form.hasSeating && venueInfo.rows > 0" class="p-4 bg-blue-50 rounded-xl border border-blue-300">
          <p class="text-sm text-blue-900 font-semibold">
            Venue layout: <span class="font-black">{{ venueInfo.rows }}</span> rows × <span class="font-black">{{ venueInfo.seatsPerRow }}</span> seats per row
            = <span class="font-black">{{ venueInfo.rows * venueInfo.seatsPerRow }}</span> total seats
          </p>
          <p class="text-xs text-blue-800 mt-1">Assign rows to each ticket type below</p>
        </div>
        <div v-else-if="form.hasSeating" class="p-4 bg-orange-50 rounded-xl border border-orange-300">
          <p class="text-sm text-orange-800 font-semibold">Select a venue above to assign rows to ticket types</p>
        </div>

        <div
          class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-100 rounded-xl border border-gray-400"
        >
          <div class="flex flex-col gap-2">
            <label
              class="text-[10px] uppercase font-bold text-blue-700 tracking-widest"
              >City</label
            >
            <input
              v-model="form.location.city"
              type="text"
              required
              class="bg-white border border-gray-400 rounded-lg px-4 py-2.5 outline-none text-gray-950"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label
              class="text-[10px] uppercase font-bold text-blue-700 tracking-widest"
              >Venue Name</label
            >
            <input
              v-model="form.location.venue"
              type="text"
              required
              class="bg-white border border-gray-400 rounded-lg px-4 py-2.5 outline-none text-gray-950"
            />
          </div>
        </div>

        <div class="space-y-4">
          <label class="text-[10px] uppercase font-bold text-gray-700 tracking-widest block">Ticket Pricing</label>
          <div v-for="(ticket, index) in form.ticketTypes" :key="index"
               class="bg-gray-100 p-4 rounded-lg border border-gray-400 space-y-3">
            <div class="flex items-center gap-4">
              <span class="text-xs font-bold text-blue-700 w-20">{{ ticket.type }}</span>
              <div class="flex-1">
                <label class="text-[10px] text-gray-600 font-semibold block mb-1">Price ($)</label>
                <input v-model.number="ticket.price" type="number" min="0" required
                       class="w-full bg-white border border-gray-400 rounded px-3 py-1.5 text-gray-950" />
              </div>
              <div class="flex-1">
                <label class="text-[10px] text-gray-600 font-semibold block mb-1">Available</label>
                <input v-if="!form.hasSeating" v-model.number="ticket.available" type="number" min="1" required
                       class="w-full bg-white border border-gray-400 rounded px-3 py-1.5 text-gray-950" />
                <div v-else class="bg-gray-200 rounded px-3 py-1.5 text-gray-800 font-bold text-sm">
                  {{ ticket.rows.length * venueInfo.seatsPerRow || 0 }} seats
                </div>
              </div>
            </div>
            <!-- Row assignment for seated events -->
            <div v-if="form.hasSeating && venueInfo.rows > 0" class="pt-2 border-t border-gray-300">
              <p class="text-[10px] uppercase font-bold text-gray-600 tracking-widest mb-2">Assign rows</p>
              <div class="flex flex-wrap gap-1.5">
                <button v-for="r in venueInfo.rows" :key="r" type="button"
                        @click="toggleRowForTicket(ticket, r)"
                        :disabled="isRowAssignedElsewhere(ticket.type, r)"
                        :class="[
                          'w-8 h-8 rounded text-xs font-bold transition-all border',
                          ticket.rows.includes(r)
                            ? 'bg-blue-600 text-white border-blue-700'
                            : isRowAssignedElsewhere(ticket.type, r)
                              ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                              : 'bg-white text-gray-700 border-gray-400 hover:border-blue-500'
                        ]">
                  {{ r }}
                </button>
              </div>
              <p v-if="ticket.rows.length" class="text-[10px] text-gray-500 mt-1">
                Rows {{ ticket.rows.join(', ') }}
              </p>
            </div>
          </div>
        </div>

        <div class="pt-6 border-t border-gray-400 flex justify-end gap-4">
          <button
            type="button"
            @click="router.back()"
            class="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:text-gray-950 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="bg-green-700 hover:bg-green-900 px-8 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 text-white"
          >
            {{
              loading
                ? "Saving..."
                : isEditMode
                  ? "Update Event"
                  : "Publish Event"
            }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { API_URL } from '../config';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const loading = ref(false);
const serverErrors = ref([]);

const isEditMode = computed(() => !!route.params.id);

const categoryOptions = ["Music", "Theatre", "Sports", "Comedy", "Festival"];
const venues = ref([]);

const venueInfo = reactive({ rows: 0, seatsPerRow: 0 });

const form = reactive({
  title: "",
  description: "",
  date: "",
  time: "",
  category: "",
  venueId: "",
  hasSeating: false,
  location: { city: "", venue: "" },
  ticketTypes: [
    { type: "Standard", price: 80, available: 260, rows: [] },
    { type: "VIP", price: 140, available: 40, rows: [] },
  ],
  posterUrl: "",
  organizer: {
    id: authStore.user?.uid,
    name: authStore.profile?.name || "Admin",
    email: authStore.user?.email,
  },
  isActive: true,
});

function onVenueChange() {
  const v = venues.value.find((x) => x.id === form.venueId);
  if (!v) return;
  form.location.venue = v.name;
  form.location.city = v.address || "";
  venueInfo.rows = v.rows || 0;
  venueInfo.seatsPerRow = v.seatsPerRow || 0;
  form.ticketTypes.forEach(t => { t.rows = []; });
  recalcAvailable();
}

function onSeatingToggle() {
  if (!form.hasSeating) {
    form.ticketTypes.forEach(t => { t.rows = []; });
  } else if (form.venueId) {
    onVenueChange();
  }
}

function toggleRowForTicket(ticket, row) {
  const idx = ticket.rows.indexOf(row);
  if (idx > -1) {
    ticket.rows.splice(idx, 1);
  } else {
    ticket.rows.push(row);
    ticket.rows.sort((a, b) => a - b);
  }
  recalcAvailable();
}

function isRowAssignedElsewhere(ticketType, row) {
  return form.ticketTypes.some(t => t.type !== ticketType && t.rows.includes(row));
}

function recalcAvailable() {
  if (!form.hasSeating) return;
  form.ticketTypes.forEach(t => {
    t.available = t.rows.length * venueInfo.seatsPerRow;
  });
}

watch(
  () => form.venueId,
  () => {
    if (form.venueId) onVenueChange();
  }
);

async function fetchVenues() {
  try {
    const res = await fetch(`${API_URL}/venues`);
    if (res.ok) venues.value = await res.json();
  } catch (e) {
    console.error(e);
  }
}

onMounted(async () => {
  await fetchVenues();
  if (isEditMode.value) {
    loading.value = true;
    try {
      const response = await fetch(
        `${API_URL}/events/${route.params.id}`,
      );
      if (!response.ok) throw new Error("Event not found");
      const data = await response.json();

      Object.assign(form, data);
      form.ticketTypes.forEach(t => { if (!t.rows) t.rows = []; });
      if (!form.category && data.category) form.category = data.category;
      if (typeof form.hasSeating !== "boolean") form.hasSeating = !!data.hasSeating;
      venueInfo.rows = data.venueRows || 0;
      venueInfo.seatsPerRow = data.venueSeatsPerRow || 0;

      if (data.date) {
        let dateObj;
        if (data.date._seconds) {
          dateObj = new Date(data.date._seconds * 1000);
        } else {
          dateObj = new Date(data.date);
        }

        form.date = dateObj.toISOString().split("T")[0];
        if (!form.time) {
          form.time = dateObj.toTimeString().slice(0, 5);
        }
      }
    } catch (error) {
      alert("Error loading event: " + error.message);
      router.push("/");
    } finally {
      loading.value = false;
    }
  }
});

const handleSubmit = async () => {
  loading.value = true;
  serverErrors.value = [];

  const dateObject = new Date(`${form.date}T${form.time}`);

  const payload = {
    ...form,
    date: dateObject,
  };
  if (form.hasSeating) {
    payload.venueRows = venueInfo.rows;
    payload.venueSeatsPerRow = venueInfo.seatsPerRow;
  }
  if (!payload.venueId) delete payload.venueId;

  const url = isEditMode.value
    ? `${API_URL}/events/${route.params.id}`
    : `${API_URL}/events`;

  const method = isEditMode.value ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.errors) {
        serverErrors.value = result.errors;
        throw new Error("Validation failed");
      }
      throw new Error(result.error || "Failed to process event");
    }

    alert(
      isEditMode.value
        ? "Event updated successfully!"
        : "Event created successfully!",
    );
    router.push("/");
  } catch (error) {
    console.error("Submit error:", error);
    if (serverErrors.value.length === 0) {
      alert(error.message);
    }
  } finally {
    loading.value = false;
  }
};
</script>
