<script setup lang="ts">
/** Picture Puzzles screen: Puzzle of the Day, the upload form, the user's saved puzzles and the game panel. Logic lives in the composables. */
import { onMounted } from 'vue'
import { AppScreen, BackButton, ScreenTitle } from '@/shared/components'
import CreatePuzzlePanel from './components/CreatePuzzlePanel.vue'
import DailyPuzzlePanel from './components/DailyPuzzlePanel.vue'
import PuzzleGamePanel from './components/PuzzleGamePanel.vue'
import YourPuzzlesList from './components/YourPuzzlesList.vue'
import type { Difficulty, PersonalPuzzle } from './types'
import { useDailyPuzzle } from './useDailyPuzzle'
import { personalPlayable, usePersonalPuzzles } from './usePersonalPuzzles'
import { usePuzzleGame } from './usePuzzleGame'

const { message: dailyMessage, buttonLabel: dailyButtonLabel, canPlay: dailyCanPlay, playable: dailyPlayable, load: loadDaily } =
  useDailyPuzzle()
const { puzzles, loadFailed, form, load: loadPersonal, remove, save } = usePersonalPuzzles()
const game = usePuzzleGame()

onMounted(() => {
  void loadDaily()
  void loadPersonal()
})

/**
 * Starts today's daily picture at the chosen difficulty, if it can be played.
 * @param level - Difficulty picked in the daily panel.
 */
function playDaily(level: Difficulty): void {
  const puzzle = dailyPlayable.value
  if (puzzle) game.start(puzzle, level)
}

/**
 * Starts a saved puzzle at the chosen difficulty.
 * @param puzzle - The saved puzzle.
 * @param level - Difficulty picked on its card.
 */
function playPersonal(puzzle: PersonalPuzzle, level: Difficulty): void {
  game.start(personalPlayable(puzzle), level)
}

/** Saves the form as a new puzzle and starts it at the chosen difficulty. */
async function saveAndPlay(): Promise<void> {
  const saved = await save()
  if (saved) game.start(saved.puzzle, saved.level)
}
</script>

<template>
  <AppScreen class="puzzle-screen">
    <BackButton
      to="/hub"
      aria-label="Back to main menu"
    />
    <div class="puzzle-shell">
      <header class="puzzle-header">
        <ScreenTitle>Picture Puzzles</ScreenTitle>
      </header>
      <DailyPuzzlePanel
        :message="dailyMessage"
        :button-label="dailyButtonLabel"
        :can-play="dailyCanPlay"
        @play="playDaily"
      />
      <CreatePuzzlePanel
        v-model:name="form.name"
        v-model:level="form.level"
        v-model:file="form.file"
        @save="saveAndPlay"
      />
      <YourPuzzlesList
        :puzzles="puzzles"
        :failed="loadFailed"
        @play="playPersonal"
        @delete="remove"
      />
      <PuzzleGamePanel :game="game" />
    </div>
  </AppScreen>
</template>

<style scoped>
.puzzle-screen.screen {
  padding: 28px 22px 36px;
}

.puzzle-shell {
  width: min(100%, 900px);
  margin: 0 auto;
}

.puzzle-header {
  padding-top: 28px;
  text-align: center;
}

@media (max-width: 430px) {
  .puzzle-screen.screen {
    padding: 28px 14px 28px;
  }
}
</style>
