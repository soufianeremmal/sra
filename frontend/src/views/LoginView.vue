<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { ApiError } from '../services/api';

const email = ref('marketing@fifteen.eu');
const password = ref('marketing123');
const loading = ref(false);
const errorMessage = ref('');

const auth = useAuthStore();
const router = useRouter();

async function handleSubmit() {
  errorMessage.value = '';
  loading.value = true;

  try {
    await auth.login(email.value, password.value);
    router.push(auth.isSampling ? '/sampling' : '/marketing');
  } catch (err) {
    if (err instanceof ApiError) {
      errorMessage.value = err.message;
    } else {
      errorMessage.value = 'Something went wrong. Please try again.';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-panel">
      <div class="brand">
        <div class="brand-mark">SRA</div>
      </div>

      <h1 class="title">Sampling Request Application</h1>
      <p class="subtitle">Accédez à votre espace Fifteen</p>

      <form @submit.prevent="handleSubmit" class="form">
        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="prenom.nom@fifteen.eu"
            required
            :disabled="loading"
          />
        </div>

        <div class="field">
          <label for="password">Mot de passe</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            :disabled="loading"
          />
        </div>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-gray-100) 0%, #EAEAEC 100%);
  padding: var(--space-6);
}

.login-panel {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  padding: var(--space-12) var(--space-10);
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-lg);
}

.brand {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-6);
}

.brand-mark {
  width: 72px;
  height: 56px;
  border-radius: var(--radius-md);
  background: var(--color-pink);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: var(--font-weight-bold);
  letter-spacing: 1px;
}

.title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  text-align: center;
  color: var(--color-dark);
  margin-bottom: var(--space-2);
}

.subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  text-align: center;
  margin-bottom: var(--space-8);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-700);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.field input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: var(--transition-fast);
}

.field input:focus {
  border-color: var(--color-pink);
  box-shadow: 0 0 0 3px var(--color-pink-soft);
}

.field input:disabled {
  background: var(--color-gray-100);
  color: var(--color-gray-500);
}

.error {
  font-size: var(--font-size-sm);
  color: var(--color-error);
  padding: var(--space-3);
  background: #FEF2F2;
  border-radius: var(--radius-md);
}

.submit-btn {
  margin-top: var(--space-3);
  padding: var(--space-4);
  background: var(--color-pink);
  color: var(--color-white);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  transition: var(--transition-fast);
}

.submit-btn:hover:not(:disabled) {
  background: var(--color-pink-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>