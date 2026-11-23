<script setup lang="ts">
/** Category filter chips for the exercise library. The active custom category that is empty gets a remove button. */
import { formatWorkoutCategoryLabel } from '../core/categories'
import { useExerciseLibrary } from './useExerciseLibrary'

const { categoryChips, category, removableCategory, selectCategory, removeCategory } = useExerciseLibrary()
</script>

<template>
  <div
    id="workout-category-filters"
    class="filter-row"
    role="group"
    aria-label="Exercise categories"
  >
    <span
      v-for="chip in categoryChips"
      :key="chip.value"
      class="filter-chip-wrap"
    >
      <button
        class="filter-chip"
        :class="{ active: chip.value === category }"
        type="button"
        :aria-pressed="chip.value === category"
        @click="selectCategory(chip.value)"
      >
        {{ chip.label }}
      </button>
      <button
        v-if="chip.value === removableCategory"
        type="button"
        class="remove-category-btn"
        :title="`Remove empty ${formatWorkoutCategoryLabel(chip.value)} category`"
        :aria-label="`Remove ${formatWorkoutCategoryLabel(chip.value)} category`"
        @click="removeCategory(chip.value)"
      >
        ×
      </button>
    </span>
  </div>
</template>

<style scoped>
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1 1 280px;
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

.filter-chip-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.remove-category-btn {
  width: 25px;
  height: 25px;
  display: inline-grid;
  place-items: center;
  border: 1px solid rgba(255, 112, 112, 0.38);
  border-radius: 50%;
  color: #ffaaa5;
  background: rgba(214, 48, 49, 0.12);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
  transition: color 140ms ease, background 140ms ease, border-color 140ms ease, transform 140ms ease;
}

.remove-category-btn:hover {
  color: #fff;
  border-color: rgba(255, 112, 112, 0.8);
  background: rgba(214, 48, 49, 0.48);
  transform: scale(1.06);
}
</style>
