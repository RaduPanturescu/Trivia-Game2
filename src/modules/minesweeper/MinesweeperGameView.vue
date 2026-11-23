<script setup lang="ts">
/** Minesweeper game screen: timer, mine counter, flag mode, board, result, leaderboard and round buttons. */
import { useRoute, useRouter } from 'vue-router'
import { AppButton, AppScreen, BackButton, ScreenTitle } from '@/shared/components'
import { LeaderboardPanel, StatPill, formatDuration } from '@/shared/games'
import { SFX, useAudio } from '@/shared/composables/useAudio'
import { useDevMode } from '@/shared/devMode'
import MinesweeperBoard from './MinesweeperBoard.vue'
import { leaderboardRows, prLine } from './leaderboard'
import { hazardEmoji, modeTitle, parsePlayQuery } from './sizes'
import { useMinesweeper } from './useMinesweeper'

const route = useRoute()
const router = useRouter()
const audio = useAudio()
const { isDev } = useDevMode()

// Invalid or missing settings send the player back to the size screen.
const config = parsePlayQuery(route.query)
if (!config) void router.replace({ name: 'minesweeper' })
const game = config ? useMinesweeper(config) : null

const otterMode = config?.otterMode ?? false
const title = modeTitle(otterMode)
const hazardIcon = hazardEmoji(otterMode)

/** Pops the sound and deals a new board with the same settings. */
function newGame(): void {
  audio.playSfx(SFX.pop)
  game?.restart()
}

/** Pops the sound and returns to the size screen. */
function backToMenu(): void {
  audio.playSfx(SFX.pop)
  void router.push({ name: 'minesweeper' })
}
</script>

<template>
  <AppScreen
    v-if="game"
    class="minesweeper-game"
  >
    <BackButton :to="{ name: 'minesweeper' }" />
    <div class="minesweeper-game-header">
      <ScreenTitle class="minesweeper-game-title">
        {{ title }}
      </ScreenTitle>
      <div class="minesweeper-stats">
        <StatPill tone="secondary">
          ⏱️ {{ formatDuration(game.timer.seconds) }}
        </StatPill>
        <StatPill tone="accent">
          {{ hazardIcon }} {{ game.minesLeft }}
        </StatPill>
      </div>
    </div>
    <button
      type="button"
      class="minesweeper-flag-mode"
      :aria-pressed="game.flagMode"
      @click="game.toggleFlagMode()"
    >
      🚩 Flag mode: {{ game.flagMode ? 'On' : 'Off' }}
    </button>
    <MinesweeperBoard
      :cells="game.board"
      :hazard-icon="hazardIcon"
      :show-hazards="isDev"
      @press="game.press"
      @flag="game.flag"
    />
    <div
      v-if="game.status !== 'playing'"
      class="minesweeper-result"
      :class="`minesweeper-result--${game.status}`"
    >
      <template v-if="game.status === 'won'">
        <h2>🎉 You Won!</h2>
        <p>Time: {{ formatDuration(game.timer.seconds) }}</p>
      </template>
      <template v-else>
        <h2>💥 Game Over!</h2>
        <p>{{ otterMode ? 'An otter got you!' : 'You hit a mine!' }}</p>
      </template>
    </div>
    <LeaderboardPanel
      :title="`${title} Leaderboard`"
      :pr="prLine(game.leaderboard.entries)"
      :rows="leaderboardRows(game.leaderboard.entries)"
      :empty-text="`No ${title} rounds played yet.`"
      @clear="game.leaderboard.clear"
    />
    <div class="minesweeper-actions">
      <AppButton
        class="minesweeper-new-game"
        @click="newGame"
      >
        New Game
      </AppButton>
      <AppButton
        class="minesweeper-back"
        @click="backToMenu"
      >
        Back to Menu
      </AppButton>
    </div>
  </AppScreen>
</template>

<style scoped>
/* Container for the board, so cell sizes can use container units. */
.minesweeper-game {
  container-type: size;
}

.minesweeper-game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.minesweeper-game .minesweeper-game-title {
  margin: 30px 0 0 0;
  font-size: 1.5rem;
}

.minesweeper-stats {
  display: flex;
  gap: 10px;
}

.minesweeper-flag-mode {
  display: none;
  align-self: flex-start;
  min-height: 44px;
  margin-bottom: 12px;
  padding: 10px 14px;
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  font-weight: 700;
}

.minesweeper-flag-mode[aria-pressed="true"] {
  border-color: var(--secondary);
  background: rgba(0, 206, 201, 0.18);
}

.minesweeper-result {
  text-align: center;
  padding: 20px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid var(--primary);
  margin-bottom: 20px;
}

.minesweeper-result--won {
  color: var(--correct);
}

.minesweeper-result--lost {
  color: var(--incorrect);
}

.minesweeper-result h2 {
  font-size: 2rem;
  margin-bottom: 10px;
}

.minesweeper-result p {
  color: var(--text-muted);
  font-size: 1.1rem;
}

.minesweeper-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.minesweeper-actions .minesweeper-new-game,
.minesweeper-actions .minesweeper-back {
  flex: 1;
}

.minesweeper-actions .minesweeper-back {
  background: var(--accent);
}

@media (max-width: 600px), (pointer: coarse) {
  .minesweeper-flag-mode {
    display: block;
  }
}

@media (max-width: 600px), (max-height: 500px) {
  .minesweeper-game-header {
    flex-wrap: wrap;
    gap: 10px;
    padding-top: 40px;
  }

  .minesweeper-game .minesweeper-game-title {
    margin: 0 !important;
  }

  .minesweeper-stats {
    flex-wrap: wrap;
  }
}
</style>
