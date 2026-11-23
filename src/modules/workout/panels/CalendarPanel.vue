<script setup lang="ts">
/** Dashboard panel with the monthly calendar: a month of day statuses, and a dialog that changes one day. */
import '../workout.css'
import { computed } from 'vue'
import { formatDisplayDate } from '@/shared/dates'
import CalendarStatusDialog from '../calendar/CalendarStatusDialog.vue'
import { useWorkoutCalendar } from '../calendar/useWorkoutCalendar'

const { month, editingDate, previousMonth, nextMonth, openStatusEditor, closeStatusEditor, applyStatus } = useWorkoutCalendar()

/** The open day as it is shown in the dialog. */
const editingLabel = computed(() => (editingDate.value ? formatDisplayDate(editingDate.value) : ''))
</script>

<template>
  <details class="workout-panel collapsible-panel calendar-panel">
    <summary class="panel-header">
      <h3>Monthly Calendar</h3>
      <span
        class="collapse-indicator"
        aria-hidden="true"
      >⌄</span>
    </summary>
    <div class="collapsible-content">
      <div class="workout-month-nav">
        <button
          class="chip-btn"
          type="button"
          aria-label="Previous month"
          @click="previousMonth"
        >
          ←
        </button>
        <div class="week-label">
          {{ month.label }}
        </div>
        <button
          class="chip-btn"
          type="button"
          aria-label="Next month"
          @click="nextMonth"
        >
          →
        </button>
      </div>
      <div class="workout-calendar-grid">
        <div
          v-for="weekday in month.weekdays"
          :key="weekday.name"
          class="calendar-weekday"
          :aria-label="weekday.name"
        >
          {{ weekday.initial }}
        </div>
        <template
          v-for="cell in month.cells"
          :key="cell.key"
        >
          <div
            v-if="cell.kind === 'blank'"
            class="calendar-cell muted"
          >
            <span class="calendar-date">·</span>
          </div>
          <button
            v-else
            type="button"
            class="calendar-cell"
            :class="{
              'null-day': cell.nullDay,
              done: cell.done,
              'workout-day': cell.workoutDay,
              'rest-day': cell.restDay,
              missed: cell.missed,
              active: cell.active,
            }"
            :aria-label="cell.label"
            @click="openStatusEditor(cell.date)"
          >
            <span class="calendar-date">{{ cell.day }}</span><span class="calendar-emoji">{{ cell.emoji }}</span>
          </button>
        </template>
      </div>
    </div>
    <CalendarStatusDialog
      v-if="editingDate"
      :date-label="editingLabel"
      @close="closeStatusEditor"
      @choose="applyStatus"
    />
  </details>
</template>

<style scoped>
.workout-month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  max-width: 390px;
  margin: 0 auto 12px;
  padding: 8px 10px;
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  background: rgba(255,255,255,0.035);
}

.workout-month-nav .chip-btn {
  min-width: 42px;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  color: var(--text-main);
  padding: 10px 14px;
  font-weight: 700;
  font-size: 0.85rem;
}

.workout-month-nav .chip-btn:hover {
  background: rgba(255,255,255,0.12);
}

.workout-month-nav .week-label {
  flex: 1;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--secondary);
  text-align: center;
}

.workout-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
  width: min(100%, 390px);
  margin: 0 auto;
}

.calendar-weekday {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 18px;
  color: var(--text-muted);
  font-size: 0.65rem;
  font-weight: 800;
}

.calendar-cell {
  background: rgba(255,255,255,0.04);
  border: 2px solid var(--glass-border);
  border-radius: 9px;
  width: 100%;
  min-width: 0;
  min-height: 0;
  aspect-ratio: 1 / 1;
  padding: 3px 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 0.68rem;
}

.calendar-cell.active {
  border-color: var(--secondary);
  box-shadow: 0 0 12px rgba(0, 206, 201, 0.2);
}

.calendar-cell.muted {
  opacity: 0.4;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.calendar-cell.done {
  background: rgba(0, 184, 148, 0.12);
  border-color: rgba(0, 184, 148, 0.85);
  border-width: 2px;
}

.calendar-cell.workout-day {
  background: rgba(0,184,148,0.1);
  border-color: rgba(0,184,148,0.62);
}

.calendar-cell.workout-day.done {
  background: rgba(0,184,148,0.12);
  border-color: rgba(0,184,148,0.85);
  border-width: 2px;
}

.calendar-cell.workout-day .calendar-emoji {
  color: #79e1b5;
}

.calendar-cell.rest-day {
  background: rgba(92,185,255,0.12);
  border-color: rgba(92,185,255,0.58);
  border-width: 2px;
}

.calendar-cell.rest-day .calendar-emoji {
  color: #9bd8ff;
}

.calendar-cell.null-day:not(.muted) {
  background: rgba(255,255,255,0.025);
  border-color: rgba(255,255,255,0.06);
}

.calendar-cell.missed,
.calendar-cell.missed.active {
  background: rgba(214,48,49,0.07);
  border-color: rgba(255,112,112,0.42);
  border-width: 2px;
  box-shadow: none;
}

.calendar-cell.missed .calendar-emoji {
  color: #e79a96;
  font-size: 0.88rem;
  font-weight: 900;
}

.calendar-cell .calendar-date {
  font-weight: 700;
}

.calendar-cell .calendar-emoji {
  font-size: 0.7rem;
}
</style>
