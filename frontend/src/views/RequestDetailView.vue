<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRequestsStore } from '../stores/requests';
import { useAuthStore } from '../stores/auth';
import { ApiError } from '../services/api';
import { generateEmail } from '../services/requests';
import type { SamplingRequest, RequestStatus } from '../services/requests';
import StatusPipeline from '../components/StatusPipeline.vue';
import StatusBadge from '../components/StatusBadge.vue';
import BikePicker from '../components/BikePicker.vue';
import { useBikesStore } from '../stores/bikes';
import {
  listBikesForRequest,
  assignBikeToRequest,
  unassignBike,
  listAuditForRequest,
} from '../services/requests';
import type { BikeAssignment } from '../services/requests';
import {
  listChecklistForRequest,
  toggleChecklistItem,
} from '../services/requests';
import type { ChecklistItem } from '../services/requests';
import type { AuditLogEntry } from '../services/requests';

const auditEntries = ref<AuditLogEntry[]>([]);

const checklistItems = ref<ChecklistItem[]>([]);
const editingNoteFor = ref<string | null>(null);
const noteDraft = ref('');

const assignedBikes = ref<BikeAssignment[]>([]);
const showBikePicker = ref(false);
const assigningBike = ref(false);
const unassigningBikeSN = ref<string | null>(null);
const bikesStore = useBikesStore();

const route = useRoute();
const router = useRouter();
const requestsStore = useRequestsStore();
const auth = useAuthStore();

const requestId = route.params.id as string;

const request = ref<SamplingRequest | null>(null);
const loading = ref(true);
const errorMessage = ref('');

const pendingStatus = ref<RequestStatus | null>(null);
const pendingComment = ref('');
const submittingStatus = ref(false);

const generatedEmail = ref<{ subject: string; body: string } | null>(null);
const emailLoading = ref(false);
const emailCopied = ref(false);

const isSampling = computed(() => auth.user?.role === 'sampling_admin');

const legalNextStatuses = computed<RequestStatus[]>(() => {
  if (!request.value) return [];
  const status = request.value.status;
  const map: Record<RequestStatus, RequestStatus[]> = {
    'Draft': [],
    'À faire': ['En cours'],
    'En cours': ['À faire', 'Prêt à tester'],
    'Prêt à tester': ['En cours', 'Emballé'],
    'Emballé': ['Prêt à tester', 'Prêt à enlever'],
    'Prêt à enlever': ['Emballé', 'Expédié'],
    'Expédié': ['Prêt à enlever', 'Terminé'],
    'Terminé': [],
  };
  return map[status] || [];
});

function getRequesterName(r: SamplingRequest): string {
  if (typeof r.requester === 'string') return '—';
  return r.requester.name;
}

function getRequesterEmail(r: SamplingRequest): string {
  if (typeof r.requester === 'string') return '';
  return r.requester.email;
}

onMounted(async () => {
  try {
    request.value = await requestsStore.fetchOne(requestId);
    if (!request.value) {
      errorMessage.value = 'Demande introuvable';
      return;
    }
    // Marketing landed here directly via URL on a request that's still
    // theirs to edit — send them to the editable form instead.
    if (!isSampling.value && (
      request.value.status === 'Draft' ||
      request.value.status === 'À faire' ||
      request.value.status === 'En cours'
    )) {
      router.replace(`/requests/${requestId}/edit`);
      return;
    }
    if (auth.token) {
      assignedBikes.value = await listBikesForRequest(requestId, auth.token);
      if (request.value.status !== 'Draft' && request.value.status !== 'À faire') {
        checklistItems.value = await listChecklistForRequest(requestId, auth.token);
      }
      auditEntries.value = await listAuditForRequest(requestId, auth.token);
    }
    if (bikesStore.availability.length === 0) {
      await bikesStore.fetchAvailability();
    }
  } catch (err) {
    errorMessage.value = err instanceof ApiError ? err.message : 'Erreur de chargement';
  } finally {
    loading.value = false;
  }
});

function selectPendingStatus(status: RequestStatus) {
  pendingStatus.value = status;
  pendingComment.value = '';
}

