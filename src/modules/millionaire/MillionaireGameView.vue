<script setup lang="ts">
/** Millionaire play screen: 15 questions with a 3-minute timer, four lifelines, the prize ladder and the ending. */
import { useRouter } from 'vue-router'
import { AppButton, AppScreen } from '@/shared/components'
import { SFX, useAudio } from '@/shared/composables/useAudio'
import { QuestionCard } from '@/shared/quiz'
import { PRIZE_LEVELS } from './data'
import PrizeLadder from './PrizeLadder.vue'
import { contestantName } from './session'
import { useMillionaireFlow } from './useMillionaireAudio'
import { useMillionaireGame, type LifelineId } from './useMillionaireGame'

const router = useRouter()
useMillionaireFlow()
const {
  total,
  questionNumber,
  questionIndex,
  question,
  options,
  timeLabel,
  status,
  lifelines,
  canUseLifeline,
  canSkipSuspense,
  nextVisible,
  nextLabel,
  finished,
  score,
  resultMessage,
  pick,
  useLifeline,
  skipSuspense,
  next,
} = useMillionaireGame()

/** Lifeline buttons in legacy order. */
const lifelineButtons: { id: LifelineId; label: string }[] = [
  { id: 'callFriend', label: 'Call a Friend' },
  { id: 'fiftyFifty', label: '50:50' },
  { id: 'audienceVote', label: 'Audience Vote' },
  { id: 'askHost', label: 'Ask the Host' },
]

/** Plays the click sound and returns to the hub. */
function backToHub(): void {
  useAudio().playSfx(SFX.pop)
  void router.push('/hub')
}

/** Plays the click sound and advances to the next question or the ending. */
function advance(): void {
  useAudio().playSfx(SFX.pop)
  next()
}
</script>

<template>
  <AppScreen
    v-if="!finished"
    class="millionaire-game-screen"
  >
    <button
      type="button"
      class="millionaire-back"
      aria-label="Back to the game hub"
      @click="backToHub"
    >
      <img
        src="/assets/milionaire%20logo.png"
        alt="Millionaire logo"
        class="millionaire-logo-img"
      >
    </button>
    <div class="millionaire-top-group">
      <h2 class="millionaire-title">
        Who wants to be a Milllionaire
      </h2>
      <div class="millionaire-status-row">
        <div class="millionaire-chip">
          Question <span>{{ questionNumber }}</span>/{{ total }}
        </div>
        <div class="millionaire-chip">
          Time left: <span>{{ timeLabel }}</span>
        </div>
      </div>
    </div>
    <div class="millionaire-content">
      <div class="millionaire-main-panel">
        <QuestionCard
          :text="question.q"
          min-height="180px"
        />
        <div class="millionaire-options-grid">
          <button
            v-for="(option, index) in options"
            :key="index"
            type="button"
            class="option-btn"
            :class="[option.state, option.tint, { 'dev-hint': option.devHint }]"
            :disabled="option.disabled"
            :style="option.eliminated ? { opacity: 0.35 } : undefined"
            @click="pick(index)"
          >
            {{ option.text }}
          </button>
        </div>
        <div class="millionaire-lifelines">
          <button
            v-for="line in lifelineButtons"
            :key="line.id"
            type="button"
            class="lifeline-btn"
            :class="{ 'lifeline-used': lifelines[line.id] }"
            :disabled="lifelines[line.id] || !canUseLifeline"
            @click="useLifeline(line.id)"
          >
            {{ line.label }}
          </button>
        </div>
        <AppButton
          v-if="nextVisible"
          class="millionaire-next"
          @click="advance"
        >
          {{ nextLabel }}
        </AppButton>
        <p class="millionaire-status">
          {{ status }}
        </p>
        <button
          v-if="canSkipSuspense"
          type="button"
          class="millionaire-skip-suspense"
          @click="skipSuspense"
        >
          Skip Suspense
        </button>
      </div>
      <PrizeLadder
        :levels="PRIZE_LEVELS"
        :current-index="questionIndex"
        :contestant="contestantName"
      />
    </div>
  </AppScreen>
  <AppScreen
    v-else
    class="millionaire-result-screen"
  >
    <h2 class="millionaire-result-title">
      Millionaire Mode Complete
    </h2>
    <div class="millionaire-score-display">
      <div class="millionaire-score-circle">
        <span class="millionaire-final-score">{{ score }}</span><span class="millionaire-score-total">/{{ total }}</span>
      </div>
    </div>
    <p class="millionaire-result-message">
      {{ resultMessage }}
    </p>
    <AppButton @click="backToHub">
      Back to Main Menu
    </AppButton>
  </AppScreen>
</template>

<style scoped>
/* Legacy `#app.millionaire-active`: the layout class is set on #app while the game is on screen. */
:global(#app.millionaire-active) {
  max-width: 760px;
}

.millionaire-back {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  flex: 0 0 40px;
  aspect-ratio: 1 / 1;
  padding: 0;
  border-radius: 50%;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.millionaire-back:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.millionaire-logo-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.millionaire-top-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin-bottom: 20px;
}

