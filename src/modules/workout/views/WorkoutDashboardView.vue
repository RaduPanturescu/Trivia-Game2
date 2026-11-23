<script setup lang="ts">
/**
 * Workout dashboard (`/workout/dashboard`): the header, personal stats, the viewed week and its days, today's exercises
 * for the selected day, then the program builder, calendar, achievements and saved plans panels, as in the legacy layout.
 */
import { onMounted, ref } from 'vue'
import { AppScreen, BackButton } from '@/shared/components'
import { useProgramResets } from '../builder/useProgramResets'
import DayDetail from '../dashboard/DayDetail.vue'
import DayStrip from '../dashboard/DayStrip.vue'
import PersonalStats from '../dashboard/PersonalStats.vue'
import { useWorkoutDashboard } from '../dashboard/useDashboard'
import { useDayDetail } from '../dashboard/useDayDetail'
import { WeightButton } from '../health'
import AchievementsPanel from '../panels/AchievementsPanel.vue'
import CalendarPanel from '../panels/CalendarPanel.vue'
import ProgramBuilderPanel from '../panels/ProgramBuilderPanel.vue'
import SavedPlansPanel from '../panels/SavedPlansPanel.vue'
import { useWorkoutTimer, WorkoutTimerModal } from '../timer'
import '../workout.css'
import '../dashboard/dashboard.css'

const dashboard = useWorkoutDashboard()
const detail = useDayDetail(dashboard.selectedDay)
const timer = useWorkoutTimer()
const { startNewProgram } = useProgramResets()
const { weekLabel, showCurrentWeekButton, previousWeek, nextWeek, goToCurrentWeek } = dashboard
const loaded = ref(false)

onMounted(async () => {
  await dashboard.open()
  loaded.value = true
})
</script>

<template>
  <AppScreen
    id="workout-screen"
    class="workout-screen"
  >
    <BackButton to="/workout" />
    <div class="workout-shell">
      <div class="workout-header-row">
        <div>
          <h2 class="screen-title workout-title">
            Workout Dashboard
          </h2>
        </div>
        <div class="workout-header-actions">
          <WeightButton />
          <button
            id="workout-new-program-btn"
            class="mini-btn"
            type="button"
            @click="startNewProgram"
          >
            New Program
          </button>
          <button
            id="workout-timer-open-btn"
            class="mini-btn"
            type="button"
            aria-label="Open stopwatch"
            @click="timer.openTimer()"
          >
            ⏱️ Timer
          </button>
        </div>
      </div>

      <template v-if="loaded">
        <PersonalStats :dashboard="dashboard" />

        <div class="workout-week-nav">
          <button
            id="workout-prev-week-btn"
            class="chip-btn"
            type="button"
            @click="previousWeek"
          >
            ← Prev
          </button>
          <div
            id="workout-week-label"
            class="week-label"
          >
            {{ weekLabel }}
          </div>
          <button
            v-if="showCurrentWeekButton"
            id="workout-current-week-btn"
            class="chip-btn current-week-btn"
            type="button"
            @click="goToCurrentWeek"
          >
            This Week
          </button>
          <button
            id="workout-next-week-btn"
            class="chip-btn"
            type="button"
            @click="nextWeek"
          >
            Next →
          </button>
        </div>

        <DayStrip :dashboard="dashboard" />

        <div class="workout-main-grid">
          <DayDetail :detail="detail" />
          <ProgramBuilderPanel />
          <CalendarPanel />
          <AchievementsPanel />
          <SavedPlansPanel />
        </div>
      </template>
    </div>
    <WorkoutTimerModal />
  </AppScreen>
</template>
