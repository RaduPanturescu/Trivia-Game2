<script setup lang="ts">
/**
 * Stopwatch and countdown overlay, with the "Timer done!" notice. Teleported to the body and driven by the shared
 * {@link useWorkoutTimer} state, so the dashboard can open it. Pauses the clocks when the user leaves the workout screens.
 */
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useWorkoutTimer } from './useWorkoutTimer'

const {
  timerOpen,
  doneOpen,
  stopwatchMode,
  isCountdown,
  countdownMinutes,
  countdownSeconds,
  countdownRunning,
  displayText,
  progressDegrees,
  startLabel,
  closeTimer,
  closeDone: closeDoneNotice,
  setMode,
  applyCountdownDuration,
  adjustCountdown,
  toggleRun,
  resetClock,
  pauseClocks,
} = useWorkoutTimer()

const face = useTemplateRef<HTMLDivElement>('face')
const startButton = useTemplateRef<HTMLButtonElement>('startButton')
const doneButton = useTemplateRef<HTMLButtonElement>('doneButton')
const displayFontSize = ref('')

/**
 * Sizes the readout to the face, as the legacy app did on every render: larger text when there is room, never below 17px.
 */
function fitDisplay(): void {
  const width = face.value?.clientWidth ?? 0
  const innerWidth = Math.max(80, width - 28)
  const preferred = Math.min(56, Math.max(22, window.innerWidth * (isCountdown.value ? 0.07 : 0.08)))
  const fitted = Math.min(preferred, innerWidth / (displayText.value.length * 0.62))
  displayFontSize.value = `${Math.max(17, fitted)}px`
}

/**
 * Closes the "Timer done!" notice and returns focus to the start button when the overlay is still open.
 */
function closeDone(): void {
  closeDoneNotice()
  if (timerOpen.value) startButton.value?.focus()
}

/**
 * Escape closes the notice first, then the overlay.
 * @param event - The keydown event on the document.
 */
function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  if (doneOpen.value) closeDone()
  else if (timerOpen.value) closeTimer()
}

watch([displayText, isCountdown, timerOpen], fitDisplay, { flush: 'post' })

watch(doneOpen, async (open) => {
  if (!open) return
  await nextTick()
  doneButton.value?.focus()
})

watch([timerOpen, doneOpen], ([overlayOpen, noticeOpen]) => {
  document.body.classList.toggle('workout-overlay-open', overlayOpen || noticeOpen)
})

onBeforeRouteLeave((to) => {
  if (to.meta.music !== 'workout') pauseClocks()
})

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('workout-overlay-open')
})

</script>

