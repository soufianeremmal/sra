<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.ts';
import { useRequestsStore } from '../stores/requests.ts';
import ActionTile from '../components/ActionTile.vue';
import RequestsTable from '../components/RequestsTable.vue';

const auth = useAuthStore();
const requestsStore = useRequestsStore();
const router = useRouter();

onMounted(() => {
  requestsStore.fetchAll();
});

function handleLogout() {
  auth.logout();
  router.push('/login');
}

async function handleNewRequest() {
  // Create an empty draft, then navigate to its edit page
  const draft = await requestsStore.createNewDraft({
    projectName: 'Nouvelle demande',
    city: 'À définir',
    projectType: 'AO',
  });
  if (draft) {
    router.push(`/requests/${draft._id}/edit`);
  }
}

function handleFeedback() {
  router.push('/feedback');
}
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
        <div class="kicker">MARKETING</div>
        <h1>Bonjour {{ auth.user?.name }} 👋</h1>
      </div>

      <div class="tiles">
        <ActionTile
          title="+ Nouvelle demande"
          description="Sample, Démo, Salon ou AO — moins de 5 minutes"
          primary
          @click="handleNewRequest"
        />
        <ActionTile
          title="Mes demandes"
          description="Historique et brouillons"
        />
        <ActionTile
          title="Feedback"
          description="Une remarque ou un problème ?"
          @click="handleFeedback"
        />
      </div>

      <div class="section">
        <div class="section-header">
          <div class="kicker">Vue d'ensemble</div>
          <h2>Toutes les demandes</h2>
        </div>

        <div v-if="requestsStore.loading" class="loading">Chargement...</div>
        <div v-else-if="requestsStore.error" class="error">
          {{ requestsStore.error }}
        </div>
        <RequestsTable v-else :requests="requestsStore.items" />
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
  max-width: 1100px;
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

.tiles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-10);
}

.section-header {
  margin-bottom: var(--space-4);
}

.section-header h2 {
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

.error {
  padding: var(--space-6);
  color: var(--color-error);
  background: #FEF2F2;
  border-radius: var(--radius-lg);
}
</style>

