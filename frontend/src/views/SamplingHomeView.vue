<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>

<template>
  <div class="home-page">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">SRA</div>
        <span class="brand-name">SRA</span>
      </div>
      <div class="user-chip">
        <span>{{ auth.user?.name }}</span>
        <button class="logout-btn" @click="handleLogout">Déconnexion</button>
      </div>
    </header>

    <main class="content">
      <div class="kicker">SAMPLING TEAM</div>
      <h1>Bonjour {{ auth.user?.name }} 👋</h1>
      <p class="placeholder">Votre espace Sampling arrive bientôt.</p>
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

.brand-name {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-md);
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
  margin-bottom: var(--space-4);
}

.placeholder {
  color: var(--color-gray-500);
  font-size: var(--font-size-md);
}
</style>