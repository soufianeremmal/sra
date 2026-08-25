<script setup lang="ts">
import { computed } from 'vue';
import { useBikesStore } from '../stores/bikes';

defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  select: [sn: string];
  cancel: [];
}>();

const bikesStore = useBikesStore();

const availableBikes = computed(() => {
  const group = bikesStore.availability.find((g) => g.status === 'Available');
  return group?.bikes || [];
});

function handleSelect(sn: string) {
  emit('select', sn);
}
</script>

<template>
  <div class="picker-overlay" @click="emit('cancel')">
    <div class="picker-panel" @click.stop>
      <div class="picker-header">
        <h3>Choisir un vélo disponible</h3>
        <button class="btn-icon-danger" @click="emit('cancel')">✕</button>
      </div>

      <div v-if="availableBikes.length === 0" class="empty">
        Aucun vélo disponible pour le moment.
      </div>

      <div v-else class="bike-grid">
        <button
          v-for="bike in availableBikes"
          :key="bike.sn"
          class="bike-card"
          :disabled="loading"
          @click="handleSelect(bike.sn)"
        >
          <div class="bike-sn">{{ bike.sn }}</div>
          <div class="bike-model">{{ bike.bikeModel }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--space-6);
}

.picker-panel {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

.picker-header h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-dark);
}

.btn-icon-danger {
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  color: var(--color-gray-500);
  border-radius: var(--radius-full);
  font-size: var(--font-size-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.btn-icon-danger:hover {
  background: var(--color-gray-100);
  color: var(--color-dark);
}

.empty {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-gray-500);
}

.bike-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-3);
}

.bike-card {
  padding: var(--space-4);
  background: var(--color-gray-100);
  border: 1.5px solid transparent;
  border-radius: var(--radius-md);
  text-align: left;
  transition: var(--transition-fast);
}

.bike-card:hover:not(:disabled) {
  background: var(--color-pink-soft);
  border-color: var(--color-pink);
}

.bike-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.bike-sn {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-dark);
  margin-bottom: var(--space-1);
}

.bike-model {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
</style>