<script setup lang="ts">
/**
 * Workout Now: today's exercises with start, skip and complete controls. Ports legacy `renderWorkoutNow` and
 * `refreshWorkoutNowControls`. The timer and completion logic live in `timer/` and `core/session.ts`.
 */
import { computed, onMounted, ref } from 'vue'
import { AppScreen, BackButton, ScreenTitle } from '@/shared/components'
import { formatDisplayDate } from '@/shared/dates'
import * as session from '../core/session'
import { estimateWorkoutMinutes } from '../core/schedule'
import { useWorkoutStore } from '../core/store'
import type { WorkoutDay } from '../core/types'
import { describeExercise, getExerciseRowControls, useWorkoutTimer } from '../timer'

const store = useWorkoutStore()
const timer = useWorkoutTimer()
const today = new Date()
const todayLabel = formatDisplayDate(today)
const day = ref<WorkoutDay | null>(null)
const loaded = ref(false)

onMounted(async () => {
  await store.ready
  day.value = store.getTodayDay(today)
  loaded.value = true
})

const estimate = computed(() => {
  const current = day.value
  if (current?.type !== 'workout' || current.exercises.length === 0) return null
  return `Estimated workout time: ${estimateWorkoutMinutes(current.exercises)} min`
})

const message = computed(() => {
  const current = day.value
  if (!current || current.type === null) return 'No workout scheduled for today.'
  if (current.type === 'rest') return 'REST DAY, time to rest'
  if (current.exercises.length === 0) return 'No exercises scheduled for today.'
  return null
})

const rows = computed(() => {
  const current = day.value
  if (current?.type !== 'workout') return []
  return current.exercises.map((exercise, index) => ({
    exercise,
    index,
    details: describeExercise(exercise),
    controls: getExerciseRowControls(exercise, timer.exerciseTimerState(current, index)),
  }))
})

/**
 * Starts the phase timer for an exercise of today.
 * @param index - Index of the exercise in today's list.
 */
function start(index: number): void {
  if (day.value) timer.startExercise(day.value, index)
}

/**
 * Completes an exercise, or after confirmation clears its completion. Legacy `completeWorkoutExercise`.
 * @param index - Index of the exercise in today's list.
 */
function complete(index: number): void {
  const current = day.value
  const exercise = current?.exercises[index]
  if (!current || !exercise) return
  if (!exercise.completed) {
    timer.completeExercise(current, index)
  } else if (window.confirm(`Undo completion of “${exercise.name}”? Its reps, sets, and weight contribution will be removed from your stats.`)) {
    session.undoExercise(store, current, index)
  }
}
</script>

<template>
  <AppScreen class="workout-simple-screen">
    <BackButton to="/workout" />
    <div class="workout-simple-content workout-now-content">
      <p class="workout-eyebrow">
        TODAY'S PLAN
      </p>
      <ScreenTitle>Workout Now</ScreenTitle>
      <p class="workout-now-date">
        {{ todayLabel }}
      </p>
      <p
        v-if="estimate"
        class="workout-now-estimate"
        title="Includes set time and rest between sets, rounded up to 5 minutes."
      >
        {{ estimate }}
      </p>
      <div
        v-if="loaded"
        class="workout-now-list"
      >
        <template v-if="message">
          <p
            v-if="day?.type === 'rest'"
            class="workout-now-rest"
          >
            {{ message }}
          </p>
          <div
            v-else
            class="workout-now-message"
          >
            {{ message }}
          </div>
        </template>
        <ol
          v-else
          class="workout-now-exercises"
        >
          <li
            v-for="row in rows"
            :key="row.index"
            :class="{ completed: row.controls.completed, resting: row.controls.resting }"
          >
            <strong>{{ row.exercise.name }}</strong>
            <span>{{ row.details }}</span>
            <div class="exercise-start-control workout-now-controls">
              <button
                class="start-btn"
                type="button"
                :disabled="row.controls.startDisabled"
                @click="start(row.index)"
              >
                {{ row.controls.startLabel }}
              </button>
              <button
                v-if="row.controls.skipVisible"
                class="skip-workout-phase-btn"
                type="button"
                @click="timer.skipPhase"
              >
                Skip Timer →
              </button>
              <button
                class="complete-exercise-btn"
                :class="{ 'is-completed': row.controls.completed }"
                type="button"
                @click="complete(row.index)"
              >
                {{ row.controls.completeLabel }}
              </button>
            </div>
          </li>
        </ol>
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

.workout-now-date {
  margin: 15px 0 26px;
  color: var(--text-muted);
  font-size: 1.1rem;
  text-align: center;
}

.workout-now-list {
  color: var(--text-muted);
  text-align: center;
}

.workout-now-message {
  margin: 0;
}

.workout-now-estimate {
  margin: -10px 0 20px;
  color: var(--secondary);
  font-size: 0.9rem;
  font-weight: 700;
  text-align: center;
}

.workout-now-exercises {
  display: grid;
  gap: 10px;
  padding: 0;
  list-style: none;
  counter-reset: workout-exercise;
  text-align: left;
}

.workout-now-exercises li {
  counter-increment: workout-exercise;
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 4px 12px;
  align-items: center;
  padding: 16px;
  border: 1px solid rgba(0, 206, 201, 0.2);
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
}

.workout-now-exercises li::before {
  content: counter(workout-exercise);
  grid-row: span 2;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(0,206,201,0.12);
  color: var(--secondary);
  font-weight: 800;
}

.workout-now-exercises strong {
  color: var(--text-main);
}

.workout-now-exercises li span {
  font-size: 0.82rem;
  line-height: 1.5;
}

.exercise-start-control {
  grid-column: 1;
  grid-row: 4;
  justify-self: start;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.workout-now-controls {
  grid-column: 1 / -1;
  grid-row: auto;
  justify-self: stretch;
  margin-top: 8px;
  flex-wrap: wrap;
}

.workout-now-controls .start-btn {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 700;
  font-size: 0.8rem;
}

.workout-now-exercises li.resting .start-btn {
  background: linear-gradient(135deg, #008f70, #00b894);
  cursor: default;
}

.workout-now-controls .complete-exercise-btn {
  margin-left: auto;
  padding: 8px 12px;
  border: 1px solid rgba(0,184,148,0.7);
  border-radius: 10px;
  color: #e3fff4;
  background: linear-gradient(135deg, #008f70, #00b894);
  font-size: 0.8rem;
  font-weight: 800;
}

.workout-now-controls .complete-exercise-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #00a982, #00c99c);
}

.workout-now-controls .complete-exercise-btn.is-completed {
  border-color: rgba(0,184,148,0.42);
  background: rgba(0,184,148,0.38);
}

.workout-now-controls .complete-exercise-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.workout-now-controls .skip-workout-phase-btn {
  margin-top: 0;
  padding: 7px 11px;
  border: 1px solid rgba(92,185,255,0.45);
  border-radius: 9px;
  color: #ccecff;
  background: rgba(92,185,255,0.12);
  font-size: 0.75rem;
  font-weight: 700;
}

.workout-now-controls .skip-workout-phase-btn:hover {
  background: rgba(92,185,255,0.24);
}

.workout-now-rest {
  padding: 36px 16px;
  border: 1px solid rgba(0,206,201,0.2);
  border-radius: 18px;
  background: rgba(0,206,201,0.06);
  color: var(--secondary);
  font-size: 1.2rem;
  font-weight: 800;
}
</style>
