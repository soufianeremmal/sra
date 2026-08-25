<script setup lang="ts">
defineProps<{
  label: string;
  value: number | string;
  hint?: string;
  variant?: 'default' | 'success' | 'warn' | 'primary';
}>();
</script>

<template>
  <div class="stat-tile" :class="`variant-${variant || 'default'}`">
    <div class="stat-value">{{ value }}</div>
    <div class="stat-label">{{ label }}</div>
    <div v-if="hint" class="stat-hint">{{ hint }}</div>
  </div>
</template>

<style scoped>
.stat-tile {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-fast);
}

.stat-tile:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-dark);
  line-height: 1;
  margin-bottom: var(--space-2);
}

.stat-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--color-gray-700);
}

.stat-hint {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
  margin-top: var(--space-2);
}

.variant-success .stat-value { color: var(--color-success); }
.variant-warn .stat-value { color: var(--color-warn); }
.variant-primary .stat-value { color: var(--color-pink); }
</style>