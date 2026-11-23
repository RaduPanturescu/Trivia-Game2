<script setup lang="ts">
/** Modal form to create an exercise, edit a library exercise, or edit one exercise of the selected day. */
import { AppModal } from '@/shared/components'
import { EDITOR_BOUNDS } from './editor'
import { useExerciseEditor } from './useExerciseEditor'

const {
  isOpen,
  mode,
  draft,
  newCategory,
  copy,
  categoryOptions,
  close,
  save,
  addCategory,
  setField,
  toggleOption,
  stepField,
  snapField,
  slideField,
  sliderValue,
} = useExerciseEditor()

const bounds = EDITOR_BOUNDS
</script>

<template>
  <AppModal
    :open="isOpen"
    :title="copy.title"
    panel-class="workout-exercise-modal-window"
    @close="close"
  >
    <div
      class="exercise-editor"
      :class="{ 'is-existing-edit': mode !== 'new', 'is-day-edit': mode === 'day' }"
    >
      <p class="editor-description">
        {{ copy.description }}
      </p>

      <div
        v-if="mode === 'new'"
        class="category-create-row"
      >
        <div class="editor-field">
          <label for="workout-new-category-input">Create a category</label>
          <div class="category-input-control">
            <input
              id="workout-new-category-input"
              v-model="newCategory"
              type="text"
              placeholder="e.g. Mobility"
              @keydown.enter="addCategory"
            >
            <button
              id="workout-add-category-btn"
              class="mini-btn"
              type="button"
              @click="addCategory"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div class="editor-grid">
        <div
          v-if="mode !== 'day'"
          class="editor-field exercise-name-field"
        >
          <label for="workout-exercise-name">Exercise name</label>
          <input
            id="workout-exercise-name"
            v-model="draft.name"
            type="text"
            placeholder="e.g. Goblet squat"
            required
          >
        </div>

        <div
          v-if="mode === 'new'"
          class="editor-field exercise-category-field"
        >
          <label for="workout-exercise-category">Category</label>
          <select
            id="workout-exercise-category"
            v-model="draft.category"
            class="category-select"
            aria-label="Exercise category"
          >
            <option value="">
              Select a category
            </option>
            <option
              v-for="option in categoryOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <div
          v-if="mode === 'new'"
          class="editor-field description-editor-field"
        >
          <label for="workout-exercise-description">Description</label>
          <input
            id="workout-exercise-description"
            v-model="draft.description"
            type="text"
            placeholder="How to perform it or a reminder"
          >
        </div>

        <div class="editor-field exercise-sets-field">
          <label for="workout-exercise-sets">Sets</label>
          <div class="exercise-number-control">
            <span class="exercise-number-input-wrap">
              <input
                id="workout-exercise-sets"
                :value="draft.sets"
                type="number"
                :min="bounds.sets.min"
                :max="bounds.sets.max"
                placeholder="e.g. 3"
                required
                @input="setField('sets', $event)"
              >
              <span class="exercise-number-steppers">
                <button
                  type="button"
                  class="exercise-number-adjust"
                  aria-label="Increase sets"
                  @click="stepField('sets', 1)"
                >
                  ⌃
                </button>
                <button
                  type="button"
                  class="exercise-number-adjust"
                  aria-label="Decrease sets"
                  @click="stepField('sets', -1)"
                >
                  ⌄
                </button>
              </span>
            </span>
          </div>
        </div>

        <div class="editor-field exercise-reps-field">
          <label for="workout-exercise-reps">Reps</label>
          <div class="exercise-number-control">
            <span class="exercise-number-input-wrap">
              <input
                id="workout-exercise-reps"
                class="has-option"
                :value="draft.reps"
                type="number"
                :min="bounds.reps.min"
                :max="bounds.reps.max"
                :disabled="draft.repsTillFailure"
                placeholder="e.g. 10"
                required
                @input="setField('reps', $event)"
              >
              <button
                type="button"
                class="exercise-option-btn option-till-failure"
                :class="{ active: draft.repsTillFailure }"
                :aria-pressed="draft.repsTillFailure"
                @click="toggleOption('reps')"
              >
                'Till Failure
              </button>
              <span class="exercise-number-steppers">
                <button
                  type="button"
                  class="exercise-number-adjust"
                  :disabled="draft.repsTillFailure"
                  aria-label="Increase reps"
                  @click="stepField('reps', 1)"
                >
                  ⌃
                </button>
                <button
                  type="button"
                  class="exercise-number-adjust"
                  :disabled="draft.repsTillFailure"
                  aria-label="Decrease reps"
                  @click="stepField('reps', -1)"
                >
                  ⌄
                </button>
              </span>
            </span>
          </div>
        </div>

        <div class="editor-field exercise-weight-field">
          <label for="workout-exercise-weight">Weight (kg)</label>
          <div class="exercise-number-control">
            <span class="exercise-number-input-wrap">
              <input
                id="workout-exercise-weight"
                class="has-option"
                :value="draft.weight"
                type="number"
                :min="bounds.weight.min"
                :max="bounds.weight.max"
                :disabled="draft.bodyWeight"
                placeholder="Optional"
                @input="setField('weight', $event)"
              >
              <button
                type="button"
                class="exercise-option-btn option-bodyweight"
                :class="{ active: draft.bodyWeight }"
                :aria-pressed="draft.bodyWeight"
                @click="toggleOption('weight')"
              >
                Body Weight
              </button>
              <span class="exercise-number-steppers">
                <button
                  type="button"
                  class="exercise-number-adjust"
                  :disabled="draft.bodyWeight"
                  aria-label="Increase weight"
                  @click="stepField('weight', 1)"
                >
                  ⌃
                </button>
                <button
                  type="button"
                  class="exercise-number-adjust"
                  :disabled="draft.bodyWeight"
                  aria-label="Decrease weight"
                  @click="stepField('weight', -1)"
                >
                  ⌄
                </button>
              </span>
            </span>
          </div>
        </div>

        <div class="editor-field exercise-rest-field">
          <label for="workout-exercise-rest">Rest Timer</label>
          <div class="exercise-duration-readout">
            <input
              id="workout-exercise-rest"
              :value="draft.rest"
              type="number"
              :min="bounds.rest.min"
              :max="bounds.rest.max"
              :step="bounds.rest.step"
              required
              @input="setField('rest', $event)"
              @change="snapField('rest')"
            >
          </div>
          <input
            id="workout-exercise-rest-slider"
            class="exercise-duration-slider"
            type="range"
            :min="bounds.rest.min"
            :max="bounds.rest.max"
            :step="bounds.rest.step"
            :value="sliderValue('rest')"
            aria-label="Rest timer in 15-second increments"
            @input="slideField('rest', $event)"
          >
          <output
            class="exercise-duration-value"
            for="workout-exercise-rest"
          >{{ sliderValue('rest') }} sec</output>
        </div>

        <div class="editor-field exercise-duration-field">
          <label for="workout-exercise-duration">Set Timer</label>
          <div class="exercise-duration-readout">
            <input
              id="workout-exercise-duration"
              :value="draft.duration"
              type="number"
              :min="bounds.duration.min"
              :max="bounds.duration.max"
              :step="bounds.duration.step"
              required
              @input="setField('duration', $event)"
              @change="snapField('duration')"
            >
          </div>
          <input
            id="workout-exercise-duration-slider"
            class="exercise-duration-slider"
            type="range"
            :min="bounds.duration.min"
            :max="bounds.duration.max"
            :step="bounds.duration.step"
            :value="sliderValue('duration')"
            aria-label="Set timer in 15-second increments"
            @input="slideField('duration', $event)"
          >
          <output
            class="exercise-duration-value"
            for="workout-exercise-duration"
          >{{ sliderValue('duration') }} sec</output>
        </div>
      </div>

      <div class="exercise-editor-actions">
        <button
          class="save-exercise-btn"
          type="button"
          @click="save"
        >
          {{ copy.saveLabel }}
        </button>
        <button
          class="secondary-btn"
          type="button"
          @click="close"
        >
          Cancel
        </button>
      </div>
    </div>
  </AppModal>