.millionaire-title {
  font-size: 2rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  text-align: center;
  max-width: 100%;
}

.millionaire-status-row {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.millionaire-chip {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.16);
  padding: 14px 20px;
  border-radius: 18px;
  font-size: 0.95rem;
  font-weight: 700;
  min-width: 140px;
  text-align: center;
}

.millionaire-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  flex-wrap: nowrap;
}

.millionaire-main-panel {
  flex: 1.4;
  min-width: 320px;
  display: flex;
  flex-direction: column;
}

:global(#app.millionaire-active) .millionaire-main-panel {
  min-width: 420px;
}

:global(#app.millionaire-active) .millionaire-content {
  gap: 28px;
}

.millionaire-options-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.option-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  padding: 18px 20px;
  border-radius: 12px;
  font-size: 1.1rem;
  text-align: left;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  min-height: 80px;
}

.option-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateX(5px);
}

.option-btn.correct {
  background: var(--correct);
  border-color: var(--correct);
  color: white;
  box-shadow: 0 0 15px rgba(0, 184, 148, 0.4);
}

.option-btn.pending {
  background: rgba(253, 203, 110, 0.15);
  border-color: #fdcb6e;
  color: #fdcb6e;
  box-shadow: 0 0 15px rgba(253, 203, 110, 0.4);
}

.option-btn.wrong {
  background: var(--incorrect);
  border-color: var(--incorrect);
  color: white;
}

.option-btn.audience-vote-correct {
  background: rgba(0, 184, 148, 0.25);
  border-color: rgba(0, 184, 148, 0.5);
  box-shadow: 0 0 15px rgba(0, 184, 148, 0.2);
}

.option-btn.audience-vote-high {
  background: rgba(253, 203, 110, 0.25);
  border-color: rgba(253, 203, 110, 0.5);
  box-shadow: 0 0 15px rgba(253, 203, 110, 0.2);
}

.option-btn.audience-vote-med {
  background: rgba(225, 112, 85, 0.25);
  border-color: rgba(225, 112, 85, 0.5);
  box-shadow: 0 0 15px rgba(225, 112, 85, 0.2);
}

.option-btn.audience-vote-low {
  background: rgba(214, 48, 49, 0.35);
  border-color: rgba(214, 48, 49, 0.6);
  box-shadow: 0 0 15px rgba(214, 48, 49, 0.2);
}

/* Developer outline on the correct answer, as the legacy inline style did. */
.option-btn.dev-hint {
  outline: 3px solid var(--secondary);
  box-shadow: 0 0 15px var(--secondary);
}

.option-btn:disabled {
  cursor: default;
  opacity: 0.7;
}

.millionaire-lifelines {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 20px 0 10px 0;
}

.lifeline-btn {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--glass-border);
  border-radius: 15px;
  padding: 14px 12px;
  font-weight: 700;
  color: var(--text-main);
  transition: transform 0.2s ease, background 0.2s ease, opacity 0.2s ease;
  white-space: normal;
}

.lifeline-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.12);
  transform: translateY(-1px);
}

.lifeline-btn.lifeline-used,
.lifeline-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.millionaire-next {
  margin-top: 0;
}

.millionaire-status {
  text-align: center;
  color: var(--text-muted);
  font-size: 1.1rem;
  margin: 15px 0 30px 0;
}

.millionaire-skip-suspense {
  margin: 10px auto 0;
  width: auto;
  padding: 12px 24px;
  font-size: 1.05rem;
  border-radius: 15px;
  background: var(--accent);
  box-shadow: 0 0 15px rgba(253, 121, 168, 0.4);
  color: var(--text-main);
}

/* Ending screen, legacy `#result-screen` and result rules. */
.millionaire-result-screen {
  justify-content: center;
  align-items: center;
  text-align: center;
}

.millionaire-result-title {
  font-size: 2.5rem;
  background: linear-gradient(to right, #f6d365, #fda085);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 30px;
}

.millionaire-score-display {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 30px;
}

.millionaire-score-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--glass-bg);
  border: 8px solid var(--primary);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 30px rgba(108, 92, 231, 0.4), inset 0 0 30px rgba(108, 92, 231, 0.4);
}

.millionaire-final-score {
  font-size: 4rem;
  font-weight: 800;
}

.millionaire-score-total {
  font-size: 2rem;
  color: var(--text-muted);
  margin-left: 5px;
}

.millionaire-result-message {
  font-size: 1.2rem;
  margin-bottom: 40px;
  color: var(--text-muted);
}

@media (max-width: 600px), (max-height: 500px) {
  .millionaire-result-screen {
    justify-content: safe center;
  }

  :global(#app.millionaire-active) .millionaire-content {
    flex-direction: column-reverse;
    gap: 12px;
  }

  :global(#app.millionaire-active) .millionaire-main-panel {
    width: 100%;
    min-width: 0;
  }

  .millionaire-options-grid {
    grid-template-columns: 1fr;
  }
}
</style>
