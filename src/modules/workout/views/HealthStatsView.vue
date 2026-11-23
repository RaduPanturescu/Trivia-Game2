<script setup lang="ts">
/** Health Stats screen: weight chart, BMI calculator and the headline workout stats. Logging a weight opens the dialog. */
import { computed, ref } from 'vue'
import { AppScreen, BackButton, ScreenTitle } from '@/shared/components'
import '../workout.css'
import { formatDisplayDate } from '@/shared/dates'
import { formatKilogramStat } from '../core/stats'
import { useWorkoutStore } from '../core/store'
import { BmiCalculator, WeightChart, WeightEntryModal } from '../health'

const store = useWorkoutStore()
const entries = store.bodyWeightEntries
const logOpen = ref(false)

const statRows = computed<[string, string][]>(() => {
  const stats = store.getStatsSnapshot()
  const firstWorkout = store.getFirstWorkoutDate()
  return [
    ['First workout', firstWorkout ? formatDisplayDate(firstWorkout) : 'Not started'],
    ['Workout streak', `${stats.streak} days`],
    ['Completed workouts', String(stats.workouts)],
    ['Completed exercises', String(stats.exercises)],
    ['Total sets', String(stats.sets)],
    ['Total reps', String(stats.reps)],
    ['Total weight moved', `${formatKilogramStat(stats.kg)} kg`],
  ]
})
</script>

<template>
  <AppScreen>
    <BackButton to="/workout" />
    <div class="health-content">
      <ScreenTitle class="health-title">
        Health Stats
      </ScreenTitle>
      <p class="health-subtitle">
        Your weight progress and health measurements
      </p>
      <button
        class="health-log-weight-btn"
        type="button"
        @click="logOpen = true"
      >
        ＋ Log weight
      </button>

      <section class="health-panel weight-chart-panel">
        <WeightChart :entries="entries" />
      </section>

      <BmiCalculator />

      <section class="health-panel weight-history-stats-panel">
        <div class="panel-header">
          <h3>Other Stats</h3>
        </div>
        <dl class="weight-history-stats">
          <div
            v-for="[label, value] in statRows"
            :key="label"
            class="weight-history-stat-row"
          >
            <dt>{{ label }}</dt>
            <dd>{{ value }}</dd>
          </div>
        </dl>
      </section>
    </div>

    <WeightEntryModal
      :open="logOpen"
      @close="logOpen = false"
    />
  </AppScreen>
</template>

<style scoped>
.health-content {
  display: flex;
  flex-direction: column;
  align-self: center;
  gap: 18px;
  width: min(900px, 100%);
  padding-top: 26px;
  padding-bottom: 30px;
}

.health-title {
  margin-top: 8px;
}

.health-subtitle {
  margin: -8px 0 2px;
  text-align: center;
  color: var(--text-muted);
  font-size: 1.1rem;
}

.health-log-weight-btn {
  align-self: center;
  padding: 10px 14px;
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-main);
  font-size: 0.85rem;
  font-weight: 700;
}

.health-log-weight-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.health-panel {
  width: 100%;
  padding: 16px;
  border: 1px solid rgba(0, 206, 201, 0.14);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(28, 27, 49, 0.88), rgba(15, 17, 34, 0.92));
}

.weight-history-stats {
  display: block;
  margin: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.weight-history-stat-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 13px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.weight-history-stat-row dt {
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 600;
}

.weight-history-stat-row dd {
  margin: 0;
  color: var(--text-main);
  font-size: 0.92rem;
  font-weight: 700;
  text-align: right;
}

.weight-history-stat-row:first-child dd {
  color: var(--secondary);
}
</style>
