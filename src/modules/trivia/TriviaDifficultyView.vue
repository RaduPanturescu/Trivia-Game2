<script setup lang="ts">
/**
 * Difficulty picker for one category. Completed difficulties show a checkmark.
 * Starting a difficulty opens its play route. Legacy `#difficulty-screen`.
 */
import { useRoute, useRouter } from 'vue-router'
import { AppScreen, BackButton, ScreenTitle } from '@/shared/components'
import { SFX, useAudio } from '@/shared/composables/useAudio'
import { DIFFICULTIES, type Difficulty, useProgress } from '@/shared/progress'
import { CATEGORY_META, DIFFICULTY_LABEL, isCategoryId } from './categories'

const route = useRoute()
const router = useRouter()
const audio = useAudio()
const completion = useProgress().difficulties

const category = route.params.category
if (!isCategoryId(category)) throw new Error(`Unknown trivia category: ${String(category)}`)

/**
 * Plays the pop sound and opens the play route for a difficulty.
 * @param difficulty - The difficulty that was picked.
 */
function play(difficulty: Difficulty): void {
  audio.playSfx(SFX.pop)
  void router.push({ name: 'trivia-play', params: { category }, query: { diff: difficulty } })
}
</script>

<template>
  <AppScreen class="trivia-difficulty-screen">
    <BackButton to="/trivia" />
    <ScreenTitle>{{ CATEGORY_META[category].label }}</ScreenTitle>
    <p class="subtitle">
      Select Difficulty
    </p>
    <div class="difficulty-list">
      <button
        v-for="difficulty in DIFFICULTIES"
        :key="difficulty"
        type="button"
        class="diff-btn"
        :data-diff="difficulty"
        @click="play(difficulty)"
      >
        {{ DIFFICULTY_LABEL[difficulty] }}
        <div
          v-if="completion[category][difficulty] === true"
          class="completed-check"
        >
          ✓
        </div>
      </button>
    </div>
  </AppScreen>
</template>

<style scoped>
.subtitle {
  text-align: center;
  color: var(--text-muted);
  font-size: 1.1rem;
  margin: 15px 0 30px 0;
}

.difficulty-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 20px;
}

.diff-btn {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  padding: 20px;
  border-radius: 15px;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.diff-btn[data-diff='expert'] {
  font-size: 0.9rem;
}

.diff-btn:hover {
  background: var(--primary);
  border-color: var(--primary);
  box-shadow: var(--shadow-neon);
  transform: scale(1.02);
}

.diff-btn[data-diff='easy']:hover { background: #00b894; border-color: #00b894; box-shadow: 0 0 15px rgba(0, 184, 148, 0.5); }
.diff-btn[data-diff='medium']:hover { background: #0984e3; border-color: #0984e3; box-shadow: 0 0 15px rgba(9, 132, 227, 0.5); }
.diff-btn[data-diff='hard']:hover { background: #e17055; border-color: #e17055; box-shadow: 0 0 15px rgba(225, 112, 85, 0.5); }
.diff-btn[data-diff='expert']:hover { background: #d63031; border-color: #d63031; box-shadow: 0 0 15px rgba(214, 48, 49, 0.5); }

.completed-check {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--correct);
  color: white;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  box-shadow: 0 0 10px rgba(0, 184, 148, 0.5);
}

@media (max-width: 600px), (max-height: 500px) {
  .difficulty-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .diff-btn {
    min-width: 0;
    padding: 12px;
    overflow-wrap: anywhere;
  }
}
</style>