</template>

<style scoped>
/* The modal panel is AppModal's; these overrides restyle it as the legacy exercise window. */
:global(.modal-overlay .modal-panel.workout-exercise-modal-window) {
  width: min(680px, 100%);
  max-height: min(88vh, 820px);
  padding: 22px;
  border: 1px solid rgba(0, 206, 201, 0.3);
  border-radius: 22px;
  background: linear-gradient(145deg, #171a2c, #0e1120);
  box-shadow: 0 26px 80px rgba(0, 0, 0, 0.55), 0 0 30px rgba(0, 206, 201, 0.12);
}

:global(.modal-overlay .workout-exercise-modal-window .modal-header) {
  margin-bottom: 18px;
}

:global(.modal-overlay .workout-exercise-modal-window .modal-header h2) {
  color: var(--secondary);
  font-size: 1.2rem;
  font-weight: 800;
}

@media (max-width: 600px), (max-height: 500px) {
  :global(.modal-overlay .modal-panel.workout-exercise-modal-window) {
    max-height: calc(100dvh - 24px);
  }
}

.editor-description {
  margin: -6px 0 16px;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  color: var(--text-main);
  padding: 10px 14px;
  font-weight: 700;
  font-size: 0.85rem;
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.save-exercise-btn {
  padding: 12px 16px;
  border-radius: 15px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: var(--text-main);
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: var(--shadow-neon);
}

.save-exercise-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 25px rgba(108, 92, 231, 0.7);
}

.category-create-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.category-input-control {
  display: flex;
  gap: 8px;
}

.category-input-control input {
  min-width: 0;
  flex: 1;
}

.editor-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.editor-field label {
  color: var(--text-main);
  font-size: 0.78rem;
  font-weight: 700;
}

.category-create-row input,
.category-create-row select,
.editor-grid input,
.editor-grid select {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text-main);
  font-family: inherit;
  font-size: 0.85rem;
}

