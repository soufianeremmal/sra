<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useRequestsStore } from '../stores/requests';
import { useBikesStore } from '../stores/bikes';
import StatTile from '../components/StatTile.vue';
import RequestsTable from '../components/RequestsTable.vue';

const auth = useAuthStore();
const requestsStore = useRequestsStore();
const bikesStore = useBikesStore();
const router = useRouter();

onMounted(() => {
  requestsStore.fetchAll();
  bikesStore.fetchAvailability();
});

function handleLogout() {
  auth.logout();
  router.push('/login');
}

// Requests that need Sampling attention (anything not Draft, Terminé, or blocked)
const activeRequestsCount = computed(() => {
  return requestsStore.items.filter((r) => {
    return r.status !== 'Draft' && r.status !== 'Terminé';
  }).length;
});

// Bikes deployed = anything not Available and not In repair
const deployedBikesCount = computed(() => {
  return (
    bikesStore.countByStatus('On AO') +
    bikesStore.countByStatus('On demo') +
    bikesStore.countByStatus('On salon')
  );
});

// Sort requests so Sampling sees actionable ones first (À faire, En cours, etc. before Draft/Terminé)
const sortedRequests = computed(() => {
  const priority: Record<string, number> = {
    'À faire': 1,
    'En cours': 2,
    'Prêt à tester': 3,
    'Emballé': 4,
    'Prêt à enlever': 5,
    'Expédié': 6,
    'Draft': 7,
    'Terminé': 8,
  };
  return [...requestsStore.items].sort((a, b) => {
    return (priority[a.status] || 99) - (priority[b.status] || 99);
  });
});
</script>

<template>
  <div class="home-page">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">SRA</div>
      </div>
      <div class="user-chip">
        <span>{{ auth.user?.name }}</span>
        <button class="logout-btn" @click="handleLogout">Déconnexion</button>
      </div>
    </header>

    <main class="content">
      <div class="header">
        <div class="kicker">SAMPLING TEAM</div>
        <h1>Bonjour {{ auth.user?.name }} 👋</h1>
      </div>

      <div class="stats">
        <StatTile
          label="Vélos disponibles"
          :value="bikesStore.countByStatus('Available')"
          variant="success"
          hint="Prêts à être assignés"
        />
        <StatTile
          label="En réparation"
          :value="bikesStore.countByStatus('In repair')"
          variant="warn"
        />
        <StatTile
          label="Vélos déployés"
          :value="deployedBikesCount"
          hint="Sur AO, démo ou salon"
        />
        <StatTile
          label="Demandes actives"
          :value="activeRequestsCount"
          variant="primary"
          hint="À traiter ou en cours"
        />
      </div>

      <div class="section">
        <div class="section-header-row">
          <div>
            <div class="kicker">FILE DE TRAITEMENT</div>
            <h2>Toutes les demandes</h2>
          </div>
        </div>

        <div v-if="requestsStore.loading" class="loading">Chargement...</div>
        <div v-else-if="requestsStore.error" class="error-box">
          {{ requestsStore.error }}
        </div>
        <RequestsTable v-else :requests="sortedRequests" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: var(--color-gray-100);
}

.topbar {
  background: var(--color-white);
  padding: var(--space-4) var(--space-8);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-gray-200);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.brand-mark {
  width: 44px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--color-pink);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: 12px;
  letter-spacing: 0.8px;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  color: var(--color-gray-700);
  font-size: var(--font-size-sm);
}

.logout-btn {
  padding: var(--space-2) var(--space-4);
  background: var(--color-gray-100);
  color: var(--color-dark);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  transition: var(--transition-fast);
}

.logout-btn:hover {
  background: var(--color-gray-200);
}

.content {
  padding: var(--space-10) var(--space-8);
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: var(--space-8);
}

.kicker {
  color: var(--color-pink);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.6px;
  margin-bottom: var(--space-2);
}

h1 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-dark);
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-10);
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space-4);
}

.section-header-row h2 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-dark);
}

.loading {
  padding: var(--space-10);
  text-align: center;
  color: var(--color-gray-500);
  background: var(--color-white);
  border-radius: var(--radius-lg);
}

.error-box {
  padding: var(--space-6);
  color: var(--color-error);
  background: #FEF2F2;
  border-radius: var(--radius-lg);
}
</style>