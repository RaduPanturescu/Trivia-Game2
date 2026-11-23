<script setup lang="ts">
/** Sudoku difficulty picker: a carousel of the three presets and a custom clue-count card. Starting a game opens the play route. */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AppScreen, BackButton, ScreenTitle } from '@/shared/components'
import { CustomDifficultyCard, DifficultyCard, DifficultyCarousel, formatDuration } from '@/shared/games'
import { SFX, useAudio } from '@/shared/composables/useAudio'
import { isValidClueCount, MAX_CLUES, MIN_CLUES, PRESET_DIFFICULTIES, PRESETS } from './difficulties'
import { useSudokuLeaderboard } from './leaderboard'
import type { SudokuDifficulty } from './types'

const router = useRouter()
const audio = useAudio()
const leaderboard = useSudokuLeaderboard()

/** Carousel items: the presets in order, then the custom card. */
const items: { key: SudokuDifficulty }[] = [...PRESET_DIFFICULTIES, 'custom' as const].map((key) => ({ key }))


/** Raw text of the custom clue input, as typed. */
const customClues = ref('30')

/** The custom input as a number. `Number('')` is 0, which is rejected, as in the legacy form. */
const customValue = computed(() => Number(customClues.value))
const customValid = computed(() => isValidClueCount(customValue.value))
const customValidation = computed(() =>
  customValid.value
    ? `Target: ${customValue.value} clues · extra clues may remain to ensure a unique solution.`
    : `Choose a whole number from ${MIN_CLUES} to ${MAX_CLUES} clues. A unique solution requires at least ${MIN_CLUES}.`,
)

/**
 * Personal best for a preset, formatted for its card. `N/A` when there is none.
 * @param key - The preset difficulty.
 * @returns The best time as `m:ss`, or `N/A`.
 */
function bestLabel(key: SudokuDifficulty): string {
  const best = leaderboard.bestFor(key)
  return best === null ? 'N/A' : formatDuration(best)
}

/**
 * Plays the pop sound and opens the play route with the chosen difficulty.
 * @param difficulty - The difficulty to play.
 */
function play(difficulty: SudokuDifficulty): void {
  audio.playSfx(SFX.pop)
  void router.push({ name: 'sudoku-play', query: { diff: difficulty } })
}

/** Starts a custom game when the clue count is valid. */
function startCustom(): void {
  if (!customValid.value) return
  audio.playSfx(SFX.pop)
  void router.push({ name: 'sudoku-play', query: { diff: 'custom', clues: String(customValue.value) } })
}
</script>

<template>
  <AppScreen class="sudoku-size-screen">
    <BackButton to="/hub" />
    <ScreenTitle class="sudoku-size-title">
      Sudoku
    </ScreenTitle>
    <p class="sudoku-size-subtitle">
      Select Difficulty
    </p>
    <div class="sudoku-carousel">
      <DifficultyCarousel
        :items="items"
        label="Sudoku difficulty selection"
      >
        <template #card="{ item }">
          <CustomDifficultyCard
            v-if="item.key === 'custom'"
            :validation="customValidation"
            :can-start="customValid"
            @start="startCustom"
          >
            <label for="sudoku-custom-clues">Starting clues ({{ MIN_CLUES }}–{{ MAX_CLUES }})</label>
            <input
              id="sudoku-custom-clues"
              v-model="customClues"
              type="number"
              :min="MIN_CLUES"
              :max="MAX_CLUES"
              step="1"
            >
          </CustomDifficultyCard>
          <DifficultyCard
            v-else
            :name="PRESETS[item.key].name"
            :details="[{ label: 'Clue target', value: String(PRESETS[item.key].clues) }]"
            :best-time="bestLabel(item.key)"
            :info="PRESETS[item.key].info"
            @play="play(item.key)"
          />
        </template>
      </DifficultyCarousel>
    </div>
  </AppScreen>
</template>

<style scoped>
.sudoku-size-screen {
    align-items: center;
    text-align: center;
}

.sudoku-size-screen .sudoku-size-title {
    margin-top: 36px;
    font-size: clamp(2.6rem, 9vw, 4.2rem);
    line-height: 1.05;
    letter-spacing: 0.02em;
    text-shadow: 0 0 22px rgba(108, 92, 231, 0.28);
}

.sudoku-size-subtitle {
    text-align: center;
    color: var(--text-muted);
    font-size: 1.1rem;
    margin: 15px 0 30px 0;
}

.sudoku-carousel {
    width: 100%;
}

.sudoku-carousel :deep(.difficulty-custom-fields) {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #e3e7f2;
    font-size: 0.9rem;
    font-weight: 700;
    text-align: center;
}

.sudoku-carousel :deep(.difficulty-custom-fields label) {
    font-size: 0.9rem;
}

.sudoku-carousel :deep(.difficulty-custom-fields input) {
    width: min(180px, 100%);
    font-size: 1rem;
    text-align: center;
}
</style>
