<script setup lang="ts">
import { computed } from 'vue';
import type { RequestStatus } from '../services/requests';

const props = defineProps<{
  status: RequestStatus;
}>();

const styleForStatus = computed(() => {
  switch (props.status) {
    case 'Draft':
      return { bg: '#F1F5F9', color: '#475569' };
    case 'À faire':
      return { bg: '#F1F5F9', color: '#475569' };
    case 'En cours':
      return { bg: '#FEF3C7', color: '#92400E' };
    case 'Prêt à tester':
      return { bg: '#FCE7F3', color: '#9F1239' };
    case 'Emballé':
      return { bg: '#DBEAFE', color: '#1E40AF' };
    case 'Prêt à enlever':
      return { bg: '#E0E7FF', color: '#3730A3' };
    case 'Expédié':
      return { bg: '#CFFAFE', color: '#155E75' };
    case 'Terminé':
      return { bg: '#DCFCE7', color: '#166534' };
    default:
      return { bg: '#F1F5F9', color: '#475569' };
  }
});
</script>

<template>
  <span
    class="badge"
    :style="{ backgroundColor: styleForStatus.bg, color: styleForStatus.color }"
  >
    {{ status }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}
</style>