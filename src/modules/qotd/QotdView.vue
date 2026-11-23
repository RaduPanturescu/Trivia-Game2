<script setup lang="ts">
/** Question of the Day screen: one question per day, locked after answering except in developer mode. Logic lives in useQotd. */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AppButton, AppScreen, BackButton, ScreenTitle } from '@/shared/components'
import { SFX, useAudio } from '@/shared/composables/useAudio'
import { useDevMode } from '@/shared/devMode'
import { AnswerOptions, QuestionCard } from '@/shared/quiz'
import { type ShownQuestion, useQotd } from './useQotd'

const router = useRouter()
const audio = useAudio()
const { isDev } = useDevMode()
const qotd = useQotd()

const question = ref<ShownQuestion | null>(null)
/** Index of the option the player picked, or `null` until an answer is given. */
const picked = ref<number | null>(null)
const finishLabel = ref('')

onMounted(async () => {
  await qotd.ready
  // Legacy cannot reach this screen while locked (the welcome button is disabled), so send the player back.
  if (qotd.status.value === 'locked') {
    void router.replace('/')
    return
  }
  show(qotd.currentQuestion())
})

/**
 * Displays a question with no answer picked yet.
 * @param next - The question to show.
 */
function show(next: ShownQuestion): void {
  question.value = next
  picked.value = null
  finishLabel.value = ''
}

/**
 * Records the player's pick and reveals the finish button.
 * @param index - Index of the clicked option.
 */
function choose(index: number): void {
  const current = question.value
  if (!current) return
  picked.value = index
  finishLabel.value = qotd.answer(current, index).finishLabel
}

/** Developer only: replaces the question with a new random one. */
function newRandomQuestion(): void {
  audio.playSfx(SFX.pop)
  const next = qotd.devReset()
  if (next) show(next)
}

/** Plays the pop sound and returns to the welcome screen. */
function finish(): void {
  audio.playSfx(SFX.pop)
  void router.push('/')
}
</script>

<template>
  <AppScreen class="qotd-screen">
    <BackButton
      to="/"
      aria-label="Back to main menu"
      class="qotd-back"
    />
    <ScreenTitle>Question of the Day</ScreenTitle>
    <template v-if="question">
      <p class="qotd-category">
        Category: {{ question.category }}
      </p>
      <QuestionCard
        class="qotd-question"
        :text="question.text"
      />
      <AnswerOptions
        :options="question.options"
        :answer="question.answer"
        :selected="picked"
        :dev-hint="isDev"
        @select="choose"
      />
      <AppButton
        v-if="picked !== null"
        class="qotd-finish"
        @click="finish"
      >
        {{ finishLabel }}
      </AppButton>
      <div
        v-if="isDev"
        class="qotd-admin-controls"
      >
        <button
          type="button"
          class="qotd-reset-btn"
          @click="newRandomQuestion"
        >
          New Random Question
        </button>
      </div>
    </template>
  </AppScreen>
</template>

<style scoped>
/* Ported from legacy/style.css (#qotd-screen, .subtitle, .qotd-admin-controls) and legacy/index.html inline styles. */
.qotd-screen .qotd-back {
  position: relative;
  top: 0;
  left: 0;
  margin: 8px 0 20px;
}

.qotd-category {
  text-align: center;
  color: var(--secondary);
  font-size: 1.1rem;
  font-weight: bold;
  margin: 10px 0 30px;
}

.qotd-screen .qotd-question {
  margin-top: 20px;
}

.qotd-screen .qotd-finish {
  margin-top: 20px;
}

.qotd-admin-controls {
  display: flex;
  justify-content: center;
  margin-top: auto;
  padding-top: 16px;
}

.qotd-reset-btn {
  border: 1px solid rgba(119, 205, 255, 0.65);
  background: rgba(92, 185, 255, 0.18);
  color: #d7f1ff;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 0.85rem;
  font-weight: 700;
}

.qotd-reset-btn:hover {
  background: rgba(92, 185, 255, 0.3);
}
</style>
