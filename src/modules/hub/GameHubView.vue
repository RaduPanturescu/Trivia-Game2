<script setup lang="ts">
/** Game hub: one screen that groups the game launchers. Each card plays the pop sound and navigates. */
import { useRouter } from 'vue-router'
import { AppScreen, BackButton, ScreenTitle } from '@/shared/components'
import { SFX, useAudio } from '@/shared/composables/useAudio'

/** One game card on the hub. */
interface HubCard {
  /** Name shown under the icon. */
  label: string
  /** Emoji shown in the icon tile. */
  icon: string
  /** Route the card opens. */
  to: string
  /** Optional tint class from the legacy stylesheet. */
  tint?: string
}

const cards: HubCard[] = [
  { label: 'Category Trivia', icon: '🎯', to: '/trivia' },
  { label: 'WHTBAM', icon: '💰', to: '/millionaire', tint: 'hub-millionaire-card' },
  { label: 'Minesweeper', icon: '💣', to: '/minesweeper', tint: 'hub-minesweeper-card' },
  { label: 'Sudoku', icon: '🔢', to: '/sudoku', tint: 'hub-sudoku-card' },
  { label: 'Picture Puzzle', icon: '🧩', to: '/puzzles', tint: 'hub-puzzle-card' },
  { label: 'Wordle', icon: '🔤', to: '/wordle', tint: 'hub-wordle-card' },
]

const router = useRouter()

/**
 * Plays the pop sound and opens the card's game.
 * @param card - The card that was clicked.
 */
function open(card: HubCard): void {
  useAudio().playSfx(SFX.pop)
  void router.push(card.to)
}
</script>

<template>
  <AppScreen class="game-hub-screen">
    <BackButton
      to="/"
      aria-label="Back to welcome screen"
    />
    <div class="game-hub-content">
      <div class="game-hub-brand">
        BIANKA <span>GAME NIGHT</span>
      </div>
      <ScreenTitle class="game-hub-title">
        Choose Your Game
      </ScreenTitle>
      <div class="game-hub-grid">
        <button
          v-for="card in cards"
          :key="card.to"
          type="button"
          class="game-hub-card"
          :class="card.tint"
          @click="open(card)"
        >
          <span class="game-hub-icon">{{ card.icon }}</span>
          <strong>{{ card.label }}</strong>
        </button>
      </div>
    </div>
  </AppScreen>
</template>

<style scoped>
.game-hub-screen.screen {
  justify-content: flex-start;
  padding: 0;
  background: radial-gradient(ellipse at 50% 8%, rgba(108, 92, 231, 0.24), transparent 52%);
}

.game-hub-content {
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  max-width: none;
  min-height: 100%;
  margin: 0;
  padding: 54px 24px 28px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.game-hub-brand {
  margin-bottom: 12px;
  color: var(--text-muted);
  text-align: center;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.22em;
}

.game-hub-brand span {
  color: var(--secondary);
}

.game-hub-content > .game-hub-title {
  margin: 0;
  font-size: clamp(2rem, 6vw, 2.8rem);
}

.game-hub-content > .game-hub-title + .game-hub-grid {
  margin-top: 26px;
}

.game-hub-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.game-hub-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 174px;
  padding: 22px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.2), rgba(255, 255, 255, 0.035));
  text-align: center;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.game-hub-card:hover {
  transform: translateY(-3px);
  border-color: rgba(0, 206, 201, 0.55);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.24);
}

.game-hub-card strong {
  display: block;
  max-width: 100%;
  font-size: 1.12rem;
}

.game-hub-icon {
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 1.9rem;
}

.hub-millionaire-card { background-image: linear-gradient(135deg, rgba(196, 121, 0, 0.24), rgba(255, 255, 255, 0.035)); }
.hub-minesweeper-card { background-image: linear-gradient(135deg, rgba(108, 92, 231, 0.28), rgba(255, 255, 255, 0.035)); }
.hub-sudoku-card { background-image: linear-gradient(135deg, rgba(24, 125, 157, 0.28), rgba(255, 255, 255, 0.035)); }
.hub-puzzle-card { background-image: linear-gradient(135deg, rgba(154, 79, 186, 0.28), rgba(255, 255, 255, 0.035)); }
.hub-wordle-card { background-image: linear-gradient(135deg, rgba(83, 141, 78, 0.3), rgba(255, 255, 255, 0.035)); }

@media (max-width: 720px) {
  .game-hub-content {
    padding: 70px 18px 24px;
  }
}

@media (max-width: 430px) {
  .game-hub-grid {
    gap: 10px;
  }

  .game-hub-card {
    min-height: 120px;
    padding: 14px 8px;
  }

  .game-hub-content {
    padding: 70px 14px 20px;
  }
}

@media (max-width: 270px) {
  .game-hub-grid {
    grid-template-columns: 1fr;
  }
}
</style>
