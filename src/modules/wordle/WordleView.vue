<script setup lang="ts">
/** Daily Wordle screen. Game rules live in `useWordle`; this view wires the board, keyboard, timers and dev controls. */
import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AppButton, AppScreen, BackButton, ScreenTitle } from '@/shared/components'
import { useWordle } from './useWordle'
import WordleBoard from './WordleBoard.vue'
import WordleKeyboard from './WordleKeyboard.vue'

const router = useRouter()
const {
  loaded,
  isDev,
  rows,
  keyStates,
  isComplete,
  message,
  status,
  countdown,
  shake,
  start,
  tick,
  handleKey,
  onPhysicalKey,
  reveal,
  newDevPuzzle,
} = useWordle()

let clock: number | undefined

onMounted(() => {
  void start()
  tick()
  clock = window.setInterval(tick, 1000)
  document.addEventListener('keydown', onPhysicalKey)
})

onBeforeUnmount(() => {
  window.clearInterval(clock)
  document.removeEventListener('keydown', onPhysicalKey)
})

/** Returns to the welcome screen, as the legacy app does. */
function leave(): void {
  void router.push('/')
}
</script>

<template>
  <AppScreen class="wordle-screen">
    <BackButton
      to="/"
      aria-label="Back to welcome screen"
    />
    <div
      v-if="loaded"
      class="wordle-shell"
    >
      <div class="wordle-heading">
        <ScreenTitle class="wordle-title">
          Wordle
        </ScreenTitle>
      </div>
      <div class="wordle-daily-bar">
        <span class="wordle-daily-status">{{ status }}</span>
        <span class="wordle-countdown">{{ countdown }}</span>
      </div>
      <WordleBoard
        :rows="rows"
        :shake="shake"
      />
      <div
        class="wordle-message"
        aria-live="polite"
      >
        {{ message }}
      </div>
      <div
        v-if="isDev"
        class="wordle-dev-controls"
      >
        <button
          type="button"
          @click="reveal"
        >
          Reveal Word
        </button>
        <button
          type="button"
          @click="newDevPuzzle"
        >
          New Dev Puzzle
        </button>
      </div>
      <WordleKeyboard
        :key-states="keyStates"
        :complete="isComplete"
        @key="handleKey"
      />
      <AppButton
        v-if="isComplete"
        class="wordle-return-btn"
        @click="leave"
      >
        Back
      </AppButton>
    </div>
  </AppScreen>
</template>

<style scoped>
.wordle-screen.screen {
  justify-content: flex-start;
  padding: 44px 12px 18px;
  background: radial-gradient(ellipse at 50% 10%, rgba(0, 206, 201, 0.12), transparent 52%);
}

.wordle-shell {
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  max-width: none;
  margin: 0 auto;
  padding: 8px 4px 12px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.wordle-heading {
  margin-bottom: 14px;
  text-align: center;
}

.wordle-heading .wordle-title {
  margin: 0;
  color: #fff;
  font-size: 2rem;
  letter-spacing: 0.08em;
}

.wordle-daily-bar {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 14px 0;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}

/* Hidden in the legacy app too; the status is kept in the DOM for assistive tech. */
.wordle-daily-status {
  display: none;
}

.wordle-countdown {
  text-align: center;
}

.wordle-message {
  min-height: 40px;
  display: grid;
  place-items: center;
  margin: 10px 0 8px;
  color: #f3f3f3;
  text-align: center;
  font-size: 0.87rem;
  font-weight: 700;
}

.wordle-return-btn.app-btn--primary {
  width: auto;
  align-self: center;
  margin: 14px auto 0;
  padding: 11px 24px;
  font-size: 0.95rem;
  animation: wordleReturnPop 0.3s ease both;
}

.wordle-dev-controls {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 4px 0 12px;
}

.wordle-dev-controls button {
  padding: 8px 12px;
  border: 1px solid rgba(0, 206, 201, 0.4);
  border-radius: 9px;
  background: rgba(0, 206, 201, 0.12);
  color: #bafff4;
  font-size: 0.8rem;
  font-weight: 700;
}

.wordle-dev-controls button:hover {
  background: rgba(0, 206, 201, 0.24);
}

@keyframes wordleReturnPop {
  from { opacity: 0; transform: translateY(8px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .wordle-return-btn.app-btn--primary {
    animation-duration: 0.01ms;
  }
}

@media (max-width: 380px) {
  .wordle-shell {
    padding: 8px 2px 10px;
  }
}

@media (max-height: 700px) {
  .wordle-shell {
    padding-top: 0;
  }

  .wordle-heading {
    margin-bottom: 0;
  }

  .wordle-daily-bar {
    margin: 6px 0;
  }

  .wordle-message {
    min-height: 30px;
    margin: 4px 0;
  }
}
</style>
