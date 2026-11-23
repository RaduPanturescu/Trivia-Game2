<script setup lang="ts">
/**
 * Workout menu: dashboard, workout now, health and exercise stats, with today's day status. Ports legacy
 * `updateWorkoutMenuDayStatus` and the menu wiring. Back returns to the welcome screen, the only screen that opens the menu.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AppScreen, BackButton, ScreenTitle } from '@/shared/components'
import { SFX, useAudio } from '@/shared/composables/useAudio'
import type { WorkoutMenuDayStatus } from '../core/schedule'
import { useWorkoutStore } from '../core/store'

const router = useRouter()
const store = useWorkoutStore()
const status = ref<WorkoutMenuDayStatus | null>(null)
const statusLabel = computed(() => status.value?.label ?? 'Checking today')
const statusType = computed(() => (status.value ? (status.value.type ?? 'none') : undefined))

let midnightTimer: number | undefined
let active = true

/**
 * Reads today's status and schedules the next refresh for just after midnight.
 */
function refreshStatus(): void {
  status.value = store.getMenuDayStatus()
  window.clearTimeout(midnightTimer)
  const now = new Date()
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  midnightTimer = window.setTimeout(refreshStatus, midnight.getTime() - now.getTime() + 50)
}

/**
 * Refreshes the status when the tab becomes visible again, in case the day changed while it was hidden.
 */
function onVisibilityChange(): void {
  if (!document.hidden && status.value) refreshStatus()
}

/**
 * Plays the click sound and opens a workout screen.
 * @param path - Route to open.
 */
function open(path: string): void {
  useAudio().playSfx(SFX.pop)
  void router.push(path)
}

onMounted(async () => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  await store.ready
  if (active) refreshStatus()
})

onBeforeUnmount(() => {
  active = false
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.clearTimeout(midnightTimer)
})
</script>

<template>
  <AppScreen class="workout-simple-screen">
    <BackButton to="/" />
    <div class="workout-simple-content">
      <p class="workout-eyebrow">
        YOUR TRAINING SPACE
      </p>
      <ScreenTitle>Workout Program</ScreenTitle>
      <div class="workout-menu-options">
        <button
          class="workout-menu-card workout-menu-card--dashboard"
          type="button"
          @click="open('/workout/dashboard')"
        >
          <strong>Dashboard</strong>
          <small>View and manage your program</small>
        </button>
        <button
          class="workout-menu-card workout-menu-card--now"
          type="button"
          @click="open('/workout/now')"
        >
          <strong>Workout Now</strong>
          <span
            class="workout-day-status"
            :data-day-type="statusType"
          >{{ statusLabel }}</span>
        </button>
        <button
          class="workout-menu-card workout-menu-card--health"
          type="button"
          @click="open('/workout/health')"
        >
          <strong>Health Stats</strong>
        </button>
        <button
          class="workout-menu-card"
          type="button"
          @click="open('/workout/stats')"
        >
          <strong>Exercise Stats</strong>
        </button>
      </div>
    </div>
  </AppScreen>
</template>

<style scoped>
.workout-simple-screen {
  align-items: center;
}

.workout-simple-content {
  width: min(520px, 100%);
  padding: 55px 0 30px;
}

.workout-eyebrow {
  color: var(--secondary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-align: center;
}

.workout-menu-options {
  display: grid;
  gap: 12px;
  margin-top: 46px;
}

.workout-menu-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 24px 18px;
  border: 1px solid rgba(0, 206, 201, 0.2);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(42, 42, 69, 0.9), rgba(20, 23, 41, 0.95));
  text-align: center;
  transition: transform 150ms ease, border-color 150ms ease, background 150ms ease;
}

.workout-menu-card:hover,
.workout-menu-card:focus-visible {
  transform: translateY(-2px);
}

.workout-menu-card--dashboard:hover,
.workout-menu-card--dashboard:focus-visible {
  border-color: #9e8cff;
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.55), rgba(35, 29, 65, 0.98));
  box-shadow: 0 0 24px rgba(108, 92, 231, 0.28);
}

.workout-menu-card--now:hover,
.workout-menu-card--now:focus-visible {
  border-color: #00cec9;
  background: linear-gradient(135deg, rgba(0, 150, 145, 0.5), rgba(20, 38, 48, 0.98));
  box-shadow: 0 0 24px rgba(0, 206, 201, 0.28);
}

.workout-menu-card--health:hover,
.workout-menu-card--health:focus-visible {
  border-color: #ff91a4;
  background: linear-gradient(135deg, rgba(209, 81, 113, 0.5), rgba(50, 25, 45, 0.98));
  box-shadow: 0 0 24px rgba(255, 118, 150, 0.28);
}

.workout-menu-card strong,
.workout-menu-card small {
  display: block;
}

.workout-menu-card strong {
  font-size: 1.05rem;
}

.workout-menu-card small {
  margin-top: 5px;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.workout-day-status {
  margin-top: 5px;
  padding: 4px 8px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 999px;
  background: rgba(255,255,255,0.07);
  color: var(--text-muted);
  font-size: 0.65rem;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
}

.workout-day-status[data-day-type="workout"] {
  color: #9af4cf;
  border-color: rgba(91,220,157,0.4);
  background: rgba(91,220,157,0.12);
}

.workout-day-status[data-day-type="rest"] {
  color: #c9b9ff;
  border-color: rgba(174,151,255,0.4);
  background: rgba(174,151,255,0.12);
}
</style>
