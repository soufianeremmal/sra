<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRequestsStore } from '../stores/requests';
import { useAuthStore } from '../stores/auth';
import { ApiError } from '../services/api';
import { debounce } from '../utils/debounce';
import type { SamplingRequest, UpdateRequestInput, RequestType } from '../services/requests';

const route = useRoute();
const router = useRouter();
const requestsStore = useRequestsStore();
const auth = useAuthStore();

const requestId = route.params.id as string;

const draft = ref<SamplingRequest | null>(null);
const loading = ref(true);
const errorMessage = ref('');
const savingStatus = ref<'idle' | 'saving' | 'error'>('idle');
const submitting = ref(false);

const projectTypes: RequestType[] = ['Sample', 'Démo', 'Salon', 'AO'];

const isApplyingServerUpdate = ref(false);

const stationEquipmentTypes = [
  'e-Dock',
  'Maintenance dock',
  'Totem',
  'Weight plate',
  'Guiding band',
  'Stickers',
] as const;

const showStationSection = computed(() => {
  return draft.value?.projectType === 'Salon' || draft.value?.projectType === 'AO';
});

const isEditable = computed(() => {
  if (!draft.value) return false;
  return draft.value.status === 'Draft' || draft.value.status === 'À faire' || draft.value.status === 'En cours';
});

const canSubmit = computed(() => {
  return draft.value?.status === 'Draft';
});

const canDelete = computed(() => {
  return draft.value?.status === 'Draft' && auth.user?.id === (
    typeof draft.value.requester === 'string'
      ? draft.value.requester
      : draft.value.requester._id
  );
});

onMounted(async () => {
  try {
    draft.value = await requestsStore.fetchOne(requestId);
    if (!draft.value) {
      errorMessage.value = 'Request not found';
      return;
    }
    // Marketing landed here directly via URL on a request that's moved past
    // what they can edit — send them to the read-only detail page instead.
    if (auth.user?.role === 'marketing' && !isEditable.value) {
      router.replace(`/requests/${requestId}`);
      return;
    }
  } catch (err) {
    errorMessage.value = err instanceof ApiError ? err.message : 'Failed to load request';
  } finally {
    loading.value = false;
  }
});

const debouncedSave = debounce(async (payload: UpdateRequestInput) => {
  if (!draft.value || !isEditable.value) return;
  savingStatus.value = 'saving';
  try {
    const updated = await requestsStore.updateFields(draft.value._id, payload);
    if (updated) {
      isApplyingServerUpdate.value = true;
      draft.value = updated;
      savingStatus.value = 'idle';
      // Reset the flag on the next tick so future user edits still trigger saves
      setTimeout(() => { isApplyingServerUpdate.value = false; }, 0);
    }
  } catch (err) {
    savingStatus.value = 'error';
    errorMessage.value = err instanceof ApiError ? err.message : 'Save failed';
  }
}, 800);
watch(
  draft,
  (newVal) => {
    if (!newVal || !isEditable.value) return;
    if (isApplyingServerUpdate.value) return;  // ← skip if this change came from a save response
    debouncedSave({
      projectName: newVal.projectName,
      city: newVal.city,
      projectType: newVal.projectType,
      logistics: newVal.logistics,
      bikes: newVal.bikes,
      station: newVal.station,
      accessories: newVal.accessories,
      comment: newVal.comment,
    });
  },
  { deep: true }
);

// ---- Bike helpers ----
function addBikeLine() {
  if (!draft.value || !isEditable.value) return;
  const currentBikes = draft.value.bikes || [];
  draft.value.bikes = [
    ...currentBikes,
    {
      bikeType: 'Fusion 2',
      stickersType: 'Standard',
      luggageRack: false,
      heavyLock: false,
      lockTo: 'Frame',
    },
  ];
}

function duplicateBikeLine(index: number) {
  if (!draft.value || !isEditable.value) return;
  const currentBikes = [...(draft.value.bikes || [])];
  const original = currentBikes[index];
  if (!original) return;
  currentBikes.splice(index + 1, 0, { ...original });
  draft.value.bikes = currentBikes;
}

function removeBikeLine(index: number) {
  if (!draft.value || !isEditable.value) return;
  const currentBikes = [...(draft.value.bikes || [])];
  currentBikes.splice(index, 1);
  draft.value.bikes = currentBikes;
}

