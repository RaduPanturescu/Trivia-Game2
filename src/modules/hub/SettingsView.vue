<script setup lang="ts">
/** Settings screen: background music and sound effect toggles with volume, developer mode, and the reset actions. */
import { AppButton, AppCard, AppScreen, BackButton, RangeSlider, ScreenTitle, ToggleSwitch } from '@/shared/components'
import { SFX, useAudio } from '@/shared/composables/useAudio'
import { useProgress } from '@/shared/progress'
import { resetAllProgress } from '@/shared/resetProgress'
import DevModeCard from './settings/DevModeCard.vue'

const { musicEnabled, musicVolume, soundEnabled, sfxVolume, playSfx } = useAudio()
const { resetProfile } = useProgress()

/** Resets trivia progress and achievements after confirmation. */
async function onResetProfile(): Promise<void> {
  playSfx(SFX.pop)
  if (!confirm('Reset profile and erase all progress? This cannot be undone.')) return
  await resetProfile()
  alert('Profile reset complete. All progress has been cleared.')
}

/** Erases all app data (keeping locked custom workout achievements) after confirmation. Reloads the page. */
function onResetAllProgress(): void {
  playSfx(SFX.pop)
  if (!confirm('Reset every stat, achievement, and workout plan across the app? This is permanent.')) return
  void resetAllProgress()
}
</script>

<template>
  <AppScreen>
    <BackButton to="/" />
    <div class="settings-title">
      <ScreenTitle>Settings</ScreenTitle>
    </div>
    <div class="settings-body">
      <AppCard>
        <ToggleSwitch
          v-model="musicEnabled"
          label="Background Music"
        />
        <RangeSlider
          v-model="musicVolume"
          class="volume-row"
          :class="{ 'volume-row--hidden': !musicEnabled }"
          label="Background music volume"
        />
      </AppCard>
      <AppCard>
        <ToggleSwitch
          v-model="soundEnabled"
          label="Sound Effects"
        />
        <RangeSlider
          v-model="sfxVolume"
          class="volume-row"
          :class="{ 'volume-row--hidden': !soundEnabled }"
          label="Sound effects volume"
        />
      </AppCard>
      <DevModeCard />
      <div class="reset-group">
        <AppButton
          variant="danger"
          block
          class="reset-profile"
          @click="onResetProfile"
        >
          Reset Profile
        </AppButton>
        <AppButton
          variant="danger"
          block
          class="reset-all"
          @click="onResetAllProgress"
        >
          Reset All Progress
        </AppButton>
      </div>
    </div>
  </AppScreen>
</template>

<style scoped>
.settings-title {
  margin-top: 50px;
}

.settings-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 30px;
}

/* Volume row collapses (legacy setVolumeRowVisible): 0.3s fade and height change. */
.volume-row {
  margin-top: 5px;
  overflow: hidden;
  max-height: 50px;
  opacity: 1;
  transition: opacity 0.3s ease, max-height 0.3s ease;
}

.volume-row--hidden {
  max-height: 0;
  opacity: 0;
  pointer-events: none;
}

.reset-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 5px;
}

/* Legacy gradient and softer shadow for Reset All Progress. */
.reset-group .reset-all {
  background: linear-gradient(135deg, #ff7675, #d63031);
  box-shadow: 0 10px 30px rgba(214, 48, 49, 0.25);
}
</style>
