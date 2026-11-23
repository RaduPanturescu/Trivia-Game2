<script setup lang="ts">
/** Millionaire registration screen. The contestant enters a name, then the game starts. The logo returns to the hub. */
import { useRouter } from 'vue-router'
import { AppButton, AppScreen, ScreenTitle } from '@/shared/components'
import { SFX, useAudio } from '@/shared/composables/useAudio'
import { MAX_NAME_LENGTH, useMillionaireRegistration } from './useMillionaireRegistration'
import { useMillionaireFlow } from './useMillionaireAudio'

const router = useRouter()
useMillionaireFlow()
const { name, preview, canContinue, starting, submit } = useMillionaireRegistration()

/** Plays the click sound and returns to the hub. */
function back(): void {
  useAudio().playSfx(SFX.pop)
  void router.push('/hub')
}
</script>

<template>
  <AppScreen class="millionaire-register-screen">
    <button
      type="button"
      class="millionaire-back"
      aria-label="Back to the game hub"
      @click="back"
    >
      <img
        src="/assets/milionaire%20logo.png"
        alt="Millionaire logo"
        class="millionaire-logo-img"
      >
    </button>
    <div class="millionaire-name-panel">
      <ScreenTitle>Contestant Registration</ScreenTitle>
      <p class="millionaire-subtitle">
        Enter your name to begin the Millionaire challenge.
      </p>
      <input
        id="millionaire-name-input"
        v-model="name"
        class="millionaire-name-input"
        type="text"
        placeholder="Contestant name"
        :maxlength="MAX_NAME_LENGTH"
        @keydown.enter="submit"
      >
      <AppButton
        class="millionaire-continue"
        :disabled="!canContinue"
        @click="submit"
      >
        {{ starting ? 'Starting...' : 'Continue' }}
      </AppButton>
      <p class="millionaire-preview">
        {{ preview }}
      </p>
    </div>
  </AppScreen>
</template>

<style scoped>
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

.millionaire-name-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: calc(100vh - 120px);
  gap: 15px;
  padding: 0 20px;
}

.millionaire-subtitle {
  text-align: center;
  color: var(--text-muted);
  font-size: 1.1rem;
  margin: 15px 0 30px 0;
}

.millionaire-name-input {
  width: 100%;
  max-width: 340px;
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  color: var(--text-main);
  font-size: 1rem;
  margin-top: 10px;
}

.millionaire-name-input::placeholder {
  color: rgba(255,255,255,0.55);
}

.millionaire-preview {
  margin-top: 12px;
  color: var(--secondary);
  text-align: center;
  font-size: 1.1rem;
}

@media (max-width: 600px), (max-height: 500px) {
  .millionaire-name-panel {
    min-height: calc(100dvh - 60px);
  }
}
</style>