<template>
  <Teleport to="body">
    <div
      v-if="timerOpen"
      class="workout-timer-overlay"
      @click.self="closeTimer"
    >
      <section
        class="workout-timer-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workout-timer-title"
      >
        <div class="workout-timer-window-header">
          <h3 id="workout-timer-title">
            ⏱️ Stopwatch
          </h3>
          <button
            class="timer-close-btn"
            type="button"
            aria-label="Close stopwatch"
            @click="closeTimer"
          >
            ×
          </button>
        </div>
        <div
          class="workout-stopwatch-mode-switch"
          :class="{ 'countdown-mode': isCountdown }"
          role="group"
          aria-label="Timer mode"
        >
          <button
            type="button"
            :class="{ active: stopwatchMode === 'stopwatch' }"
            :aria-pressed="stopwatchMode === 'stopwatch'"
            @click="setMode('stopwatch')"
          >
            Stopwatch
          </button>
          <button
            type="button"
            :class="{ active: isCountdown }"
            :aria-pressed="isCountdown"
            @click="setMode('countdown')"
          >
            Timer
          </button>
        </div>
        <label
          v-show="isCountdown"
          class="workout-timer-duration-control"
        >
          <span>Countdown duration</span>
          <span class="workout-duration-inputs">
            <span class="workout-duration-stepper">
              <input
                v-model.number="countdownMinutes"
                type="number"
                min="0"
                max="59"
                aria-label="Minutes"
                :disabled="countdownRunning"
                @change="applyCountdownDuration"
              >
              <button
                class="workout-duration-adjust"
                type="button"
                data-step="1"
                aria-label="Increase minutes"
                :disabled="countdownRunning"
                @click="adjustCountdown('minutes', 1)"
              >
                ⌃
              </button>
              <button
                class="workout-duration-adjust"
                type="button"
                data-step="-1"
                aria-label="Decrease minutes"
                :disabled="countdownRunning"
                @click="adjustCountdown('minutes', -1)"
              >
                ⌄
              </button>
            </span>
            <small>min</small>
            <span class="workout-duration-stepper">
              <input
                v-model.number="countdownSeconds"
                type="number"
                min="0"
                max="59"
                aria-label="Seconds"
                :disabled="countdownRunning"
                @change="applyCountdownDuration"
              >
              <button
                class="workout-duration-adjust"
                type="button"
                data-step="1"
                aria-label="Increase seconds"
                :disabled="countdownRunning"
                @click="adjustCountdown('seconds', 1)"
              >
                ⌃
              </button>
              <button
                class="workout-duration-adjust"
                type="button"
                data-step="-1"
                aria-label="Decrease seconds"
                :disabled="countdownRunning"
                @click="adjustCountdown('seconds', -1)"
              >
                ⌄
              </button>
            </span>
            <small>sec</small>
          </span>
        </label>
        <div
          ref="face"
          class="workout-stopwatch-face"
          :class="{ 'countdown-mode': isCountdown }"
          :style="{ '--timer-progress': progressDegrees }"
        >
          <strong
            class="workout-stopwatch-display"
            :style="{ fontSize: displayFontSize }"
          >{{ displayText }}</strong>
        </div>
        <div class="workout-stopwatch-controls">
          <button
            ref="startButton"
            class="timer-primary-btn"
            type="button"
            @click="toggleRun"
          >
            {{ startLabel }}
          </button>
          <button
            class="timer-secondary-btn"
            type="button"
            @click="resetClock"
          >
            Reset
          </button>
        </div>
      </section>
    </div>
    <div
      v-if="doneOpen"
      class="workout-timer-done-overlay"
    >
      <section
        class="workout-timer-done-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="workout-timer-done-title"
      >
        <h3 id="workout-timer-done-title">
          Timer done!
        </h3>
        <p>Your countdown has finished.</p>
        <button
          ref="doneButton"
          class="timer-primary-btn"
          type="button"
          @click="closeDone"
        >
          OK
        </button>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.workout-timer-overlay {
  position: fixed;
  inset: 0;
  z-index: 6000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(4, 5, 12, 0.76);
  backdrop-filter: blur(8px);
}

