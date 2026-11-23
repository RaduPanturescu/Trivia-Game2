<script setup lang="ts">
/** The user's saved puzzles: thumbnail, difficulty picker, Play and Delete for each. */
import { reactive } from 'vue'
import { difficultyOption, DIFFICULTY_LEVELS, isDifficulty, type Difficulty, type PersonalPuzzle } from '../types'

defineProps<{
  /** Saved puzzles, already sorted newest first. */
  puzzles: PersonalPuzzle[]
  /** True when the library could not be read in this browser. */
  failed: boolean
}>()

const emit = defineEmits<{
  /** Emitted when Play is pressed on a saved puzzle. */
  play: [puzzle: PersonalPuzzle, level: Difficulty]
  /** Emitted when Delete is pressed on a saved puzzle. */
  delete: [id: string]
}>()

/** Difficulty picked on each card. Cards start on the first level. */
const levels = reactive<Record<string, Difficulty>>({})

/**
 * Difficulty currently chosen on a card.
 * @param id - Puzzle id.
 * @returns The chosen difficulty, `easy` by default.
 */
function levelOf(id: string): Difficulty {
  return levels[id] ?? 'easy'
}

/**
 * Stores the difficulty picked on a card.
 * @param id - Puzzle id.
 * @param event - The change event of the select.
 */
function setLevel(id: string, event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (isDifficulty(value)) levels[id] = value
}
</script>

<template>
  <section class="your-puzzles-panel">
    <div class="puzzle-section-heading">
      <div><h3>Your Puzzles</h3></div>
    </div>
    <div class="your-puzzles-list">
      <template v-if="failed">
        Your puzzle library could not be loaded in this browser.
      </template>
      <p
        v-else-if="puzzles.length === 0"
        class="puzzle-empty-state"
      >
        No personal puzzles yet. Upload a picture to get started.
      </p>
      <template v-else>
        <article
          v-for="puzzle in puzzles"
          :key="puzzle.id"
          class="your-puzzle-card"
        >
          <img
            :src="puzzle.image"
            :alt="`${puzzle.name} preview`"
          >
          <h4>{{ puzzle.name }}</h4>
          <div class="your-puzzle-card-controls">
            <select
              :aria-label="`Difficulty for ${puzzle.name}`"
              :value="levelOf(puzzle.id)"
              @change="setLevel(puzzle.id, $event)"
            >
              <option
                v-for="option in DIFFICULTY_LEVELS"
                :key="option"
                :value="option"
              >
                {{ difficultyOption(option) }}
              </option>
            </select>
            <button
              type="button"
              @click="emit('play', puzzle, levelOf(puzzle.id))"
            >
              Play
            </button>
            <button
              type="button"
              class="puzzle-delete-btn"
              @click="emit('delete', puzzle.id)"
            >
              Delete
            </button>
          </div>
        </article>
      </template>
    </div>
  </section>
</template>

<style scoped>
.your-puzzles-panel {
  margin: 12px 0;
  padding: 18px;
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.14), rgba(0, 206, 201, 0.06));
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
}

.puzzle-section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.puzzle-section-heading h3 {
  color: var(--secondary);
  font-size: 1.2rem;
}

.your-puzzles-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 190px), 1fr));
  gap: 12px;
  margin-top: 15px;
}

.puzzle-empty-state {
  grid-column: 1 / -1;
  padding: 18px;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: var(--text-muted);
  text-align: center;
}

.your-puzzle-card {
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
}

.your-puzzle-card img {
  display: block;
  width: 100%;
  height: 112px;
  object-fit: contain;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.2);
}

.your-puzzle-card h4 {
  overflow: hidden;
  margin: 9px 0;
  color: white;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.your-puzzle-card-controls {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 7px;
}

.your-puzzle-card select,
.your-puzzle-card button {
  min-width: 0;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.07);
  color: white;
  font: inherit;
  font-size: 0.78rem;
}

.your-puzzle-card button {
  background: rgba(108, 92, 231, 0.45);
  font-weight: 700;
}

.your-puzzle-card .puzzle-delete-btn {
  grid-column: 1 / -1;
  color: #ff9aa8;
  background: rgba(214, 48, 49, 0.12);
}

@media (max-width: 430px) {
  .your-puzzles-panel {
    padding: 14px;
  }
}
</style>