.category-select {
  color-scheme: dark;
  background-color: #171a2c;
  border-color: rgba(255, 255, 255, 0.18);
}

.category-select option {
  color: #f7fbff;
  background-color: #171a2c;
}

.category-select option:checked {
  color: #fff;
  background: #315a82;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 12px;
}

.is-day-edit .editor-grid {
  gap: 12px;
}

.is-existing-edit .exercise-name-field {
  grid-column: 1 / -1;
  grid-row: 1;
}

.is-existing-edit .exercise-sets-field {
  grid-area: 2 / 1;
}

.is-existing-edit .exercise-reps-field {
  grid-area: 2 / 2;
}

.is-existing-edit .exercise-weight-field {
  grid-area: 3 / 1;
}

.is-existing-edit .exercise-rest-field {
  grid-area: 4 / 1;
}

.is-existing-edit .exercise-duration-field {
  grid-area: 4 / 2;
}

.is-day-edit .exercise-weight-field {
  grid-area: 2 / 1;
}

.is-day-edit .exercise-rest-field {
  grid-area: 3 / 1;
}

.is-day-edit .exercise-duration-field {
  grid-area: 3 / 2;
}

.is-day-edit .exercise-sets-field,
.is-day-edit .exercise-reps-field {
  grid-row: 1;
}

.is-day-edit .exercise-sets-field {
  grid-column: 1;
}

.is-day-edit .exercise-reps-field {
  grid-column: 2;
}

.exercise-number-control {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 40px;
  min-width: 0;
  padding: 0 8px 0 10px;
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.2);
}

