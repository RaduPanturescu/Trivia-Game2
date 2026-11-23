<script setup lang="ts">
/** Dashboard panel: save the program as a named plan, switch, rename or delete plans, and the share menu. */
import '../workout.css'
import { ref, useTemplateRef } from 'vue'
import SharePlanMenu from '../builder/SharePlanMenu.vue'
import { useSavedPlans } from '../builder/useSavedPlans'

const {
  savedPlans,
  selectedId,
  selectedPlan,
  saveCurrent,
  select,
  switchToSelected,
  renameSelected,
  deleteSelected,
} = useSavedPlans()

const planName = ref('')
const nameField = useTemplateRef<HTMLInputElement>('nameField')

/** Saves the typed name; keeps the text and focuses the field when the name is blank. */
function onSave(): void {
  if (saveCurrent(planName.value)) planName.value = ''
  else nameField.value?.focus()
}
</script>

<template>
  <details class="workout-panel saved-plans-panel collapsible-panel">
    <summary class="panel-header">
      <h3>Save or Switch Workout Plan</h3>
      <span
        class="collapse-indicator"
        aria-hidden="true"
      >⌄</span>
    </summary>
    <div class="collapsible-content">
      <div class="save-current-plan-controls">
        <label
          class="saved-plan-name-control"
          for="workout-plan-name-input"
        >
          <span>Save current plan as</span>
          <input
            id="workout-plan-name-input"
            ref="nameField"
            v-model="planName"
            type="text"
            placeholder="e.g. Strength Plan"
          >
        </label>
        <button
          class="mini-btn"
          type="button"
          @click="onSave"
        >
          Save Plan
        </button>
      </div>

      <div class="saved-plan-controls">
        <label
          class="saved-plan-select-control"
          for="workout-saved-plans-select"
        >
          <span>Saved plans</span>
          <select
            id="workout-saved-plans-select"
            v-model="selectedId"
          >
            <option value="">
              Choose a saved plan
            </option>
            <option
              v-for="plan in savedPlans"
              :key="plan.id"
              :value="plan.id"
            >
              {{ plan.name }}
            </option>
          </select>
        </label>
        <button
          class="mini-btn"
          type="button"
          :disabled="!selectedPlan"
          @click="switchToSelected"
        >
          Switch Plan
        </button>
        <button
          v-if="selectedPlan"
          class="mini-btn"
          type="button"
          @click="renameSelected"
        >
          Edit Plan Name
        </button>
        <button
          v-if="selectedPlan"
          class="mini-btn delete-plan-btn"
          type="button"
          @click="deleteSelected"
        >
          Delete Plan
        </button>
      </div>

      <SharePlanMenu @imported="select" />
    </div>
  </details>
</template>

<style scoped>
.save-current-plan-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 9px;
}

.saved-plan-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  max-width: 650px;
  gap: 9px;
  align-items: end;
  margin-top: 16px;
}

.saved-plan-name-control,
.saved-plan-select-control {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 700;
}

.saved-plan-name-control input,
.saved-plan-select-control select {
  width: 100%;
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.22);
  color: var(--text-main);
  font: inherit;
  font-weight: 400;
}

.saved-plan-select-control select option {
  background: #171a2c;
  color: #fff;
}

.mini-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.delete-plan-btn {
  border-color: rgba(231, 76, 60, 0.55);
  color: #ffaaaa;
}

.delete-plan-btn:hover {
  background: rgba(214, 48, 49, 0.22);
}

@media (max-width: 520px) {
  .saved-plan-controls {
    grid-template-columns: 1fr 1fr;
  }

  .saved-plan-select-control {
    grid-column: 1 / -1;
  }
}

@media (max-width: 420px) {
  .saved-plan-controls,
  .save-current-plan-controls {
    grid-template-columns: minmax(0, 1fr) auto;
  }
}
</style>
