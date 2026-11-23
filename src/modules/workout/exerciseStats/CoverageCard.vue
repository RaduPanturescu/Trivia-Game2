<script setup lang="ts">
/**
 * Training coverage card: the muscle and fitness radars, the per-area totals, the weekly plan (or all-time logs), week
 * navigation, and the disclosure where areas are assigned and planned exercises are edited.
 */
import { computed, ref, watch } from 'vue'
import { formatDisplayDate, isoDate, parseLocalDate } from '@/shared/dates'
import { getMonday, getWorkoutDayIndex } from '../core/schedule'
import { useWorkoutStore } from '../core/store'
import { exerciseAreas, EXERCISE_AREAS, exerciseKey, type ExerciseArea } from './areas'
import { buildRadarChart, buildWeeklyPlan, findCurrentWeek, getCoverageEntries, RADAR_CENTER, summarizeCoverage, type CoverageMode } from './coverage'
import { formatStatNumber } from './format'
import ManagePlannedExercises from './ManagePlannedExercises.vue'
import { buildCompletedExerciseLogs } from './sync'
import { useExerciseLibrary } from './useExerciseLibrary'
import { updateExerciseStats, useExerciseStats } from './useExerciseStats'

const store = useWorkoutStore()
const { state } = useExerciseStats()
const { library, planned } = useExerciseLibrary()

const mode = ref<CoverageMode>('plan')
const allTime = computed(() => mode.value === 'all')
const week = computed(() => findCurrentWeek(store.program.value))
const entries = computed(() => getCoverageEntries({
  mode: mode.value,
  week: week.value,
  planned: planned.value,
  library: library.value,
  logs: state.value.logs,
  completed: buildCompletedExerciseLogs(store.program.value.weeks),
}))
const summary = computed(() => summarizeCoverage(entries.value, state.value.areas))

/** Radar values: all-time totals become sets per training day, so each chart shows an average. */
const chartCounts = computed(() => (allTime.value && summary.value.days
  ? Object.fromEntries(EXERCISE_AREAS.map((area) => [area, summary.value.counts[area] / summary.value.days]))
  : summary.value.counts))
const measure = computed(() => (allTime.value ? 'average sets per logged training day' : 'planned sets'))
const radars = computed(() => [
  { label: 'Muscle groups', chart: buildRadarChart(EXERCISE_AREAS.slice(0, 10), chartCounts.value) },
  { label: 'Fitness', chart: buildRadarChart(EXERCISE_AREAS.slice(10), chartCounts.value) },
])
const areaRows = computed(() => [...EXERCISE_AREAS]
  .sort((a, b) => summary.value.counts[b] - summary.value.counts[a])
  .map((area) => ({
    area,
    sets: summary.value.counts[area],
    average: summary.value.days ? summary.value.counts[area] / summary.value.days : 0,
  })))
const unassignedText = computed(() => {
  const count = entries.value.length
  const { days, unassigned } = summary.value
  if (!allTime.value) return `${count} planned · ${unassigned} unassigned`
  if (!count) return 'No performances logged yet. Log an exercise to see all-time coverage.'
  return `${days} logged training ${days === 1 ? 'day' : 'days'} · ${count} ${count === 1 ? 'entry' : 'entries'} · ${unassigned} unassigned`
})

const weekLabel = computed(() => (week.value?.weekStart ? `WEEK OF ${formatDisplayDate(week.value.weekStart)}` : 'NO WEEK'))
const isCurrentWeek = computed(() => {
  const start = week.value?.weekStart
  return Boolean(start) && start === store.program.value.currentWeekStart && start === isoDate(getMonday(new Date()))
})
const planItems = computed(() => buildWeeklyPlan(week.value, state.value.areas))

/**
 * Moves the shown week by whole weeks and makes sure it exists.
 * @param direction - `-1` for the previous week, `1` for the next.
 */
