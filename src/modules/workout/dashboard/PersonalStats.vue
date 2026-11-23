<script setup lang="ts">
/** "Personal Stats" panel of the dashboard: streak, workouts, sets, reps and kilograms moved. */
import { computed } from 'vue'
import { formatKilogramStat } from '../core/stats'
import type { WorkoutDashboardApi } from './useDashboard'

const props = defineProps<{ dashboard: WorkoutDashboardApi }>()
const { stats } = props.dashboard
const kg = computed(() => formatKilogramStat(stats.value.kg))
</script>

<template>
  <section class="workout-panel personal-stats-panel">
    <div class="panel-header">
      <h3>Personal Stats</h3>
    </div>
    <div class="workout-metrics">
      <div class="metric-card">
        <span>🔥 Streak</span>
        <strong id="workout-streak-count">{{ stats.streak }}</strong>
      </div>
      <div class="metric-card">
        <span>💪 Workouts</span>
        <strong id="workout-total-days">{{ stats.workouts }}</strong>
      </div>
      <div class="metric-card">
        <span>Sets</span>
        <strong id="workout-total-sets">{{ stats.sets }}</strong>
      </div>
      <div class="metric-card">
        <span>Reps</span>
        <strong id="workout-total-reps">{{ stats.reps }}</strong>
      </div>
      <div class="metric-card">
        <span>KG Moved</span>
        <strong id="workout-total-kg">{{ kg }}</strong>
      </div>
    </div>
  </section>
</template>