function cancelPendingStatus() {
  pendingStatus.value = null;
  pendingComment.value = '';
}

async function confirmStatusChange() {
  if (!request.value || !pendingStatus.value || !pendingComment.value.trim()) return;
  submittingStatus.value = true;
  errorMessage.value = '';
  try {
    const updated = await requestsStore.changeRequestStatus(
      request.value._id,
      pendingStatus.value,
      pendingComment.value.trim()
    );
    if (updated) {
      request.value = updated;
      pendingStatus.value = null;
      pendingComment.value = '';
      if (
        auth.token &&
        updated.status !== 'Draft' &&
        updated.status !== 'À faire'
      ) {
        checklistItems.value = await listChecklistForRequest(request.value._id, auth.token);
      }
      if (auth.token) {
        auditEntries.value = await listAuditForRequest(request.value._id, auth.token);
      }
    }
  } catch (err) {
    errorMessage.value = err instanceof ApiError ? err.message : 'Erreur';
  } finally {
    submittingStatus.value = false;
  }
}

async function handleGenerateEmail() {
  if (!request.value || !auth.token) return;
  emailLoading.value = true;
  try {
    generatedEmail.value = await generateEmail(request.value._id, auth.token);
  } catch (err) {
    errorMessage.value = err instanceof ApiError ? err.message : 'Erreur';
  } finally {
    emailLoading.value = false;
  }
}

function copyEmailToClipboard() {
  if (!generatedEmail.value) return;
  const text = `${generatedEmail.value.subject}\n\n${generatedEmail.value.body}`;
  navigator.clipboard.writeText(text);
  emailCopied.value = true;
  setTimeout(() => { emailCopied.value = false; }, 2000);
}

async function handleAssignBike(sn: string) {
  if (!request.value || !auth.token) return;
  assigningBike.value = true;
  errorMessage.value = '';
  try {
    const assignment = await assignBikeToRequest(request.value._id, sn, auth.token);
    assignedBikes.value = [...assignedBikes.value, assignment];
    showBikePicker.value = false;
    await bikesStore.fetchAvailability();
    if (auth.token) {
      auditEntries.value = await listAuditForRequest(request.value._id, auth.token);
    }
  } catch (err) {
    errorMessage.value = err instanceof ApiError ? err.message : 'Erreur d\'assignation';
  } finally {
    assigningBike.value = false;
  }
}

async function handleUnassignBike(sn: string) {
  if (!request.value || !auth.token) return;
  const confirmed = confirm(`Retirer le vélo ${sn} de cette demande ?`);
  if (!confirmed) return;
  unassigningBikeSN.value = sn;
  try {
    await unassignBike(request.value._id, sn, auth.token);
    assignedBikes.value = assignedBikes.value.filter((b) => b.sn !== sn);
    await bikesStore.fetchAvailability();
    if (auth.token) {
      auditEntries.value = await listAuditForRequest(request.value._id, auth.token);
    }
  } catch (err) {
    errorMessage.value = err instanceof ApiError ? err.message : 'Erreur';
  } finally {
    unassigningBikeSN.value = null;
  }
}

const checklistByCategory = computed(() => {
  const groups: Record<string, ChecklistItem[]> = {};
  for (const item of checklistItems.value) {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  }
  for (const cat in groups) {
    groups[cat].sort((a, b) => a.order - b.order);
  }
  return groups;
});

const checklistProgress = computed(() => {
  const total = checklistItems.value.length;
  if (total === 0) return { checked: 0, total: 0, percentage: 0 };
  const checked = checklistItems.value.filter((i) => i.checked).length;
  return {
    checked,
    total,
    percentage: Math.round((checked / total) * 100),
  };
});

