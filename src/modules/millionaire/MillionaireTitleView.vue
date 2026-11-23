<script setup lang="ts">
/** Millionaire title screen. Plays the intro, then moves on to contestant registration. Skip is shown in developer mode. */
import { useRouter } from 'vue-router'
import { AppScreen } from '@/shared/components'
import { useMillionaireFlow } from './useMillionaireAudio'
import { useMillionaireTitle } from './useMillionaireTitle'

const router = useRouter()
useMillionaireFlow()
const { canSkip, skip } = useMillionaireTitle(() => {
  void router.replace({ name: 'millionaire-register' })
})
</script>

<template>
  <AppScreen class="millionaire-title-screen">
    <div class="millionaire-title-center">
      <h1 class="millionaire-title-text">
        Who wants to be a Milllionaire
      </h1>
      <p class="millionaire-subtitle">
        Preparing the game experience... Please wait.
      </p>
      <button
        v-if="canSkip"
        type="button"
        class="millionaire-skip-intro"
        @click="skip"
      >
        Skip Intro
      </button>
    </div>
  </AppScreen>
</template>

<style scoped>
.millionaire-title-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: calc(100vh - 120px);
  gap: 15px;
}

.millionaire-title-text {
  font-size: 3rem;
  font-weight: 800;
  text-align: center;
  margin-top: 40px;
  background: linear-gradient(to right, var(--secondary), var(--primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 10px rgba(108, 92, 231, 0.4));
  line-height: 1.1;
}

.millionaire-subtitle {
  text-align: center;
  color: var(--text-muted);
  font-size: 1.1rem;
  margin: 20px 0 30px 0;
}

.millionaire-skip-intro {
  margin-top: 20px;
  width: auto;
  padding: 12px 24px;
  font-size: 1rem;
  border-radius: 15px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  box-shadow: var(--shadow-neon);
  position: relative;
  z-index: 10;
}

@media (max-width: 600px), (max-height: 500px) {
  .millionaire-title-center {
    min-height: calc(100dvh - 60px);
  }
}
</style>
