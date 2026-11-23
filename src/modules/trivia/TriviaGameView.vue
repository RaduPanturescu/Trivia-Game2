<script setup lang="ts">
/**
 * One category round: ten questions, then the result screen in the same route.
 * Legacy `#game-screen` and `#result-screen`.
 */
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AppButton, AppScreen } from '@/shared/components'
import { SFX, useAudio } from '@/shared/composables/useAudio'
import { useDevMode } from '@/shared/devMode'
import { AnswerOptions, QuestionCard, QuizProgress } from '@/shared/quiz'
import { parseRound } from './categories'
import { PASS_SCORE, useTriviaGame } from './useTriviaGame'

const PASS_GRADIENT = 'linear-gradient(to right, #00b894, #00cec9)'
const FAIL_GRADIENT = 'linear-gradient(to right, #d63031, #e17055)'

const route = useRoute()
const router = useRouter()
const audio = useAudio()
const { isDev } = useDevMode()

const round = parseRound(route.params.category, route.query.diff)
if (!round) throw new Error('Trivia play route without a valid round')

const {
  current,
  questionNumber,
  total,
  isLast,
  score,
  selected,
  finished,
  passed,
  start,
  choose,
  next,
} = useTriviaGame(round.category, round.difficulty)

const resultTitle = computed(() => (passed.value ? 'Category Complete!' : 'Better luck next time'))
const resultMessage = computed(() =>
  passed.value ? 'Great job! You passed the challenge.' : `You need ${PASS_SCORE} correct answers to pass.`,
)

onMounted(() => {
  void start()
})

/** Asks before leaving the round. Progress is not saved, as in the legacy app. */
function exit(): void {
  audio.playSfx(SFX.pop)
  if (window.confirm("Are you sure you want to exit? Your progress won't be saved.")) {
    void router.push({ name: 'trivia' })
  }
}

/** Plays the pop sound and moves to the next question, or to the result. */
function onNext(): void {
  audio.playSfx(SFX.pop)
  next()
}

/** Plays the pop sound and returns to the welcome screen, where legacy "Back to Main Menu" pointed. */
function finishRound(): void {
  audio.playSfx(SFX.pop)
  void router.push({ name: 'welcome' })
}
</script>

<template>
  <AppScreen
    v-if="!finished"
    class="trivia-game-screen"
  >
    <QuizProgress
      :current="questionNumber"
      :total="total"
      @exit="exit"
    />
    <template v-if="current">
      <QuestionCard :text="current.q" />
      <AnswerOptions
        :options="current.options"
        :answer="current.answer"
        :selected="selected"
        :dev-hint="isDev"
        @select="choose"
      />
    </template>
    <AppButton
      v-if="selected !== null"
      @click="onNext"
    >
      {{ isLast ? 'Finish' : 'Continue to Next Question' }}
    </AppButton>
  </AppScreen>
  <AppScreen
    v-else
    class="trivia-result-screen"
  >
    <div class="trivia-result">
      <h2
        class="result-title"
        :style="{ background: passed ? PASS_GRADIENT : FAIL_GRADIENT, WebkitBackgroundClip: 'text' }"
      >
        {{ resultTitle }}
      </h2>
      <div class="score-display">
        <div class="score-circle">
          <span class="final-score">{{ score }}</span><span class="score-total">/10</span>
        </div>
      </div>
      <p class="result-message">
        {{ resultMessage }}
      </p>
      <AppButton @click="finishRound">
        Back to Main Menu
      </AppButton>
    </div>
  </AppScreen>
</template>

<style scoped>
.trivia-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  width: 100%;
}

.result-title {
  font-size: 2.5rem;
  -webkit-text-fill-color: transparent;
  margin-bottom: 30px;
}

.score-display {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 30px;
}

.score-circle {
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

.final-score {
  font-size: 4rem;
  font-weight: 800;
}

.score-total {
  font-size: 2rem;
  color: var(--text-muted);
  margin-left: 5px;
}

.result-message {
  font-size: 1.2rem;
  margin-bottom: 40px;
  color: var(--text-muted);
}
</style>
