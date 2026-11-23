<script setup lang="ts">
/** Puzzle of the Day: today's picture, the difficulty picker and the play button. State comes from useDailyPuzzle. */
import { ref } from 'vue'
import { AppButton } from '@/shared/components'
import { DIFFICULTY_LEVELS, difficultyOption, type Difficulty } from '../types'

defineProps<{
  /** Status line under the heading. */
  message: string
  /** Label of the play button. */
  buttonLabel: string
  /** Whether the play button is enabled. */
  canPlay: boolean
}>()

const emit = defineEmits<{
  /** Emitted when the play button is pressed, with the chosen difficulty. */
  play: [level: Difficulty]
}>()

const level = ref<Difficulty>('medium')
</script>

<template>
  <section class="puzzle-daily-panel">
    <div>
      <h3>🧩 Puzzle of the Day</h3>
      <p>{{ message }}</p>
    </div>
    <label class="daily-puzzle-difficulty">
      Difficulty
      <select v-model="level">
        <option
          v-for="option in DIFFICULTY_LEVELS"
          :key="option"
          :value="option"
        >
          {{ difficultyOption(option) }}
        </option>
      </select>
    </label>
    <AppButton
      class="daily-play-btn"
      :disabled="!canPlay"
      @click="emit('play', level)"
    >
      {{ buttonLabel }}
    </AppButton>
  </section>
</template>

<style scoped>
.puzzle-daily-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin: 12px 0;
  padding: 18px;
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.14), rgba(0, 206, 201, 0.06));
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
}

.puzzle-daily-panel h3 {
  color: var(--secondary);
  font-size: 1.2rem;
}

.puzzle-daily-panel p {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.puzzle-daily-panel .daily-play-btn {
  width: auto;
  flex: 0 0 auto;
  margin: 0;
  padding: 12px 16px;
  font-size: 0.95rem;
}

.daily-puzzle-difficulty {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--text-muted);
  font-size: 0.82rem;
  white-space: nowrap;
}

.daily-puzzle-difficulty select {
  min-width: 0;
  height: 44px;
  padding: 9px 11px;
  border: 1px solid var(--glass-border);
  border-radius: 11px;
  background: rgba(8, 9, 18, 0.75);
  color: var(--text-main);
  font: inherit;
}

@media (max-width: 720px) {
  .puzzle-daily-panel {
    align-items: stretch;
    flex-direction: column;
  }

  .puzzle-daily-panel .daily-play-btn {
    width: 100%;
  }
}

@media (max-width: 430px) {
  .puzzle-daily-panel {
    padding: 14px;
  }
}
</style>