function updateBikeField(index: number, field: string, value: string | boolean) {
  if (!draft.value || !isEditable.value) return;
  const currentBikes = [...(draft.value.bikes || [])];
  if (!currentBikes[index]) return;
  currentBikes[index] = { ...currentBikes[index], [field]: value };
  draft.value.bikes = currentBikes;
}

// ---- Station equipment helpers ----
function addStationEquipment() {
  if (!draft.value || !isEditable.value) return;
  const current = draft.value.station?.equipment || [];
  draft.value.station = {
    ...draft.value.station,
    stationNeeded: true,
    equipment: [
      ...current,
      { type: 'e-Dock', quantity: 1, needsCharging: false },
    ],
  };
}

function duplicateStationEquipment(index: number) {
  if (!draft.value || !isEditable.value) return;
  const current = [...(draft.value.station?.equipment || [])];
  const original = current[index];
  if (!original) return;
  current.splice(index + 1, 0, { ...original });
  draft.value.station = { ...draft.value.station, stationNeeded: true, equipment: current };
}

function removeStationEquipment(index: number) {
  if (!draft.value || !isEditable.value) return;
  const current = [...(draft.value.station?.equipment || [])];
  current.splice(index, 1);
  draft.value.station = { ...draft.value.station, stationNeeded: true, equipment: current };
}

function updateStationEquipmentField(index: number, field: string, value: string | number | boolean) {
  if (!draft.value || !isEditable.value) return;
  const current = [...(draft.value.station?.equipment || [])];
  if (!current[index]) return;
  current[index] = { ...current[index], [field]: value };
  draft.value.station = { ...draft.value.station, stationNeeded: true, equipment: current };
}

// ---- Actions ----
async function handleSubmit() {
  if (!draft.value || !canSubmit.value) return;
  submitting.value = true;
  errorMessage.value = '';
  try {
    const submitted = await requestsStore.submitDraft(draft.value._id, 'Submitted from form');
    if (submitted) {
      router.push('/marketing');
    }
  } catch (err) {
    errorMessage.value = err instanceof ApiError ? err.message : 'Submit failed';
  } finally {
    submitting.value = false;
  }
}

async function handleDelete() {
  if (!draft.value || !canDelete.value) return;
  const confirmed = confirm('Supprimer définitivement ce brouillon ?');
  if (!confirmed) return;
  try {
    await requestsStore.removeRequest(draft.value._id);
    router.push('/marketing');
  } catch (err) {
    errorMessage.value = err instanceof ApiError ? err.message : 'Delete failed';
  }
}

function handleBack() {
  router.push('/marketing');
}
</script>

