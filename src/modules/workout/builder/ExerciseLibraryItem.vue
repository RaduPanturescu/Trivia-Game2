<script setup lang="ts">
/** One row of the exercise library: name, summary, and Add / Edit (plus Remove for custom exercises). */
import type { WorkoutLibraryExercise } from '../core/types'
import { formatExerciseMeta, isCustomExerciseId } from './library'
import { useExerciseEditor } from './useExerciseEditor'
import { useExerciseLibrary } from './useExerciseLibrary'

defineProps<{ exercise: WorkoutLibraryExercise }>()

const library = useExerciseLibrary()
const editor = useExerciseEditor()
</script>

<template>
  <div class="workout-exercise-item">
    <div>
      <strong>{{ exercise.name }}</strong>
      <div class="exercise-item-meta">
        {{ formatExerciseMeta(exercise) }}
      </div>
    </div>
    <div class="exercise-item-actions">
      <button
        type="button"
        class="add-exercise-btn"
        @click="library.addToSelectedDay(exercise)"
      >
        Add
      </button>
      <button
        type="button"
        class="edit-exercise-btn"
        @click="editor.openLibrary(exercise)"
      >
        Edit
      </button>
      <button
        v-if="isCustomExerciseId(exercise.id)"
        type="button"
        class="remove-exercise-btn"
        @click="library.removeCustomExercise(exercise.id)"
      >
        Remove
      </button>
    </div>
  </div>
</template>

<style scoped>
.workout-exercise-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  min-height: 66px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.workout-exercise-item > div:first-child {
  min-width: 0;
  flex: 1;
}

.workout-exercise-item strong {
  font-size: 0.94rem;
}

.exercise-item-meta {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.exercise-item-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.exercise-item-actions button {
  padding: 5px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
  border: 1px solid var(--glass-border);
  font-size: 0.75rem;
}

.exercise-item-actions .add-exercise-btn {
  color: #e6fff4;
  border-color: rgba(91, 220, 157, 0.58);
  background: rgba(91, 220, 157, 0.22);
  transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.exercise-item-actions .add-exercise-btn:hover {
  border-color: rgba(38, 168, 105, 0.9);
  background: rgba(24, 132, 78, 0.82);
  transform: translateY(-1px);
}

.exercise-item-actions .remove-exercise-btn {
  color: #ff9999;
  border-color: rgba(231, 76, 60, 0.55);
  background: rgba(214, 48, 49, 0.18);
}
</style>
