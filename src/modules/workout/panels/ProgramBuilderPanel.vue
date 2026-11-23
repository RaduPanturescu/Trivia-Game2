<script setup lang="ts">
/** Dashboard panel: the exercise library with its filters, the "Create New Exercise" button and the editor modal. */
import '../workout.css'
import ExerciseEditorModal from '../builder/ExerciseEditorModal.vue'
import ExerciseLibrary from '../builder/ExerciseLibrary.vue'
import { useExerciseEditor } from '../builder/useExerciseEditor'

const { openNew } = useExerciseEditor()
</script>

<template>
  <details class="workout-panel program-builder-panel collapsible-panel">
    <summary class="panel-header">
      <h3>Program Builder</h3>
      <span
        class="collapse-indicator"
        aria-hidden="true"
      >⌄</span>
    </summary>
    <div class="collapsible-content">
      <ExerciseLibrary />
      <button
        class="create-exercise-btn"
        type="button"
        @click="openNew"
      >
        ＋ Create New Exercise
      </button>
      <ExerciseEditorModal />
    </div>
  </details>
</template>

<style scoped>
.create-exercise-btn {
  width: auto;
  margin: 0;
  padding: 12px 16px;
  border-radius: 15px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: var(--text-main);
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: var(--shadow-neon);
}

.create-exercise-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 25px rgba(108, 92, 231, 0.7);
}
</style>