.workout-timer-window {
  width: min(420px, 100%);
  padding: 24px;
  border: 1px solid rgba(0,206,201,0.3);
  border-radius: 24px;
  background: linear-gradient(145deg, #171a2c, #0e1120);
  box-shadow: 0 26px 80px rgba(0,0,0,0.55), 0 0 30px rgba(0,206,201,0.12);
  animation: timerWindowIn 0.22s ease-out;
}

@keyframes timerWindowIn {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.workout-timer-window-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.workout-timer-window-header h3 {
  margin: 0;
  color: var(--secondary);
  font-size: 1.1rem;
}

.workout-timer-done-overlay {
  position: fixed;
  inset: 0;
  z-index: 11000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(4, 5, 12, 0.76);
  backdrop-filter: blur(8px);
}

.workout-timer-done-card {
  width: min(360px, 100%);
  padding: 28px;
  border: 1px solid rgba(0, 206, 201, 0.4);
  border-radius: 22px;
  background: linear-gradient(145deg, #171a2c, #0e1120);
  text-align: center;
  box-shadow: 0 26px 80px rgba(0, 0, 0, 0.55);
}

.workout-timer-done-card h3 { color: var(--secondary); }
.workout-timer-done-card p { margin: 12px 0 20px; color: var(--text-muted); }

.timer-close-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: var(--text-main);
  background: rgba(255,255,255,0.08);
  font-size: 1.5rem;
  line-height: 1;
}

.timer-close-btn:hover {
  background: rgba(255,255,255,0.16);
}

.timer-primary-btn {
  width: auto;
  padding: 12px 16px;
  border-radius: 15px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: var(--shadow-neon);
}

.timer-primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 25px rgba(108, 92, 231, 0.7);
}

.timer-secondary-btn {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  color: var(--text-main);
  padding: 10px 14px;
  font-weight: 700;
  font-size: 0.85rem;
}

.timer-secondary-btn:hover {
  background: rgba(255,255,255,0.12);
}

.workout-stopwatch-display {
  display: block;
  margin: 28px 0;
  text-align: center;
  font-size: clamp(3.5rem, 15vw, 5.5rem);
  line-height: 1;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  color: #fff;
  text-shadow: 0 0 24px rgba(0,206,201,0.24);
}

.workout-stopwatch-mode-switch {
  position: relative;
  isolation: isolate;
  display: flex;
  width: min(220px, calc(100% - 16px));
  gap: 4px;
  margin: 18px auto 0;
  padding: 4px;
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  background: rgba(0,0,0,0.24);
}

.workout-stopwatch-mode-switch::before {
  content: '';
  position: absolute;
  z-index: -1;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 6px);
  border-radius: 999px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.workout-stopwatch-mode-switch.countdown-mode::before {
  transform: translateX(calc(100% + 4px));
}

.workout-stopwatch-mode-switch button {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 8px 15px;
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 700;
  transition: color 150ms ease-out;
}

.workout-stopwatch-mode-switch button.active {
  color: #fff;
  background: transparent;
}

.workout-timer-duration-control {
  display: flex;
  width: min(340px, 100%);
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  margin: 18px auto 0;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.workout-timer-duration-control > span:first-child {
  align-self: center;
}

.workout-duration-inputs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.workout-duration-stepper {
  position: relative;
  display: inline-flex;
  flex: 0 0 72px;
  width: 72px;
}

.workout-timer-duration-control input[type="number"] {
  width: 100%;
  padding: 8px 42px 8px 10px;
  border: 1px solid var(--glass-border);
  border-radius: 11px;
  background: linear-gradient(145deg, rgba(20,25,42,0.95), rgba(9,13,25,0.96));
  color: var(--text-main);
  font: inherit;
  font-variant-numeric: tabular-nums;
  appearance: textfield;
  -moz-appearance: textfield;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.workout-timer-duration-control input[type="number"]::-webkit-inner-spin-button,
.workout-timer-duration-control input[type="number"]::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
}

.workout-timer-duration-control input[type="number"]:focus {
  outline: none;
  border-color: rgba(0,206,201,0.7);
  box-shadow: 0 0 0 3px rgba(0,206,201,0.12), 0 0 14px rgba(0,206,201,0.12);
}

.workout-duration-adjust {
  position: absolute;
  top: 50%;
  z-index: 1;
  width: 17px;
  height: 20px;
  padding: 0;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  color: #b9dbe5;
  background: rgba(255,255,255,0.06);
  font-size: 0.68rem;
  font-weight: 900;
  line-height: 1;
  transform: translateY(-50%);
  transition: color 140ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
}

.workout-duration-adjust[data-step="1"] {
  right: 23px;
}

.workout-duration-adjust[data-step="-1"] {
  right: 4px;
}

.workout-duration-adjust:hover {
  color: #fff;
  border-color: rgba(0,206,201,0.45);
  background: rgba(0,206,201,0.18);
  box-shadow: 0 0 10px rgba(0,206,201,0.12);
}

.workout-duration-adjust:active {
  transform: translateY(-50%) scale(0.9);
}

.workout-stopwatch-face {
  --timer-progress: 0deg;
  width: min(224px, 72vw);
  height: min(224px, 72vw);
  aspect-ratio: 1;
  margin: 24px auto 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: transparent;
  overflow: hidden;
}

.workout-stopwatch-face.countdown-mode {
  background: conic-gradient(#00cec9 var(--timer-progress), rgba(255,255,255,0.1) var(--timer-progress));
  box-shadow: 0 0 22px rgba(0,206,201,0.18);
}

.workout-stopwatch-face .workout-stopwatch-display {
  width: calc(100% - 20px);
  height: calc(100% - 20px);
  min-width: 0;
  padding: 0 4px;
  margin: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #101526;
  white-space: nowrap;
  overflow: hidden;
  font-size: clamp(1.35rem, 7vw, 3.1rem);
  letter-spacing: 0;
}

.workout-stopwatch-face:not(.countdown-mode) .workout-stopwatch-display {
  font-size: clamp(1.5rem, 8vw, 3.5rem);
}

.workout-stopwatch-controls {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.workout-stopwatch-controls button {
  flex: 1;
  min-height: 48px;
  width: auto;
}

@media (max-width: 600px), (max-height: 500px) {
  .workout-timer-overlay,
  .workout-timer-done-overlay {
    padding: 12px;
    overflow-y: auto;
    touch-action: auto;
    overscroll-behavior: contain;
  }

  .workout-timer-window,
  .workout-timer-done-card {
    max-height: calc(100dvh - 24px);
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}
</style>
