<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  primary?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    class="tile"
    :class="{ 'tile-primary': primary }"
    @click="$emit('click')"
  >
    <div class="tile-title">{{ title }}</div>
    <div class="tile-desc">{{ description }}</div>
  </button>
</template>

<style scoped>
.tile {
  padding: var(--space-6);
  background: var(--color-white);
  border-radius: var(--radius-lg);
  text-align: left;
  transition: var(--transition-fast);
  box-shadow: var(--shadow-sm);
  width: 100%;
}

.tile:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.tile-primary {
  background: var(--color-pink);
  color: var(--color-white);
}

.tile-primary:hover {
  background: var(--color-pink-dark);
}

.tile-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-1);
}

.tile-desc {
  font-size: var(--font-size-sm);
  opacity: 0.85;
  line-height: 1.4;
}

.tile-primary .tile-desc {
  color: rgba(255, 255, 255, 0.9);
}

.tile:not(.tile-primary) .tile-desc {
  color: var(--color-gray-500);
}
</style>