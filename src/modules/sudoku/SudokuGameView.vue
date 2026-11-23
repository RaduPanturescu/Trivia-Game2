<script setup lang="ts">
/** Sudoku play screen: board, timer, mistakes, result and leaderboard for one game. */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AppButton, AppScreen, BackButton, ScreenTitle } from '@/shared/components'
import { LeaderboardPanel, StatPill, formatDuration } from '@/shared/games'
import { formatLeaderboardDate } from '@/shared/dates'
import { SFX, useAudio } from '@/shared/composables/useAudio'
import SudokuBoard from './SudokuBoard.vue'
import { parseSudokuPlayQuery } from './difficulties'
import { useSudoku, useSudokuTheme } from './useSudoku'
import { useSudokuLeaderboard } from './leaderboard'

const route = useRoute()
const router = useRouter()
const audio = useAudio()
const { theme, toggleTheme } = useSudokuTheme()
const leaderboard = useSudokuLeaderboard()
const { cells, status, locked, mistakes, title, seconds, start, newGame, focusCell, enterValue, clearCell, revealCell } =
  useSudoku()

const settings = parseSudokuPlayQuery(route.query)
if (settings) start(settings.difficulty, settings.clues)

const isLight = computed(() => theme.value === 'light')
const themeLabel = computed(() => `Switch to ${isLight.value ? 'dark' : 'light'} theme`)
const themeIcon = computed(() => (isLight.value ? '🌙' : '☀️'))

/** Result time padded to `mm:ss`, as the legacy win message showed it. */
const winTime = computed(() => {
  const minutes = Math.floor(seconds.value / 60).toString().padStart(2, '0')
  return `${minutes}:${(seconds.value % 60).toString().padStart(2, '0')}`
})

const rows = computed(() =>
  leaderboard.entries.value.map((entry) => ({
    label: entry.difficulty === 'custom' ? `Custom (${entry.clues || '?'} clues)` : entry.difficulty,
    time: formatDuration(entry.time),
    date: formatLeaderboardDate(entry.date),
  })),
)

const prLine = computed(() => {
  const best = leaderboard.entries.value[0]
  return best ? `PR: ${formatDuration(best.time)} (${best.difficulty})` : 'PR: -'
})

/** Plays the pop sound, then runs the action. */
function popThen(action: () => void): void {
  audio.playSfx(SFX.pop)
  action()
}
</script>

<template>
  <AppScreen
    class="sudoku-game-screen"
    :class="{ 'sudoku-light-theme': isLight }"
  >
    <BackButton to="/sudoku" />
    <div class="sudoku-game-header">
      <ScreenTitle class="sudoku-game-title">
        {{ title }}
      </ScreenTitle>
      <div class="sudoku-game-stats">
        <button
          class="sudoku-theme-toggle"
          type="button"
          :aria-label="themeLabel"
          :title="themeLabel"
          @click="toggleTheme"
        >
          {{ themeIcon }}
        </button>
        <StatPill tone="secondary">
          ⏱️ {{ formatDuration(seconds) }}
        </StatPill>
        <StatPill
          tone="accent"
          :class="{ 'sudoku-mistakes--failed': mistakes >= 3 }"
        >
          ❌ {{ mistakes }} / 3
        </StatPill>
      </div>
    </div>

    <SudokuBoard
      :cells="cells"
      :locked="locked"
      @focus-cell="focusCell"
      @enter="enterValue"
      @clear="clearCell"
      @reveal="revealCell"
    />

    <div
      v-if="status === 'won'"
      class="sudoku-result sudoku-result--won"
    >
      <h2>🎉 You Won!</h2>
      <p>Time: {{ winTime }}</p>
    </div>
    <div
      v-else-if="status === 'lost'"
      class="sudoku-result sudoku-result--lost"
    >
      <h2>💥 Game Over!</h2>
      <p>Too many mistakes (3 strikes)</p>
    </div>

    <LeaderboardPanel
      title="Sudoku Leaderboard"
      :pr="prLine"
      :rows="rows"
      empty-text="No sudoku rounds played yet."
      @clear="leaderboard.clear()"
    />

    <div class="sudoku-actions">
      <AppButton
        class="sudoku-action"
        @click="popThen(newGame)"
      >
        New Game
      </AppButton>
      <AppButton
        class="sudoku-action sudoku-action--accent"
        @click="popThen(() => router.push('/sudoku'))"
      >
        Back to Menu
      </AppButton>
    </div>
  </AppScreen>
</template>

<style scoped>
.sudoku-game-screen.sudoku-light-theme {
    --primary: #2f3742;
    --secondary: #245c9e;
    --accent: #bd3445;
    --glass-bg: rgba(255, 255, 255, 0.88);
    --glass-border: rgba(32, 42, 55, 0.24);
    --text-main: #202833;
    --text-muted: #566170;
    color: #202833;
    background: #f3f5f7;
}

.sudoku-game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-left: 52px;
}

.sudoku-game-header .sudoku-game-title {
    margin: 0;
    font-size: 1.5rem;
}

.sudoku-game-screen.sudoku-light-theme .sudoku-game-title {
    color: #202833;
}

.sudoku-game-stats {
    display: flex;
    gap: 10px;
}

.sudoku-mistakes--failed {
    color: var(--incorrect);
}

.sudoku-theme-toggle {
    display: grid;
    width: 42px;
    min-width: 42px;
    height: 40px;
    place-items: center;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-main);
    font-size: 1.15rem;
    cursor: pointer;
    transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
}

.sudoku-theme-toggle:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.16);
}

.sudoku-theme-toggle:focus-visible {
    outline: 2px solid var(--secondary);
    outline-offset: 2px;
}

.sudoku-game-screen.sudoku-light-theme .sudoku-theme-toggle {
    border-color: #c3cad3;
    background: #fff;
    color: #28313c;
}

.sudoku-game-screen.sudoku-light-theme .sudoku-theme-toggle:hover {
    background: #e9edf2;
}

.sudoku-result {
    text-align: center;
    padding: 20px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid var(--primary);
    margin-bottom: 20px;
}

.sudoku-result h2 {
    font-size: 2rem;
    margin-bottom: 10px;
}

.sudoku-result p {
    color: var(--text-muted);
    font-size: 1.1rem;
}

.sudoku-result--won {
    color: var(--correct);
}

.sudoku-result--lost {
    color: var(--incorrect);
}

.sudoku-game-screen.sudoku-light-theme .sudoku-result {
    background: #fff;
    border-color: #343e4a;
}

.sudoku-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.sudoku-actions .sudoku-action {
    flex: 1;
    margin-top: 0;
}

.sudoku-actions .sudoku-action--accent {
    background: var(--accent);
}

@media (max-width: 600px), (max-height: 500px) {
    .sudoku-game-header {
        flex-wrap: wrap;
        gap: 10px;
        padding-top: 40px;
    }

    .sudoku-game-stats {
        flex-wrap: wrap;
    }
}
</style>
