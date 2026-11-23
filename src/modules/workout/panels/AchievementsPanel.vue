<script setup lang="ts">
/**
 * Dashboard panel listing the workout achievements, six per page. Developer mode adds the editor: create, edit and
 * delete achievements with an emoji or a photo, plus an optional stat trigger.
 */
import '../workout.css'
import { triggerStatOptions } from '../achievements/achievementModel'
import { useWorkoutAchievements } from '../achievements/useWorkoutAchievements'
import { useProgramResets } from '../builder/useProgramResets'

const { resetAllStats } = useProgramResets()
const {
  isDev,
  cards,
  pageCount,
  currentPage,
  previousPage,
  nextPage,
  editorOpen,
  draft,
  preview,
  openEditor,
  closeEditor,
  pickPhoto,
  saveDraft,
  removeAchievement,
} = useWorkoutAchievements()

const triggerOptions = triggerStatOptions()

/**
 * Passes the picked photo to the editor. A rejected file is cleared from the input, as legacy did.
 * @param event - The file input's change event.
 */
async function onPhotoChange(event: Event): Promise<void> {
  const input = event.target instanceof HTMLInputElement ? event.target : null
  const file = input?.files?.[0]
  if (!file) return
  if (!(await pickPhoto(file)) && input) input.value = ''
}
</script>

<template>
  <details class="workout-panel collapsible-panel achievements-panel">
    <summary class="panel-header">
      <h3>Achievements</h3>
      <span
        class="collapse-indicator"
        aria-hidden="true"
      >⌄</span>
    </summary>
    <div class="collapsible-content">
      <div
        v-if="isDev"
        class="workout-achievements-admin"
      >
        <button
          v-if="!editorOpen"
          class="mini-btn admin-add-btn"
          type="button"
          @click="openEditor()"
        >
          ＋ Add Achievement
        </button>
        <form
          v-else
          class="workout-achievement-form"
          @submit.prevent="saveDraft"
        >
          <label for="workout-achievement-name">Name</label>
          <input
            id="workout-achievement-name"
            v-model="draft.name"
            type="text"
            maxlength="60"
            required
          >
          <label for="workout-achievement-description">Description</label>
          <textarea
            id="workout-achievement-description"
            v-model="draft.description"
            rows="2"
            maxlength="200"
            required
          />
          <div class="workout-achievement-icon-fields">
            <label for="workout-achievement-emoji">Emoji (optional)</label>
            <input
              id="workout-achievement-emoji"
              v-model="draft.emoji"
              type="text"
              maxlength="8"
              placeholder="🏆"
            >
            <label for="workout-achievement-photo">Photo (optional)</label>
            <input
              id="workout-achievement-photo"
              type="file"
              accept="image/*"
              @change="onPhotoChange"
            >
          </div>
          <label class="workout-achievement-unlocked-control"><input
            v-model="draft.unlocked"
            type="checkbox"
          > Unlocked</label>
          <div class="workout-achievement-trigger-fields">
            <label for="workout-achievement-trigger-stat">Unlock when stat reaches</label>
            <select
              id="workout-achievement-trigger-stat"
              v-model="draft.triggerStat"
            >
              <option value="">
                No automatic trigger
              </option>
              <option
                v-for="option in triggerOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <label for="workout-achievement-trigger-target">Target</label>
            <input
              id="workout-achievement-trigger-target"
              v-model.number="draft.triggerTarget"
              type="number"
              min="0.01"
              step="any"
            >
            <small>Unlocks when the stat reaches or exceeds the target.</small>
          </div>
          <div class="workout-achievement-icon-preview">
            <img
              v-if="preview.kind === 'image'"
              :src="preview.src"
              alt="Achievement icon preview"
            >
            <template v-else>
              {{ preview.text }}
            </template>
          </div>
          <div class="workout-achievement-form-actions">
            <button
              class="mini-btn"
              type="submit"
            >
              Save Achievement
            </button>
            <button
              class="mini-btn"
              type="button"
              @click="closeEditor"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <div class="workout-achievements-list">
        <article
          v-for="card in cards"
          :key="card.id"
          class="workout-achievement-card"
          :class="{ unlocked: card.unlocked }"
        >
          <h4>{{ card.title }}</h4>
          <p>{{ card.description }}</p>
          <div class="workout-achievement-icon">
            <img
              v-if="card.icon.kind === 'image'"
              :src="card.icon.src"
              :alt="card.iconAlt"
            >
            <template v-else>
              {{ card.icon.text }}
            </template>
          </div>
          <template v-if="isDev">
            <button
              class="mini-btn workout-achievement-edit-btn"
              type="button"
              @click="openEditor(card.id)"
            >
              Edit
            </button>
            <button
              class="mini-btn workout-achievement-delete-btn"
              type="button"
              @click="removeAchievement(card.id)"
            >
              Delete
            </button>
          </template>
        </article>
      </div>

      <div
        v-if="pageCount > 1"
        class="workout-achievements-pagination"
      >
        <button
          class="chip-btn"
          type="button"
          aria-label="Previous achievements"
          :disabled="currentPage === 0"
          @click="previousPage"
        >
          ←
        </button>
        <span>{{ currentPage + 1 }} / {{ pageCount }}</span>
        <button
          class="chip-btn"
          type="button"
          aria-label="Next achievements"
          :disabled="currentPage >= pageCount - 1"
          @click="nextPage"
        >
          →
        </button>
      </div>
      <button
        class="reset-all-stats-btn"
        type="button"
        @click="resetAllStats"
      >
        Reset All Stats
      </button>
    </div>
  </details>
