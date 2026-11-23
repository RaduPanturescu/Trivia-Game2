<script setup lang="ts">
/**
 * Day-status dialog of the monthly calendar: pick missed, completed or rest for one day. Locks page scroll while open,
 * closes on backdrop click or Escape, and focuses the first choice. Presentational; the caller applies the choice.
 */
import { nextTick, onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import type { CalendarStatusChoice } from './dayStatus'

defineProps<{ dateLabel: string }>()

const emit = defineEmits<{ close: []; choose: [choice: CalendarStatusChoice] }>()

const firstChoice = useTemplateRef<HTMLButtonElement>('firstChoice')

/** Closes on Escape, as legacy did from the document. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close')
}

onMounted(async () => {
  document.body.classList.add('workout-overlay-open')
  document.addEventListener('keydown', onKeydown)
  await nextTick()
  firstChoice.value?.focus()
})

onBeforeUnmount(() => {
  document.body.classList.remove('workout-overlay-open')
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      class="workout-calendar-status-overlay"
      @click.self="emit('close')"
      @wheel.prevent
      @touchmove.prevent
    >
      <section
        class="workout-calendar-status-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workout-calendar-status-title"
      >
        <button
          class="timer-close-btn"
          type="button"
          aria-label="Close day status menu"
          @click="emit('close')"
        >
          ×
        </button>
        <h3 id="workout-calendar-status-title">
          Update workout status
        </h3>
        <p>{{ dateLabel }}</p>
        <div class="workout-calendar-status-actions">
          <button
            ref="firstChoice"
            type="button"
            data-calendar-status="missed"
            class="mini-btn"
            @click="emit('choose', 'missed')"
          >
            Missed Workout
          </button>
          <button
            type="button"
            data-calendar-status="completed"
            class="mini-btn"
            @click="emit('choose', 'completed')"
          >
            Completed Workout
          </button>
          <button
            type="button"
            data-calendar-status="rest"
            class="mini-btn"
            @click="emit('choose', 'rest')"
          >
            Rest Day
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.workout-calendar-status-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(5, 7, 15, 0.76);
  backdrop-filter: blur(8px);
  overscroll-behavior: contain;
  touch-action: none;
}

.workout-calendar-status-dialog {
  position: relative;
  width: min(390px, 100%);
  padding: 24px;
  border: 1px solid rgba(0,206,201,0.35);
  border-radius: 22px;
  background: linear-gradient(145deg, #171a2c, #0e1120);
  box-shadow: 0 24px 70px rgba(0,0,0,0.55), 0 0 28px rgba(0,206,201,0.12);
  text-align: center;
}

.workout-calendar-status-dialog > .timer-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
}

.workout-calendar-status-dialog h3 {
  margin: 0 34px 8px;
  color: var(--secondary);
  font-size: 1.1rem;
}

.workout-calendar-status-dialog p {
  margin: 0 0 18px;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.workout-calendar-status-actions {
  display: grid;
  gap: 9px;
}

.workout-calendar-status-actions .mini-btn {
  min-height: 42px;
  background: rgba(255,255,255,0.06);
}

.workout-calendar-status-actions [data-calendar-status="completed"] {
  border-color: rgba(0,184,148,0.55);
  background: rgba(0,184,148,0.14);
}

.workout-calendar-status-actions [data-calendar-status="rest"] {
  border-color: rgba(92,185,255,0.55);
  background: rgba(92,185,255,0.14);
}

.workout-calendar-status-actions [data-calendar-status="missed"] {
  border-color: rgba(255,112,112,0.4);
  background: rgba(214,48,49,0.08);
}

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

@media (max-width: 600px), (max-height: 500px) {
  .workout-calendar-status-overlay {
    padding: 12px;
    overflow-y: auto;
    touch-action: auto;
    overscroll-behavior: contain;
  }

  .workout-calendar-status-dialog {
    max-height: calc(100dvh - 24px);
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}
</style>
