<script setup lang="ts">
import { computed } from 'vue';
import type { RequestStatus } from '../services/requests';

const props = defineProps<{
  currentStatus: RequestStatus;
}>();

// The workflow order (excluding Draft — pre-submission state, not a "pipeline stage")
const PIPELINE: RequestStatus[] = [
  'À faire',
  'En cours',
  'Prêt à tester',
  'Emballé',
  'Prêt à enlever',
  'Expédié',
  'Terminé',
];

const currentIndex = computed(() => {
  const idx = PIPELINE.indexOf(props.currentStatus);
  // Draft is "before" the pipeline
  if (props.currentStatus === 'Draft') return -1;
  return idx;
});

function stateForStep(index: number): 'past' | 'current' | 'future' {
  if (index < currentIndex.value) return 'past';
  if (index === currentIndex.value) return 'current';
  return 'future';
}
</script>

<template>
  <div class="pipeline">
    <div
      v-for="(step, index) in PIPELINE"
      :key="step"
      class="step"
      :class="stateForStep(index)"
    >
      <div class="step-dot"></div>
      <div class="step-label">{{ step }}</div>
      <div v-if="index < PIPELINE.length - 1" class="step-line" :class="stateForStep(index)"></div>
    </div>
  </div>
</template>

<style scoped>
.pipeline {
  display: flex;
  align-items: flex-start;
  gap: 0;
  padding: var(--space-6);
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  min-width: 90px;
}

.step-dot {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  background: var(--color-gray-200);
  transition: var(--transition-base);
  z-index: 2;
  position: relative;
}

.step.past .step-dot {
  background: var(--color-pink);
}

.step.current .step-dot {
  background: var(--color-pink);
  box-shadow: 0 0 0 6px var(--color-pink-soft);
  transform: scale(1.15);
}

.step.future .step-dot {
  background: var(--color-gray-200);
}

.step-label {
  margin-top: var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-500);
  text-align: center;
  white-space: nowrap;
}

.step.past .step-label {
  color: var(--color-gray-700);
}

.step.current .step-label {
  color: var(--color-pink-dark);
  font-weight: var(--font-weight-bold);
}

.step-line {
  position: absolute;
  top: 8px;
  left: calc(50% + 8px);
  right: calc(-50% + 8px);
  height: 2px;
  background: var(--color-gray-200);
  z-index: 1;
}

.step-line.past {
  background: var(--color-pink);
}
</style>