<template>
  <div class="edit-page">
    <header class="topbar">
      <button class="back-btn" @click="handleBack">← Retour au dashboard</button>
    </header>

    <main class="content">
      <div v-if="loading" class="loading">Chargement...</div>
      <div v-else-if="errorMessage && !draft" class="error-box">{{ errorMessage }}</div>

      <template v-else-if="draft">
        <div class="page-header">
          <div class="kicker">{{ draft.status === 'Draft' ? 'BROUILLON' : draft.status }}</div>
          <h1>{{ draft.projectName || 'Sans titre' }}</h1>
        </div>

        <div class="type-selector">
          <button
            v-for="type in projectTypes"
            :key="type"
            class="type-btn"
            :class="{ selected: draft.projectType === type }"
            :disabled="!isEditable"
            @click="draft!.projectType = type"
          >
            {{ type }}
          </button>
        </div>

        <!-- General -->
        <section class="form-section">
          <div class="section-header">Informations générales</div>
          <div class="section-body">
            <div class="field-row">
              <div class="field">
                <label>Nom du projet</label>
                <input v-model="draft.projectName" :disabled="!isEditable" placeholder="Ex: AO TPER Bologna" />
              </div>
              <div class="field">
                <label>Ville</label>
                <input v-model="draft.city" :disabled="!isEditable" placeholder="Ex: Bologna" />
              </div>
            </div>
          </div>
        </section>

        <!-- Logistics -->
        <section class="form-section">
          <div class="section-header">Logistique</div>
          <div class="section-body">
            <div class="field">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  :checked="draft.logistics?.deliverByRequester || false"
                  :disabled="!isEditable"
                  @change="draft.logistics = { ...draft.logistics, deliverByRequester: ($event.target as HTMLInputElement).checked }"
                />
                Je livre les vélos moi-même
              </label>
            </div>
            <div class="field-row">
              <div class="field">
                <label>Nom de l'entreprise</label>
                <input
                  :value="draft.logistics?.companyName || ''"
                  :disabled="!isEditable"
                  @input="draft.logistics = { ...draft.logistics, companyName: ($event.target as HTMLInputElement).value }"
                />
              </div>
              <div class="field">
                <label>Contact livraison</label>
                <input
                  :value="draft.logistics?.deliveryContactName || ''"
                  :disabled="!isEditable"
                  @input="draft.logistics = { ...draft.logistics, deliveryContactName: ($event.target as HTMLInputElement).value }"
                />
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label>Téléphone</label>
                <input
                  :value="draft.logistics?.deliveryContactPhone || ''"
                  :disabled="!isEditable"
                  @input="draft.logistics = { ...draft.logistics, deliveryContactPhone: ($event.target as HTMLInputElement).value }"
                />
              </div>
              <div class="field">
                <label>Adresse de livraison</label>
                <input
                  :value="draft.logistics?.deliveryAddress || ''"
                  :disabled="!isEditable"
                  @input="draft.logistics = { ...draft.logistics, deliveryAddress: ($event.target as HTMLInputElement).value }"
                  placeholder="Adresse complète"
                />
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label>Date de livraison</label>
                <input
                  type="date"
                  :value="draft.logistics?.deliveryLatestDate?.slice(0, 10) || ''"
                  :disabled="!isEditable"
                  @change="draft.logistics = { ...draft.logistics, deliveryLatestDate: ($event.target as HTMLInputElement).value }"
                />
              </div>
              <div class="field">
                <label>Date de retour</label>
                <input
                  type="date"
                  :value="draft.logistics?.returnDate?.slice(0, 10) || ''"
                  :disabled="!isEditable"
                  @change="draft.logistics = { ...draft.logistics, returnDate: ($event.target as HTMLInputElement).value }"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Bikes -->
        <section class="form-section">
          <div class="section-header">Vélos demandés</div>
          <div class="section-body">
            <div class="bikes-header">
              <div class="bikes-count">
                {{ (draft.bikes?.length || 0) }} vélo{{ (draft.bikes?.length || 0) > 1 ? 's' : '' }}
              </div>
              <button
                v-if="isEditable"
                class="btn btn-secondary btn-small"
                @click="addBikeLine"
              >
                + Ajouter un vélo
              </button>
            </div>

            <div v-if="(draft.bikes?.length || 0) === 0" class="empty-bikes">
              Aucun vélo ajouté pour le moment.
              <span v-if="isEditable">Cliquez sur "Ajouter un vélo" pour commencer.</span>
            </div>

            <div v-else class="bikes-list">
              <div
                v-for="(bike, index) in draft.bikes"
                :key="index"
                class="bike-row"
              >
                <div class="bike-row-header">
                  <span class="bike-index">Vélo {{ index + 1 }}</span>
                  <div class="bike-row-actions" v-if="isEditable">
                    <button
                      class="btn-icon-secondary"
                      @click="duplicateBikeLine(index)"
                      title="Dupliquer ce vélo"
                    >
                      + Dupliquer
                    </button>
                    <button
                      class="btn-icon-danger"
                      @click="removeBikeLine(index)"
                      title="Supprimer ce vélo"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div class="bike-row-grid">
                  <div class="field">
                    <label>Modèle</label>
                    <select
                      :value="bike.bikeType"
                      :disabled="!isEditable"
                      @change="updateBikeField(index, 'bikeType', ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="Fusion 1">Fusion 1</option>
                      <option value="Fusion 1.5">Fusion 1.5</option>
                      <option value="Fusion 2">Fusion 2</option>
                    </select>
                  </div>

                  <div class="field">
                    <label>Type de stickers</label>
                    <select
                      :value="bike.stickersType"
                      :disabled="!isEditable"
                      @change="updateBikeField(index, 'stickersType', ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Custom">Custom</option>
                      <option value="None">Aucun</option>
                    </select>
                  </div>

                  <div class="field">
                    <label>Antivol</label>
                    <select
                      :value="bike.lockTo"
                      :disabled="!isEditable"
                      @change="updateBikeField(index, 'lockTo', ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="Frame">Cadre</option>
                      <option value="Front wheel">Roue avant</option>
                      <option value="Both">Les deux</option>
                    </select>
                  </div>
                </div>

                <div class="bike-row-toggles">
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :checked="bike.luggageRack"
                      :disabled="!isEditable"
                      @change="updateBikeField(index, 'luggageRack', ($event.target as HTMLInputElement).checked)"
                    />
                    Porte-bagages
                  </label>
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :checked="bike.heavyLock"
                      :disabled="!isEditable"
                      @change="updateBikeField(index, 'heavyLock', ($event.target as HTMLInputElement).checked)"
                    />
                    Antivol lourd
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Station (only for Salon or AO) -->
        <section v-if="showStationSection" class="form-section">
          <div class="section-header">Station et équipements</div>
          <div class="section-body">
            <div class="bikes-header">
              <div class="bikes-count">
                {{ (draft.station?.equipment?.length || 0) }} équipement{{ (draft.station?.equipment?.length || 0) > 1 ? 's' : '' }}
              </div>
              <button
                v-if="isEditable"
                class="btn btn-secondary btn-small"
                @click="addStationEquipment"
              >
                + Ajouter un équipement
              </button>
            </div>

            <div v-if="(draft.station?.equipment?.length || 0) === 0" class="empty-bikes">
              Aucun équipement pour le moment.
              <span v-if="isEditable">Cliquez sur "Ajouter un équipement" pour commencer.</span>
            </div>

            <div v-else class="bikes-list">
              <div
                v-for="(item, index) in draft.station?.equipment"
                :key="index"
                class="bike-row"
              >
                <div class="bike-row-header">
                  <span class="bike-index">Équipement {{ index + 1 }}</span>
                  <div class="bike-row-actions" v-if="isEditable">
                    <button
                      class="btn-icon-secondary"
                      @click="duplicateStationEquipment(index)"
                      title="Dupliquer cet équipement"
                    >
                      + Dupliquer
                    </button>
                    <button
                      class="btn-icon-danger"
                      @click="removeStationEquipment(index)"
                      title="Supprimer cet équipement"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div class="bike-row-grid" style="grid-template-columns: 2fr 1fr;">
                  <div class="field">
                    <label>Type d'équipement</label>
                    <select
                      :value="item.type"
                      :disabled="!isEditable"
                      @change="updateStationEquipmentField(index, 'type', ($event.target as HTMLSelectElement).value)"
                    >
                      <option v-for="t in stationEquipmentTypes" :key="t" :value="t">{{ t }}</option>
                    </select>
                  </div>
                  <div class="field">
                    <label>Quantité</label>
                    <input
                      type="number"
                      min="0"
                      :value="item.quantity"
                      :disabled="!isEditable"
                      @input="updateStationEquipmentField(index, 'quantity', Number(($event.target as HTMLInputElement).value))"
                    />
                  </div>
                </div>

                <div v-if="item.type === 'e-Dock'" class="bike-row-toggles">
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :checked="item.needsCharging || false"
                      :disabled="!isEditable"
                      @change="updateStationEquipmentField(index, 'needsCharging', ($event.target as HTMLInputElement).checked)"
                    />
                    Charge nécessaire
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Accessories -->
        <section class="form-section">
          <div class="section-header">Accessoires</div>
          <div class="section-body">
            <div class="field-row">
              <div class="field">
                <label>Téléphones</label>
                <input
                  type="number"
                  min="0"
                  :value="draft.accessories?.phone ?? 0"
                  :disabled="!isEditable"
                  @input="draft.accessories = { ...draft.accessories, phone: Number(($event.target as HTMLInputElement).value) }"
                />
              </div>
              <div class="field">
                <label>Chargeurs batterie</label>
                <input
                  type="number"
                  min="0"
                  :value="draft.accessories?.batteryCharger ?? 0"
                  :disabled="!isEditable"
                  @input="draft.accessories = { ...draft.accessories, batteryCharger: Number(($event.target as HTMLInputElement).value) }"
                />
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label>Batteries supplémentaires</label>
                <input
                  type="number"
                  min="0"
                  :value="draft.accessories?.additionalBattery ?? 0"
                  :disabled="!isEditable"
                  @input="draft.accessories = { ...draft.accessories, additionalBattery: Number(($event.target as HTMLInputElement).value) }"
                />
              </div>
              <div class="field">
                <label>Cartes RFID</label>
                <input
                  type="number"
                  min="0"
                  :value="draft.accessories?.rfidCard ?? 0"
                  :disabled="!isEditable"
                  @input="draft.accessories = { ...draft.accessories, rfidCard: Number(($event.target as HTMLInputElement).value) }"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Comment -->
        <section class="form-section">
          <div class="section-header">Commentaire</div>
          <div class="section-body">
            <div class="field">
              <label>Notes / spécifications client</label>
              <textarea
                :value="draft.comment || ''"
                :disabled="!isEditable"
                rows="4"
                @input="draft.comment = ($event.target as HTMLTextAreaElement).value"
                placeholder="Contraintes spécifiques, cahier des charges, etc."
              ></textarea>
            </div>
          </div>
        </section>

        <div v-if="errorMessage" class="error-box">{{ errorMessage }}</div>

        <div class="actions">
          <button v-if="canDelete" class="btn btn-danger" @click="handleDelete">
            Supprimer
          </button>
          <div class="actions-right">
            <button class="btn btn-secondary" @click="handleBack">
              Enregistrer et fermer
            </button>
            <button
              v-if="canSubmit"
              class="btn btn-primary"
              :disabled="submitting"
              @click="handleSubmit"
            >
              {{ submitting ? 'Envoi...' : 'Soumettre la demande' }}
            </button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.edit-page {
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

.save-badge {
  font-size: var(--font-size-xs);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-semibold);
}