async function handleToggleItem(item: ChecklistItem) {
  if (!request.value || !auth.token || !isSampling.value) return;
  const newChecked = !item.checked;
  try {
    const updated = await toggleChecklistItem(
      request.value._id,
      item._id,
      newChecked,
      item.note,
      auth.token
    );
    const idx = checklistItems.value.findIndex((i) => i._id === item._id);
    if (idx !== -1) checklistItems.value[idx] = updated;
    if (auth.token) {
      auditEntries.value = await listAuditForRequest(request.value._id, auth.token);
    }
  } catch (err) {
    errorMessage.value = err instanceof ApiError ? err.message : 'Erreur';
  }
}

function startEditingNote(item: ChecklistItem) {
  editingNoteFor.value = item._id;
  noteDraft.value = item.note || '';
}

function cancelEditingNote() {
  editingNoteFor.value = null;
  noteDraft.value = '';
}

async function saveNote(item: ChecklistItem) {
  if (!request.value || !auth.token || !isSampling.value) return;
  try {
    const updated = await toggleChecklistItem(
      request.value._id,
      item._id,
      item.checked,
      noteDraft.value,
      auth.token
    );
    const idx = checklistItems.value.findIndex((i) => i._id === item._id);
    if (idx !== -1) checklistItems.value[idx] = updated;
    editingNoteFor.value = null;
    noteDraft.value = '';
    if (auth.token) {
      auditEntries.value = await listAuditForRequest(request.value._id, auth.token);
    }
  } catch (err) {
    errorMessage.value = err instanceof ApiError ? err.message : 'Erreur';
  }
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    'created': 'Brouillon créé',
    'submitted': 'Soumise',
    'status_changed': 'Statut modifié',
    'field_updated': 'Champ modifié',
    'bike_assigned': 'Vélo',
    'deleted': 'Supprimée',
  };
  return labels[action] || action;
}

function actionIcon(action: string): string {
  const icons: Record<string, string> = {
    'created': '📝',
    'submitted': '🚀',
    'status_changed': '🔄',
    'field_updated': '✏️',
    'bike_assigned': '🚲',
    'deleted': '🗑️',
  };
  return icons[action] || '•';
}