.exercise-number-input-wrap {
  position: relative;
  flex: 1 1 0;
  width: auto;
  height: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
}

.exercise-number-input-wrap > input {
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  padding: 0 34px 0 0;
  border: 0;
  border-radius: 0;
  outline: 0;
  background: transparent;
  color: var(--text-main);
  font: inherit;
  font-size: 0.85rem;
  box-shadow: none;
}

.exercise-number-input-wrap > input.has-option {
  padding-left: 10px;
  padding-right: 120px;
}

.exercise-number-input-wrap input:disabled {
  opacity: 0.55;
}

.exercise-editor input[type='number'] {
  -webkit-appearance: none !important;
  appearance: textfield !important;
  -moz-appearance: textfield !important;
}

.exercise-editor input[type='number']::-webkit-inner-spin-button,
.exercise-editor input[type='number']::-webkit-outer-spin-button {
  display: none !important;
  margin: 0;
  -webkit-appearance: none !important;
}

.exercise-number-steppers {
  position: absolute;
  top: 50%;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transform: translateY(-50%);
}

.exercise-number-adjust {
  width: 21px;
  height: 14px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 5px;
  color: #d3edf4;
  background: rgba(255, 255, 255, 0.07);
  font-size: 0.66rem;
  font-weight: 900;
  line-height: 1;
  display: grid;
  place-items: center;
  transition: background 130ms ease, border-color 130ms ease, transform 130ms ease;
}

.exercise-number-adjust:hover:not(:disabled) {
  color: #fff;
  border-color: rgba(0, 206, 201, 0.48);
  background: rgba(0, 206, 201, 0.22);
}

.exercise-number-adjust:active:not(:disabled) {
  transform: scale(0.94);
}

.exercise-number-adjust:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.exercise-option-btn {
  position: absolute;
  z-index: 2;
  top: 50%;
  right: 42px;
  left: auto;
  min-width: 0;
  min-height: 0;
  padding: 6px 3px;
  border: 0;
  border-radius: 0;
  color: rgba(145, 220, 227, 0.82);
  background: transparent;
  font-size: 0.7rem;
  font-weight: 800;
  white-space: nowrap;
  transform: translateY(-50%);
  transition: color 150ms ease, text-shadow 150ms ease;
}

.exercise-option-btn:hover {
  color: #d7ffff;
  text-shadow: 0 0 10px rgba(0, 206, 201, 0.42);
}

.exercise-option-btn.option-till-failure.active {
  color: #8de8b5;
  text-shadow: 0 0 10px rgba(91, 220, 157, 0.35);
}

.exercise-option-btn.option-bodyweight.active {
  color: #8fd3ff;
  text-shadow: 0 0 10px rgba(92, 185, 255, 0.35);
}

.exercise-duration-readout {
  display: flex;
  width: 100%;
  align-items: center;
}

.exercise-duration-readout input {
  flex: 1 1 0;
  width: 0;
  min-width: 0;
  font-variant-numeric: tabular-nums;
}

.exercise-duration-value {
  display: block;
  width: 100%;
  margin-top: 2px;
  color: var(--secondary);
  font-size: 0.78rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.exercise-duration-slider {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  height: 20px;
  margin: 7px 0 0;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  accent-color: var(--secondary);
  cursor: pointer;
}

.exercise-duration-slider:focus-visible {
  outline: 2px solid rgba(0, 206, 201, 0.65);
  outline-offset: 3px;
  border-radius: 999px;
}

.exercise-editor-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

@media (max-width: 520px) {
  .editor-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .is-existing-edit .exercise-sets-field,
  .is-existing-edit .exercise-reps-field,
  .is-existing-edit .exercise-weight-field,
  .is-existing-edit .exercise-rest-field,
  .is-existing-edit .exercise-duration-field {
    grid-area: auto / 1;
  }
}

@media (max-width: 420px) {
  .editor-grid,
  .category-create-row {
    grid-template-columns: 1fr;
  }
}
</style>