.save-badge.saving {
  background: #FEF3C7;
  color: #92400E;
}

.save-badge.error {
  background: #FEE2E2;
  color: #991B1B;
}

.content {
  padding: var(--space-8) var(--space-6);
  max-width: 820px;
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
  margin-bottom: var(--space-4);
}

.page-header {
  margin-bottom: var(--space-6);
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

.type-selector {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.type-btn {
  flex: 1;
  padding: var(--space-4);
  background: var(--color-white);
  border: 1.5px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
  transition: var(--transition-fast);
}

.type-btn.selected {
  background: var(--color-pink-soft);
  border-color: var(--color-pink);
  color: var(--color-pink-dark);
}

.type-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-section {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: 0;
  margin-bottom: var(--space-4);
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

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.field-row:last-child {
  margin-bottom: 0;
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

.field input,
.field select,
.field textarea {
  padding: var(--space-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  transition: var(--transition-fast);
  background: var(--color-white);
}

.field textarea {
  resize: vertical;
  min-height: 90px;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--color-pink);
  box-shadow: 0 0 0 3px var(--color-pink-soft);
}

.field input:disabled,
.field select:disabled,
.field textarea:disabled {
  background: var(--color-gray-100);
  color: var(--color-gray-500);
  cursor: not-allowed;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-transform: none !important;
  letter-spacing: normal !important;
  font-size: var(--font-size-sm) !important;
  font-weight: var(--font-weight-medium) !important;
  color: var(--color-dark) !important;
  cursor: pointer;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-pink);
  cursor: pointer;
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

.btn-small {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
}

.empty-bikes {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-gray-500);
  background: var(--color-gray-100);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.bikes-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.bike-row {
  padding: var(--space-4);
  background: var(--color-gray-100);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.bike-row:hover {
  background: #EBEBEE;
}

.bike-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.bike-index {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-pink);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.bike-row-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.btn-icon-secondary {
  padding: var(--space-1) var(--space-3);
  background: var(--color-white);
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  transition: var(--transition-fast);
}

.btn-icon-secondary:hover {
  background: var(--color-pink-soft);
  color: var(--color-pink-dark);
  border-color: var(--color-pink);
}

.btn-icon-danger {
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  color: var(--color-gray-500);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.btn-icon-danger:hover {
  background: #FEE2E2;
  color: var(--color-error);
}

.bike-row-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.bike-row-toggles {
  display: flex;
  gap: var(--space-6);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-gray-200);
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-4);
  padding-bottom: var(--space-10);
}

.actions-right {
  display: flex;
  gap: var(--space-3);
  margin-left: auto;
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
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: var(--color-white);
  color: var(--color-dark);
  border: 1px solid var(--color-gray-200);
}

.btn-secondary:hover {
  background: var(--color-gray-100);
}

.btn-danger {
  background: transparent;
  color: var(--color-error);
}

.btn-danger:hover {
  background: #FEF2F2;
}
</style>