<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import type { SamplingRequest } from '../services/requests';
import StatusBadge from './StatusBadge.vue';

defineProps<{
  requests: SamplingRequest[];
}>();

const router = useRouter();
const auth = useAuthStore();

// Marketing goes to the editable form while the request is still in a
// state they can act on; everything past that (and all Sampling views)
// goes to the read-only detail page.
const MARKETING_EDITABLE_STATUSES = ['Draft', 'À faire', 'En cours'];

function goToRequest(req: SamplingRequest) {
  if (auth.user?.role === 'marketing' && MARKETING_EDITABLE_STATUSES.includes(req.status)) {
    router.push(`/requests/${req._id}/edit`);
  } else {
    router.push(`/requests/${req._id}`);
  }
}

function getRequesterName(r: SamplingRequest): string {
  if (typeof r.requester === 'string') return '—';
  return r.requester.name;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
</script>

<template>
  <div class="table-wrapper">
    <table class="table">
      <thead>
        <tr>
          <th>Projet</th>
          <th>Type</th>
          <th>Ville</th>
          <th>Demandeur</th>
          <th>Statut</th>
          <th>Créée</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="requests.length === 0">
          <td colspan="7" class="empty">Aucune demande pour le moment.</td>
        </tr>
        <tr
          v-for="req in requests"
          :key="req._id"
          class="row"
          @click="goToRequest(req)"
        >
          <td class="project-name">{{ req.projectName }}</td>
          <td>{{ req.projectType }}</td>
          <td>{{ req.city }}</td>
          <td>{{ getRequesterName(req) }}</td>
          <td><StatusBadge :status="req.status" /></td>
          <td class="date">{{ formatDate(req.createdAt) }}</td>
          <td>
            <button class="action-btn" @click.stop="goToRequest(req)">Gérer</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrapper {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.table th {
  text-align: left;
  padding: var(--space-4);
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.table td {
  padding: var(--space-4);
  border-top: 1px solid var(--color-gray-200);
  color: var(--color-dark);
}

.row {
  cursor: pointer;
  transition: var(--transition-fast);
}

.row:hover td {
  background: var(--color-gray-100);
}

.project-name {
  font-weight: var(--font-weight-semibold);
}

.date {
  color: var(--color-gray-500);
}

.empty {
  text-align: center;
  color: var(--color-gray-500);
  padding: var(--space-10) !important;
}
.action-btn {
  padding: var(--space-1) var(--space-3);
  background: var(--color-white);
  color: var(--color-pink);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  transition: var(--transition-fast);
}

.action-btn:hover {
  background: var(--color-pink);
  color: var(--color-white);
  border-color: var(--color-pink);
}
</style>