function getActorName(entry: AuditLogEntry): string {
  if (typeof entry.byUser === 'string') return '—';
  return entry.byUser.name;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function handleBack() {
  const dest = isSampling.value ? '/sampling' : '/marketing';
  router.push(dest);
}
</script>

<template>
  <div class="detail-page">
    <header class="topbar">
      <button class="back-btn" @click="handleBack">← Retour au dashboard</button>
    </header>

    <main class="content">
      <div v-if="loading" class="loading">Chargement...</div>
      <div v-else-if="errorMessage && !request" class="error-box">{{ errorMessage }}</div>

      <template v-else-if="request">
        <div class="page-header">
          <div class="header-top">
            <div>
              <div class="kicker">{{ request.projectType }} · {{ request.city }}</div>
              <h1>{{ request.projectName }}</h1>
              <p class="requester">
                Demandée par <strong>{{ getRequesterName(request) }}</strong>
                <span v-if="getRequesterEmail(request)"> · {{ getRequesterEmail(request) }}</span>
              </p>
            </div>
            <StatusBadge :status="request.status" />
          </div>
        </div>

        <StatusPipeline :current-status="request.status" />

        <section v-if="isSampling && legalNextStatuses.length > 0" class="form-section">
          <div class="section-header">Changer le statut</div>
          <div class="section-body">
            <div v-if="!pendingStatus" class="status-buttons">
              <button
                v-for="status in legalNextStatuses"
                :key="status"
                class="status-btn"
                @click="selectPendingStatus(status)"
              >
                → {{ status }}
              </button>
            </div>

            <div v-else class="pending-status">
              <p class="pending-info">
                Passer à <strong>{{ pendingStatus }}</strong> — un commentaire est obligatoire.
              </p>
              <textarea
                v-model="pendingComment"
                rows="3"
                placeholder="Ex: Vélos prêts, contrôle qualité effectué"
                class="comment-input"
              ></textarea>
              <div class="pending-actions">
                <button class="btn btn-secondary" @click="cancelPendingStatus">Annuler</button>
                <button
                  class="btn btn-primary"
                  :disabled="!pendingComment.trim() || submittingStatus"
                  @click="confirmStatusChange"
                >
                  {{ submittingStatus ? 'Envoi...' : 'Confirmer' }}
                </button>
              </div>
            </div>

            <div v-if="errorMessage" class="error-box">{{ errorMessage }}</div>
          </div>
        </section>

        <section class="form-section">
          <div class="section-header">Vélos assignés</div>
          <div class="section-body">
            <div class="bikes-header">
              <div class="bikes-count">
                {{ assignedBikes.length }} vélo{{ assignedBikes.length > 1 ? 's' : '' }} assigné{{ assignedBikes.length > 1 ? 's' : '' }}
              </div>
              <button
                v-if="isSampling && request.status !== 'Terminé'"
                class="btn btn-secondary btn-small"
                @click="showBikePicker = true"
              >
                + Assigner un vélo
              </button>
            </div>

            <div v-if="assignedBikes.length === 0" class="empty-state">
              Aucun vélo assigné pour le moment.
            </div>

            <div v-else class="assigned-list">
              <div v-for="bike in assignedBikes" :key="bike.sn" class="assigned-row">
                <div class="assigned-main">
                  <div class="assigned-sn">{{ bike.sn }}</div>
                  <div class="assigned-meta">
                    {{ bike.bikeModel }}
                    <span v-if="bike.fifteenControlUrl">
                      · <a :href="bike.fifteenControlUrl" target="_blank" rel="noopener">Fifteen Control ↗</a>
                    </span>
                  </div>
                </div>
                <button
                  v-if="isSampling && request.status !== 'Terminé'"
                  class="btn-icon-danger"
                  :disabled="unassigningBikeSN === bike.sn"
                  @click="handleUnassignBike(bike.sn)"
                  :title="`Retirer ${bike.sn}`"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </section>

        <BikePicker
          v-if="showBikePicker"
          :loading="assigningBike"
          @select="handleAssignBike"
          @cancel="showBikePicker = false"
        />

        <section
          v-if="checklistItems.length > 0"
          class="form-section"
        >
          <div class="section-header">Checklist Go/No-Go</div>
          <div class="section-body">
            <div class="progress-header">
              <div class="progress-label">
                {{ checklistProgress.checked }} / {{ checklistProgress.total }} vérifications
              </div>
              <div class="progress-percentage">{{ checklistProgress.percentage }}%</div>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${checklistProgress.percentage}%` }"
              ></div>
            </div>

            <div class="checklist-categories">
              <div
                v-for="(items, category) in checklistByCategory"
                :key="category"
                class="checklist-category"
              >
                <h3 class="category-title">{{ category }}</h3>
                <div class="checklist-items">
                  <div
                    v-for="item in items"
                    :key="item._id"
                    class="checklist-item"
                    :class="{ checked: item.checked }"
                  >
                    <label class="item-main">
                      <input
                        type="checkbox"
                        :checked="item.checked"
                        :disabled="!isSampling"
                        @change="handleToggleItem(item)"
                      />
                      <span class="item-label">{{ item.label }}</span>
                    </label>

                    <div class="item-actions" v-if="isSampling">
                      <button
                        v-if="editingNoteFor !== item._id"
                        class="note-btn"
                        @click="startEditingNote(item)"
                      >
                        {{ item.note ? '✎ Note' : '+ Note' }}
                      </button>
                    </div>

                    <div v-if="item.note && editingNoteFor !== item._id" class="item-note">
                      💬 {{ item.note }}
                    </div>

                    <div v-if="editingNoteFor === item._id" class="note-editor">
                      <textarea
                        v-model="noteDraft"
                        rows="2"
                        placeholder="Ajouter une note..."
                        class="note-input"
                      ></textarea>
                      <div class="note-actions">
                        <button class="btn btn-secondary btn-small" @click="cancelEditingNote">
                          Annuler
                        </button>
                        <button class="btn btn-primary btn-small" @click="saveNote(item)">
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          v-else-if="request.status !== 'Draft' && request.status !== 'À faire'"
          class="form-section"
        >
          <div class="section-header">Checklist Go/No-Go</div>
          <div class="section-body">
            <p class="placeholder">Aucun élément dans la checklist pour le moment.</p>
          </div>
        </section>

        <section v-if="isSampling" class="form-section">
          <div class="section-header">Email client</div>
          <div class="section-body">
            <p class="section-intro">
              Générez un email pré-rempli à envoyer au demandeur.
            </p>
            <button
              v-if="!generatedEmail"
              class="btn btn-secondary"
              :disabled="emailLoading"
              @click="handleGenerateEmail"
            >
              {{ emailLoading ? 'Génération...' : 'Générer l\'email' }}
            </button>

            <div v-else class="email-preview">
              <div class="email-line">
                <span class="email-label">Objet :</span>
                <span>{{ generatedEmail.subject }}</span>
              </div>
              <pre class="email-body">{{ generatedEmail.body }}</pre>
              <div class="email-actions">
                <button class="btn btn-secondary btn-small" @click="generatedEmail = null">
                  Fermer
                </button>
                <button class="btn btn-primary btn-small" @click="copyEmailToClipboard">
                  {{ emailCopied ? '✓ Copié' : 'Copier dans le presse-papier' }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section v-if="isSampling" class="form-section">
          <div class="section-header">Historique</div>
          <div class="section-body">
            <div v-if="auditEntries.length === 0" class="empty-state">
              Aucune activité pour le moment.
            </div>

            <div v-else class="audit-timeline">
              <div v-for="entry in auditEntries" :key="entry._id" class="audit-entry">
                <div class="audit-icon">{{ actionIcon(entry.action) }}</div>
                <div class="audit-content">
                  <div class="audit-line">
                    <span class="audit-action">{{ actionLabel(entry.action) }}</span>
                    <span class="audit-by">par {{ getActorName(entry) }}</span>
                    <span class="audit-time">· {{ formatTimestamp(entry.createdAt) }}</span>
                  </div>
                  <div v-if="entry.comment" class="audit-comment">"{{ entry.comment }}"</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>
<style scoped>
.detail-page {
  min-height: 100vh;
  background: var(--color-gray-100);
}

.topbar {
  background: var(--color-white);
  padding: var(--space-4) var(--space-8);
  border-bottom: 1px solid var(--color-gray-200);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  background: none;
  color: var(--color-gray-700);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.back-btn:hover {
  background: var(--color-gray-100);
}

.content {
  padding: var(--space-8) var(--space-6);
  max-width: 900px;
  margin: 0 auto;
}

.loading {
  padding: var(--space-10);
  text-align: center;
  color: var(--color-gray-500);
}

.error-box {
  padding: var(--space-4);
  background: #FEF2F2;
  color: var(--color-error);
  border-radius: var(--radius-md);
  margin-top: var(--space-4);
}

.page-header {
  margin-bottom: var(--space-6);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
}

.kicker {
  color: var(--color-pink);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.6px;
  margin-bottom: var(--space-2);
  text-transform: uppercase;
}

h1 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-dark);
  margin-bottom: var(--space-2);
}

.requester {
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
}

.form-section {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: 0;
  margin-top: var(--space-4);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.section-header {
  background: var(--color-pink);
  color: var(--color-white);
  padding: var(--space-4) var(--space-6);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  text-align: center;
  letter-spacing: 0.3px;
}

.section-body {
  padding: var(--space-6);
}

.placeholder {
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
  font-style: italic;
}

.section-intro {
  color: var(--color-gray-700);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-4);
}

.status-buttons {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.status-btn {
  padding: var(--space-3) var(--space-5);
  background: var(--color-pink-soft);
  color: var(--color-pink-dark);
  border: 1.5px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  transition: var(--transition-fast);
}

.status-btn:hover {
  background: var(--color-pink);
  color: var(--color-white);
}

.pending-status {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.pending-info {
  color: var(--color-dark);
  font-size: var(--font-size-sm);
  padding: var(--space-3);
  background: var(--color-pink-soft);
  border-radius: var(--radius-md);
}

.comment-input {
  padding: var(--space-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  resize: vertical;
  transition: var(--transition-fast);
}

.comment-input:focus {
  outline: none;
  border-color: var(--color-pink);
  box-shadow: 0 0 0 3px var(--color-pink-soft);
}

.pending-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

.btn {
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  transition: var(--transition-fast);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-pink);
  color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-pink-dark);
}

.btn-secondary {
  background: var(--color-white);
  color: var(--color-dark);
  border: 1px solid var(--color-gray-200);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-gray-100);
}

.btn-small {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-xs);
}

.email-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.email-line {
  display: flex;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.email-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-700);
}

.email-body {
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  background: var(--color-gray-100);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  white-space: pre-wrap;
  color: var(--color-dark);
  line-height: 1.5;
}

.email-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.bikes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.bikes-count {
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  font-weight: var(--font-weight-semibold);
}

.empty-state {
  padding: var(--space-6);
  text-align: center;
  color: var(--color-gray-500);
  background: var(--color-gray-100);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.assigned-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.assigned-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  background: var(--color-gray-100);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.assigned-row:hover {
  background: #EBEBEE;
}

.assigned-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.assigned-sn {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-dark);
}

.assigned-meta {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}

.assigned-meta a {
  color: var(--color-pink);
  text-decoration: none;
}

.assigned-meta a:hover {
  text-decoration: underline;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-3);
}

.progress-label {
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  font-weight: var(--font-weight-semibold);
}

.progress-percentage {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-pink);
}

.progress-bar {
  height: 8px;
  background: var(--color-gray-100);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-6);
}

.progress-fill {
  height: 100%;
  background: var(--color-pink);
  transition: width var(--transition-slow);
  border-radius: var(--radius-full);
}

.checklist-categories {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.checklist-category {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.category-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-pink);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-gray-200);
}

.checklist-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.checklist-item {
  padding: var(--space-3);
  background: var(--color-gray-100);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.checklist-item.checked {
  background: #F0FDF4;
}

.checklist-item:hover {
  background: #EBEBEE;
}

.checklist-item.checked:hover {
  background: #DCFCE7;
}

.item-main {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  flex: 1;
}

.item-main input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-pink);
  cursor: pointer;
  flex-shrink: 0;
}

.item-main input[type="checkbox"]:disabled {
  cursor: not-allowed;
}

.item-label {
  font-size: var(--font-size-sm);
  color: var(--color-dark);
  line-height: 1.4;
}

.checklist-item.checked .item-label {
  color: var(--color-gray-500);
  text-decoration: line-through;
}

.item-actions {
  display: flex;
  justify-content: flex-end;
}

.note-btn {
  padding: var(--space-1) var(--space-3);
  background: transparent;
  color: var(--color-gray-500);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  transition: var(--transition-fast);
}

.note-btn:hover {
  background: var(--color-white);
  color: var(--color-pink);
  border-color: var(--color-pink);
}

.item-note {
  font-size: var(--font-size-xs);
  color: var(--color-gray-700);
  padding: var(--space-2) var(--space-3);
  background: var(--color-white);
  border-radius: var(--radius-sm);
  font-style: italic;
}

.note-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.note-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-family: var(--font-family);
  resize: vertical;
  min-height: 60px;
  transition: var(--transition-fast);
}

.note-input:focus {
  outline: none;
  border-color: var(--color-pink);
  box-shadow: 0 0 0 3px var(--color-pink-soft);
}

.note-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
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
  background: #FEE2E2;
  color: var(--color-error);
}

.audit-timeline {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  position: relative;
}

.audit-entry {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
  position: relative;
}

.audit-entry:hover {
  background: var(--color-gray-100);
}

.audit-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-pink-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-md);
}

.audit-content {
  flex: 1;
  min-width: 0;
}

.audit-line {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.audit-action {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-dark);
}

.audit-by {
  font-size: var(--font-size-xs);
  color: var(--color-gray-700);
}

.audit-time {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
}

.audit-comment {
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  font-style: italic;
  margin-top: var(--space-1);
  padding-left: var(--space-3);
  border-left: 2px solid var(--color-gray-200);
}
</style>