function shiftWeek(direction: -1 | 1): void {
  const next = parseLocalDate(store.program.value.currentWeekStart)
  next.setDate(next.getDate() + direction * 7)
  store.viewWeekStart.value = isoDate(next)
  store.selectedDayIndex.value = 0
  store.getViewWeek()
}

/** Shows the week of today and selects today. */
function goToThisWeek(): void {
  const now = new Date()
  store.viewWeekStart.value = isoDate(getMonday(now))
  store.selectedDayIndex.value = getWorkoutDayIndex(now)
  store.getViewWeek()
}

/** Exercises to choose from, one per key. A repeated key keeps the last name, as the legacy map did. */
const choices = computed(() => [...new Map(entries.value.map((entry) => [exerciseKey(entry.name), entry.name] as const))]
  .filter(([key]) => key))
const pickedKey = ref('')
const selectedKey = computed(() => (choices.value.some(([key]) => key === pickedKey.value) ? pickedKey.value : (choices.value[0]?.[0] ?? '')))
const selectedExercise = computed(() => entries.value.find((entry) => exerciseKey(entry.name) === selectedKey.value) ?? null)
const selectedAreas = computed(() => (selectedExercise.value ? exerciseAreas(selectedExercise.value, state.value.areas) : []))
const draft = ref<ExerciseArea[]>([])
watch([selectedKey, selectedAreas], () => {
  draft.value = [...selectedAreas.value]
}, { immediate: true })

/** Saves the ticked areas for the selected exercise. Ticking none leaves it unassigned. */
async function saveAreas(): Promise<void> {
  const key = selectedKey.value
  if (!key) return
  const picked = EXERCISE_AREAS.filter((area) => draft.value.includes(area))
  const saved = await updateExerciseStats((data) => {
    data.areas[key] = picked
  })
  if (!saved) window.alert('Could not save exercise stats. Check your browser storage and try again.')
}

/** Drops the saved areas of the selected exercise, so the automatic guess applies again. */
async function resetAreas(): Promise<void> {
  const key = selectedKey.value
  if (!key) return
  const saved = await updateExerciseStats((data) => {
    delete data.areas[key]
  })
  if (!saved) window.alert('Could not save exercise stats. Check your browser storage and try again.')
}
</script>

