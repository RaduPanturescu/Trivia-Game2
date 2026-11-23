<script setup lang="ts">
/** Exercise library: category and type filters, and the filtered list (resizable, height kept between visits). */
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import CategoryFilters from './CategoryFilters.vue'
import ExerciseLibraryItem from './ExerciseLibraryItem.vue'
import { useExerciseLibrary } from './useExerciseLibrary'

const library = useExerciseLibrary()
const list = useTemplateRef<HTMLDivElement>('list')
let stopObservingHeight: (() => void) | undefined

onMounted(() => {
  if (list.value) stopObservingHeight = library.observeListHeight(list.value)
})

onBeforeUnmount(() => stopObservingHeight?.())
</script>

<template>
  <div class="workout-builder-filters">
    <CategoryFilters />
    <div
      class="workout-type-filters"
      role="group"
      aria-label="Exercise type"
    >
      <button
        class="filter-chip"
        :class="{ active: library.typeFilter.value === 'bodyweight' }"
        type="button"
        data-exercise-type="bodyweight"
        :aria-pressed="library.typeFilter.value === 'bodyweight'"
        @click="library.toggleTypeFilter('bodyweight')"
      >
        Bodyweight
      </button>
      <button
        class="filter-chip"
        :class="{ active: library.typeFilter.value === 'weighted' }"
        type="button"
        data-exercise-type="weighted"
        :aria-pressed="library.typeFilter.value === 'weighted'"
        @click="library.toggleTypeFilter('weighted')"
      >
        Weighted
      </button>
    </div>
  </div>

  <div
    id="workout-exercise-list"
    ref="list"
    class="workout-exercise-list"
    :style="{ height: `${library.listHeight.value}px` }"
  >
    <ExerciseLibraryItem
      v-for="exercise in library.visibleDefaults.value"
      :key="exercise.id"
      :exercise="exercise"
    />
    <template v-if="library.visibleCustom.value.length">
      <div class="custom-exercise-divider">
        <span>Custom Exercises</span>
      </div>
      <ExerciseLibraryItem
        v-for="exercise in library.visibleCustom.value"
        :key="exercise.id"
        :exercise="exercise"
      />
    </template>
    <p
      v-if="library.isEmpty.value"
      class="workout-exercise-empty"
    >
      No exercises match these filters.
    </p>
  </div>
</template>

<style scoped>
.workout-builder-filters {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.workout-type-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  margin-left: auto;
}

.workout-type-filters .filter-chip {
  white-space: nowrap;
}

.filter-chip {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  padding: 7px 10px;
  font-size: 0.75rem;
  color: var(--text-main);
}

.filter-chip.active {
  background: rgba(108, 92, 231, 0.2);
  border-color: var(--primary);
  color: var(--secondary);
}

.workout-exercise-empty {
  color: var(--text-muted);
  padding: 18px 4px;
  font-size: 0.85rem;
}

.workout-exercise-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 300px;
  max-height: 600px;
  resize: vertical;
  overflow: auto;
  padding-right: 8px;
  margin-bottom: 14px;
}

.workout-exercise-list::after {
  content: '';
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: 0;
  width: 12px;
  height: 12px;
  pointer-events: none;
  background: linear-gradient(135deg, transparent 38%, rgba(0, 206, 201, 0.28) 40% 48%, transparent 50% 62%, rgba(0, 206, 201, 0.48) 64% 72%, transparent 74%);
}

.custom-exercise-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 2px 4px;
  color: var(--secondary);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.custom-exercise-divider::before {
  content: '';
  height: 1px;
  flex: 1;
  order: 1;
  background: linear-gradient(90deg, rgba(0, 206, 201, 0.42), rgba(255, 255, 255, 0.08));
}
</style>
