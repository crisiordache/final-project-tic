<template>
  <div class="min-h-screen bg-[#0b0f1a] text-white p-6 pt-10">
    <div
      class="max-w-3xl mx-auto bg-[#161b26] border border-gray-800 rounded-2xl p-8 shadow-2xl"
    >
      <div class="mb-8 border-b border-gray-800 pb-4">
        <h2 class="text-2xl font-bold text-white">
          {{ isEditMode ? "Edit Event" : "Create New Event" }}
        </h2>
        <p class="text-gray-400 text-sm italic">
          {{
            isEditMode
              ? "Modify the event details"
              : "Fill in the details to publish a professional experience"
          }}
        </p>
      </div>

      <div
        v-if="serverErrors.length"
        class="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg"
      >
        <p
          class="text-red-500 text-xs font-bold uppercase mb-2 tracking-widest"
        >
          Validation Errors:
        </p>
        <ul class="list-disc list-inside text-red-400 text-xs space-y-1">
          <li v-for="(err, index) in serverErrors" :key="index">{{ err }}</li>
        </ul>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex flex-col gap-2">
            <label
              class="text-[10px] uppercase font-bold text-gray-500 tracking-widest"
              >Event Title</label
            >
            <input
              v-model="form.title"
              type="text"
              required
              class="bg-[#1f2533] border border-gray-800 rounded-lg px-4 py-2.5 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label
              class="text-[10px] uppercase font-bold text-gray-500 tracking-widest"
              >Date & Time</label
            >
            <div class="flex gap-2">
              <input
                v-model="form.date"
                type="date"
                required
                class="flex-grow bg-[#1f2533] border border-gray-800 rounded-lg px-4 py-2.5 focus:border-blue-500 outline-none"
              />
              <input
                v-model="form.time"
                type="time"
                required
                class="w-32 bg-[#1f2533] border border-gray-800 rounded-lg px-4 py-2.5 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label
            class="text-[10px] uppercase font-bold text-gray-500 tracking-widest"
            >Description</label
          >
          <textarea
            v-model="form.description"
            rows="3"
            required
            class="bg-[#1f2533] border border-gray-800 rounded-lg px-4 py-2.5 focus:border-blue-500 outline-none"
          ></textarea>
        </div>

        <div
          class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[#0b0f1a] rounded-xl border border-gray-800"
        >
          <div class="flex flex-col gap-2">
            <label
              class="text-[10px] uppercase font-bold text-blue-500 tracking-widest"
              >City</label
            >
            <input
              v-model="form.location.city"
              type="text"
              required
              class="bg-[#1f2533] border border-gray-800 rounded-lg px-4 py-2.5 outline-none"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label
              class="text-[10px] uppercase font-bold text-blue-500 tracking-widest"
              >Venue Name</label
            >
            <input
              v-model="form.location.venue"
              type="text"
              required
              class="bg-[#1f2533] border border-gray-800 rounded-lg px-4 py-2.5 outline-none"
            />
          </div>
        </div>

        <div class="space-y-4">
          <label
            class="text-[10px] uppercase font-bold text-gray-500 tracking-widest block"
            >Ticket Pricing</label
          >
          <div
            v-for="(ticket, index) in form.ticketTypes"
            :key="index"
            class="flex items-center gap-4 bg-[#1f2533] p-3 rounded-lg border border-gray-800"
          >
            <span class="text-xs font-bold text-blue-400 w-20">{{
              ticket.type
            }}</span>
            <input
              v-model.number="ticket.price"
              type="number"
              min="0"
              required
              class="w-full bg-[#0b0f1a] border border-gray-800 rounded px-3 py-1.5"
            />
            <input
              v-model.number="ticket.available"
              type="number"
              min="1"
              required
              class="w-full bg-[#0b0f1a] border border-gray-800 rounded px-3 py-1.5"
            />
          </div>
        </div>

        <div class="pt-6 border-t border-gray-800 flex justify-end gap-4">
          <button
            type="button"
            @click="router.back()"
            class="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="bg-green-600 hover:bg-green-500 px-8 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
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
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const loading = ref(false);
const serverErrors = ref([]);

const isEditMode = computed(() => !!route.params.id);

const form = reactive({
  title: "",
  description: "",
  date: "",
  time: "",
  location: { city: "", venue: "" },
  ticketTypes: [
    { type: "Standard", price: 0, available: 100 },
    { type: "VIP", price: 0, available: 20 },
  ],
  organizer: {
    id: authStore.user?.uid,
    name: authStore.profile?.name || "Admin",
    email: authStore.user?.email,
  },
  isActive: true,
});

onMounted(async () => {
  if (isEditMode.value) {
    loading.value = true;
    try {
      const response = await fetch(
        `http://localhost:3000/api/events/${route.params.id}`,
      );
      if (!response.ok) throw new Error("Event not found");
      const data = await response.json();

      Object.assign(form, data);

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

  const url = isEditMode.value
    ? `http://localhost:3000/api/events/${route.params.id}`
    : "http://localhost:3000/api/events";

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