</template>

<style scoped>
.workout-achievements-admin {
  margin-bottom: 14px;
}

.workout-achievements-admin > .admin-add-btn {
  border-color: rgba(91,220,157,0.42);
  color: #bff8d8;
  background: rgba(91,220,157,0.1);
}

.workout-achievement-form {
  display: grid;
  gap: 8px;
  margin-top: 12px;
  padding: 14px;
  border: 1px solid rgba(0,206,201,0.22);
  border-radius: 14px;
  background: rgba(0,0,0,0.16);
}

.workout-achievement-form > label,
.workout-achievement-icon-fields label {
  display: grid;
  gap: 5px;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
}

.workout-achievement-form input[type="text"],
.workout-achievement-form textarea,
.workout-achievement-form input[type="file"] {
  width: 100%;
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 9px;
  color: var(--text-main);
  background: rgba(8,11,20,0.7);
  font: inherit;
  font-size: 0.82rem;
}

.workout-achievement-form textarea {
  resize: vertical;
}

.workout-achievement-icon-fields {
  display: grid;
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr);
  gap: 10px;
}

.workout-achievement-unlocked-control {
  display: flex !important;
  grid-template-columns: auto 1fr;
  align-items: center;
  justify-content: start;
}

.workout-achievement-unlocked-control input {
  accent-color: var(--secondary);
}

.workout-achievement-icon-preview {
  display: grid;
  min-height: 48px;
  place-items: center;
  color: var(--secondary);
  font-size: 1.8rem;
}

.workout-achievement-icon-preview img {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 12px;
}

.workout-achievement-form-actions {
  display: flex;
  gap: 8px;
}

.workout-achievements-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.workout-achievement-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.workout-achievement-card.unlocked {
  border-color: rgba(0, 184, 148, 0.8);
  background: rgba(0, 184, 148, 0.08);
}

.workout-achievement-card h4 {
  font-size: 0.85rem;
  color: var(--secondary);
}

.workout-achievement-card p {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.workout-achievement-icon img {
  display: block;
  width: 42px;
  height: 42px;
  object-fit: cover;
  border-radius: 10px;
  margin-top: 6px;
}

.workout-achievement-edit-btn {
  align-self: flex-start;
  margin-top: auto;
  padding: 6px 10px;
  font-size: 0.72rem;
}

.workout-achievement-delete-btn {
  align-self: flex-start;
  padding: 6px 10px;
  font-size: 0.72rem;
  color: #ffb4b4;
  border-color: rgba(231, 76, 60, 0.65);
}

.workout-achievement-delete-btn:hover {
  background: rgba(231, 76, 60, 0.18);
}

.workout-achievements-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin: 14px 0 4px;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 700;
}

.workout-achievements-pagination button:disabled {
  opacity: 0.35;
  cursor: default;
}

.reset-all-stats-btn {
  width: 100%;
  margin-top: 16px;
  padding: 13px 16px;
  border: 1px solid rgba(231, 76, 60, 0.7);
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(135deg, #d63031, #a91d2b);
  box-shadow: 0 8px 20px rgba(214, 48, 49, 0.2);
  font-size: 0.9rem;
  font-weight: 800;
}

.reset-all-stats-btn:hover {
  background: linear-gradient(135deg, #e74c3c, #b71c2c);
  box-shadow: 0 10px 24px rgba(214, 48, 49, 0.32);
  transform: translateY(-1px);
}
</style>