<template>
  <section class="exercise-stats-card">
    <div class="exercise-stats-heading">
      <div>
        <span class="exercise-stats-kicker">TRAINING COVERAGE</span>
        <h4>Muscle groups &amp; fitness</h4>
      </div>
      <div
        class="exercise-coverage-mode"
        role="group"
        aria-label="Coverage period"
      >
        <button
          id="exercise-coverage-plan"
          class="chip-btn"
          :class="{ active: !allTime }"
          type="button"
          :aria-pressed="!allTime"
          @click="mode = 'plan'"
        >
          Weekly plan
        </button>
        <button
          id="exercise-coverage-all-time"
          class="chip-btn"
          :class="{ active: allTime }"
          type="button"
          :aria-pressed="allTime"
          @click="mode = 'all'"
        >
          All time
        </button>
      </div>
    </div>
    <div
      v-if="!allTime"
      id="exercise-coverage-navigation"
      class="exercise-coverage-navigation"
    >
      <button
        id="exercise-coverage-prev"
        class="chip-btn"
        type="button"
        @click="shiftWeek(-1)"
      >
        ← Previous week
      </button>
      <button
        v-if="!isCurrentWeek"
        id="exercise-coverage-current"
        class="chip-btn"
        type="button"
        @click="goToThisWeek"
      >
        This week
      </button>
      <button
        id="exercise-coverage-next"
        class="chip-btn"
        type="button"
        @click="shiftWeek(1)"
      >
        Next week →
      </button>
      <span
        id="exercise-coverage-week"
        class="exercise-stats-badge"
      >{{ weekLabel }}</span>
    </div>
    <div class="exercise-coverage-layout">
      <div id="exercise-coverage-chart">
        <div
          v-for="radar in radars"
          :key="radar.label"
          class="exercise-radar"
        >
          <strong>{{ radar.label }}</strong>
          <svg
            viewBox="0 0 320 320"
            role="img"
            :aria-label="`${radar.label} ${measure} radar, scaled to the highest area. See the accompanying list for counts.`"
          >
            <polygon
              v-for="(ring, index) in radar.chart.rings"
              :key="index"
              class="exercise-radar-grid"
              :points="ring"
            />
            <template
              v-for="axis in radar.chart.axes"
              :key="axis.area"
            >
              <line
                class="exercise-radar-grid"
                :x1="RADAR_CENTER"
                :y1="RADAR_CENTER"
                :x2="axis.x"
                :y2="axis.y"
              />
              <text
                :x="axis.labelX"
                :y="axis.labelY"
                text-anchor="middle"
                dominant-baseline="middle"
              >{{ axis.area }}</text>
            </template>
            <polygon
              class="exercise-radar-value"
              :points="radar.chart.value"
            />
          </svg>
        </div>
      </div>
      <div
        id="exercise-coverage-list"
        class="exercise-coverage-list"
      >
        <div
          v-for="row in areaRows"
          :key="row.area"
        >
          <span>{{ row.area }}</span>
          <span class="exercise-coverage-values">
            <strong :class="{ 'exercise-coverage-zero': !row.sets }">{{ formatStatNumber(row.sets) }} sets</strong>
            <small v-if="allTime">{{ formatStatNumber(row.average) }} avg / day</small>
          </span>
        </div>
      </div>
    </div>
    <div
      v-if="!allTime"
      id="exercise-plan-list"
      class="exercise-plan-list"
    >
      <p
        v-if="!planItems.length"
        class="exercise-stats-empty"
      >
        No exercises planned for this week.
      </p>
      <template v-else>
        <article
          v-for="item in planItems"
          :key="item.key"
          class="exercise-plan-item"
        >
          <div>
            <strong>{{ item.name }}</strong>
            <span>{{ item.dayLabel }} · {{ formatDisplayDate(item.date) }}</span>
          </div>
          <div class="exercise-plan-meta">
            <span>{{ formatStatNumber(item.sets) }} × {{ item.repsTillFailure ? 'until failure' : formatStatNumber(item.reps) }}</span>
            <span>{{ item.areas.length ? item.areas.join(' · ') : 'Areas not assigned' }}</span>
          </div>
        </article>
      </template>
    </div>
    <p
      id="exercise-coverage-unassigned"
      class="exercise-stats-help"
    >
      {{ unassignedText }}
    </p>
    <details class="exercise-assignment">
      <summary>Review or change exercises and areas</summary>
      <p class="exercise-stats-help">
        Area assignments apply to exercises with the same name.
      </p>
      <label for="exercise-area-select">Exercise</label>
      <select
        id="exercise-area-select"
        v-model="pickedKey"
      >
        <option
          v-for="[key, label] in choices"
          :key="key"
          :value="key"
        >
          {{ label }}
        </option>
      </select>
      <div
        v-if="selectedExercise"
        id="exercise-area-options"
        class="exercise-area-options"
      >
        <label
          v-for="area in EXERCISE_AREAS"
          :key="area"
        >
          <input
            v-model="draft"
            type="checkbox"
            :value="area"
          > {{ area }}
        </label>
      </div>
      <p
        v-else
        class="exercise-stats-help"
      >
        {{ allTime ? 'Log an exercise' : 'Add exercises to this week' }} to assign areas.
      </p>
      <div class="exercise-area-actions">
        <button
          id="exercise-area-save"
          class="mini-btn"
          type="button"
          :disabled="!selectedExercise"
          @click="saveAreas"
        >
          Save areas
        </button>
        <button
          id="exercise-area-reset"
          class="mini-btn"
          type="button"
          :disabled="!selectedExercise"
          @click="resetAreas"
        >
          Use automatic areas
        </button>
      </div>
      <ManagePlannedExercises />
    </details>
  </section>
</template>
