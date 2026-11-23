<script setup lang="ts">
/**
 * Exercise stats screen: training coverage, the training log, the history, one-rep maxes and the cardio log. Loads the
 * stored stats and makes sure the shown week exists, as the legacy screen did when it opened.
 */
import { onMounted } from 'vue'
import { AppScreen, BackButton, ScreenTitle } from '@/shared/components'
import CardioRuns from '../exerciseStats/CardioRuns.vue'
import CoverageCard from '../exerciseStats/CoverageCard.vue'
import HistoryGrid from '../exerciseStats/HistoryGrid.vue'
import MaxesCard from '../exerciseStats/MaxesCard.vue'
import TrainingLogForm from '../exerciseStats/TrainingLogForm.vue'
import { loadExerciseStats } from '../exerciseStats/useExerciseStats'
import { useWorkoutStore } from '../core/store'

const store = useWorkoutStore()

onMounted(async () => {
  await store.ready
  store.getViewWeek()
  await loadExerciseStats()
})
</script>

<template>
  <AppScreen class="exercise-stats-screen">
    <BackButton
      to="/workout"
      aria-label="Back to workout menu"
    />
    <div class="exercise-stats-content">
      <ScreenTitle>Exercise Stats</ScreenTitle>
      <div class="exercise-stats-intro">
        <div><h3>Track progress and plan balance.</h3></div>
      </div>
      <CoverageCard />
      <TrainingLogForm />
      <HistoryGrid />
      <MaxesCard />
      <CardioRuns />
    </div>
  </AppScreen>
</template>

<style scoped>
/* Ported from legacy/exercise-stats.css. Child cards render inside this screen, so their rules use :deep(). */
.exercise-stats-screen { align-items: center; }
.exercise-stats-content { display: grid; gap: 16px; width: min(900px, 100%); padding: 26px 0 30px; }
.exercise-stats-content > .screen-title { margin: 8px 0 0; }
:deep(.exercise-stats-intro), :deep(.exercise-stats-heading) { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
:deep(.exercise-stats-intro) { padding: 8px 2px 2px; }
:deep(.exercise-stats-intro h3) { margin: 4px 0; font-size: 1.25rem; }
:deep(.exercise-stats-intro p), :deep(.exercise-stats-help) { color: var(--text-muted); font-size: .82rem; line-height: 1.5; }
:deep(.exercise-stats-kicker) { color: var(--secondary); font-size: 1.05rem; letter-spacing: .08em; font-weight: 800; }
:deep(.exercise-stats-badge) { color: #a7f4ef; background: rgba(0, 206, 201, .1); border: 1px solid rgba(0, 206, 201, .2); border-radius: 30px; padding: 6px 10px; white-space: nowrap; font-size: .65rem; font-weight: 800; letter-spacing: .04em; }
:deep(.exercise-stats-card) { min-width: 0; padding: 20px; border: 1px solid rgba(255,255,255,.09); border-radius: 16px; background: linear-gradient(145deg, rgba(255,255,255,.045), rgba(255,255,255,.015)); }
:deep(.exercise-stats-card h4) { margin: 5px 0 10px; font-size: 1.05rem; }
:deep(.exercise-stats-card h4.exercise-max-subheading) { font-size: .85rem; }
:deep(.exercise-stats-card > .exercise-stats-help) { margin: 0 0 14px; }
:deep(.exercise-coverage-layout) { display: grid; grid-template-columns: minmax(0, 1fr) minmax(180px, .7fr); gap: 14px; align-items: center; }
:deep(.exercise-coverage-navigation) { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 12px; }
:deep(.exercise-coverage-mode) { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin: 0; }
:deep(.exercise-coverage-mode .active) { border-color: var(--secondary); color: #b6f4f0; background: rgba(0,206,201,.15); }
:deep(.exercise-coverage-list .exercise-coverage-values) { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; border: 0; padding: 0; }
:deep(.exercise-coverage-values small) { color: var(--text-muted); font-size: .68rem; white-space: nowrap; }
:deep(#exercise-coverage-chart) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; }
:deep(.exercise-radar) { min-width: 0; text-align: center; color: var(--text-muted); font-size: .77rem; }
:deep(.exercise-radar svg) { display: block; width: 100%; overflow: visible; }
:deep(.exercise-radar text) { fill: #c6c8d7; font: 10px 'Outfit', sans-serif; }
:deep(.exercise-radar-grid) { fill: none; stroke: rgba(255,255,255,.15); stroke-width: 1; }
:deep(.exercise-radar-value) { fill: rgba(0,206,201,.24); stroke: #42d9d2; stroke-width: 2; stroke-linejoin: round; }
:deep(.exercise-coverage-list) { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 7px 12px; }
:deep(.exercise-coverage-list div) { display: flex; justify-content: space-between; gap: 8px; border-bottom: 1px solid rgba(255,255,255,.06); padding: 4px 0; font-size: .74rem; }
:deep(.exercise-coverage-list strong) { color: #a7f4ef; white-space: nowrap; }
:deep(.exercise-coverage-list strong.exercise-coverage-zero) { color: #e6ae90; }
:deep(.exercise-assignment) { border-top: 1px solid rgba(255,255,255,.09); margin-top: 12px; padding-top: 12px; }
:deep(.exercise-assignment summary) { cursor: pointer; color: #b6f4f0; font-size: .83rem; font-weight: 800; }
:deep(.exercise-assignment > label) { display: block; color: var(--text-muted); font-size: .8rem; margin: 12px 0 6px; }
:deep(.exercise-assignment select) { width: min(100%, 350px); }
:deep(.exercise-area-options) { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
:deep(.exercise-area-options label) { padding: 6px 9px; border-radius: 8px; background: rgba(255,255,255,.05); font-size: .76rem; }
:deep(.exercise-area-options input) { accent-color: #00cec9; }
:deep(.exercise-area-actions) { display: flex; flex-wrap: wrap; gap: 8px; }
:deep(.exercise-review-form) { border-top: 1px solid rgba(255,255,255,.09); padding-top: 16px; margin-top: 18px; }
:deep(.exercise-review-form h4) { margin: 0 0 4px; }
:deep(.exercise-review-form .exercise-stats-help) { margin: 0; }
:deep(.exercise-review-check) { display: flex !important; align-items: center; gap: 7px; align-self: end; min-height: 39px; }
:deep(.exercise-review-check input) { width: auto !important; min-height: 0 !important; accent-color: #00cec9; }
:deep(.exercise-stats-form) { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
:deep(.exercise-stats-form[hidden]), :deep(.exercise-log-details[hidden]), :deep(.exercise-log-name-actions[hidden]) { display: none; }
:deep(.exercise-log-start) { margin-top: 12px; }
:deep(#exercise-log-form), :deep(#exercise-max-form) { margin-top: 12px; }
:deep(.exercise-log-name-actions) { display: flex; align-items: end; gap: 8px; grid-column: span 3; }
:deep(.exercise-log-details) { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; border: 0; padding: 0; margin: 0; min-width: 0; }
:deep(.exercise-stats-form label) { display: grid; gap: 5px; min-width: 0; color: var(--text-muted); font-size: .75rem; font-weight: 600; }
:deep(.exercise-stats-form input), :deep(.exercise-stats-form select), :deep(.exercise-assignment select) { width: 100%; min-width: 0; min-height: 39px; padding: 9px 10px; border: 1px solid rgba(255,255,255,.14); border-radius: 9px; background: #1b1b31; color: var(--text-main); font: inherit; }
:deep(.exercise-stats-form input:focus), :deep(.exercise-stats-form select:focus), :deep(.exercise-assignment select:focus) { outline: 2px solid var(--secondary); outline-offset: 1px; }
:deep(.exercise-suggestion-wrap) { position: relative; display: block; min-width: 0; }
:deep(.exercise-suggestion-wrap:focus-within) { z-index: 20; }
:deep(.exercise-suggestions) { position: absolute; z-index: 20; top: calc(100% + 5px); left: 0; width: 100%; max-height: 200px; overflow-y: auto; padding: 5px; background: #22213a; border: 1px solid rgba(0,206,201,.45); border-radius: 10px; box-shadow: 0 12px 25px rgba(0,0,0,.45); }
:deep(.exercise-suggestions[hidden]) { display: none; }
:deep(.exercise-suggestion-option) { display: block; padding: 9px; border-radius: 6px; color: var(--text-main); cursor: pointer; overflow-wrap: anywhere; }
:deep(.exercise-suggestion-option:hover), :deep(.exercise-suggestion-option[aria-selected="true"]) { background: rgba(0,206,201,.16); color: #b6f4f0; }
:deep(.exercise-stats-wide) { grid-column: 1 / -1; }
:deep(.exercise-stats-primary) { background: rgba(0,206,201,.17); border-color: rgba(0,206,201,.4); }
:deep(.exercise-history-grid) { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 16px; }
:deep(.exercise-stats-empty) { padding: 14px 0 2px; color: var(--text-muted); font-size: .82rem; }
:deep(.exercise-history-item), :deep(.exercise-max-item) { border-top: 1px solid rgba(255,255,255,.09); padding: 13px 0; }
:deep(.exercise-history-item h5), :deep(.exercise-max-item h5) { color: #fff; font-size: .9rem; margin: 0 0 6px; overflow-wrap: anywhere; }
:deep(.exercise-history-item p), :deep(.exercise-max-item p) { color: var(--text-muted); font-size: .76rem; line-height: 1.5; }
:deep(.exercise-history-item p strong), :deep(.exercise-max-item p strong) { color: #a7f4ef; }
:deep(.exercise-log-row), :deep(.exercise-max-item) { display: flex; justify-content: space-between; gap: 10px; }
:deep(.exercise-log-row) { margin-top: 9px; padding: 9px 10px; background: rgba(0,0,0,.15); border-radius: 8px; font-size: .76rem; line-height: 1.5; overflow-wrap: anywhere; }
:deep(.exercise-log-meta) { display: block; color: var(--text-muted); }
:deep(.exercise-delete) { flex: 0 0 auto; align-self: flex-start; background: transparent; border: 0; color: #c0b9c9; font-size: 1.2rem; line-height: 1; cursor: pointer; }
:deep(.exercise-delete:hover) { color: #ff9a9a; }
:deep(.exercise-max-list) { margin-top: 16px; }
:deep(.exercise-max-tests), :deep(.exercise-history-details) { margin-top: 8px; color: var(--text-muted); font-size: .75rem; }
:deep(.exercise-max-tests summary), :deep(.exercise-history-details summary) { cursor: pointer; color: #b6f4f0; }
:deep(.cardio-run-summary) { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }
:deep(.cardio-run-summary div) { display: grid; gap: 3px; padding: 10px; border: 1px solid rgba(255,255,255,.08); border-radius: 10px; background: rgba(0,0,0,.12); }
:deep(.cardio-run-summary span) { color: var(--text-muted); font-size: .68rem; }
:deep(.cardio-run-summary strong) { color: #a7f4ef; font-size: .9rem; }
:deep(.cardio-run-list) { margin-top: 12px; }
:deep(.cardio-run-row) { display: flex; justify-content: space-between; gap: 10px; margin-top: 9px; padding: 10px; background: rgba(0,0,0,.15); border-radius: 8px; font-size: .76rem; line-height: 1.5; overflow-wrap: anywhere; }
:deep(.cardio-run-row > div) { min-width: 0; }
:deep(.cardio-run-row strong) { color: #fff; }
:deep(.exercise-plan-list) { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px; margin-top: 12px; }
:deep(.exercise-plan-item) { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 8px; align-items: center; padding: 10px; border: 1px solid rgba(255,255,255,.08); border-radius: 10px; background: rgba(0,0,0,.12); }
:deep(.exercise-plan-item strong) { display: block; color: #fff; font-size: .82rem; }
:deep(.exercise-plan-item span) { display: block; color: var(--text-muted); font-size: .7rem; line-height: 1.45; }
:deep(.exercise-plan-meta) { text-align: right; }
:deep(.exercise-plan-meta span:last-child) { color: #a7f4ef; }
/* Shared button looks from legacy/style.css (.mini-btn, .chip-btn). Kept here so this screen does not depend on them. */
:deep(.mini-btn), :deep(.chip-btn) { background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border); border-radius: 12px; color: var(--text-main); padding: 10px 14px; font-weight: 700; font-size: 0.85rem; }
:deep(.mini-btn:hover), :deep(.chip-btn:hover) { background: rgba(255,255,255,0.12); }
@media (max-width: 850px) {
  :deep(.exercise-coverage-layout) { grid-template-columns: 1fr; }
  :deep(.exercise-coverage-list) { grid-template-columns: repeat(3, minmax(0,1fr)); }
}
@media (max-width: 600px) {
  :deep(.exercise-history-grid) { grid-template-columns: 1fr; }
  :deep(.exercise-stats-form), :deep(.exercise-log-details) { grid-template-columns: repeat(2, minmax(0,1fr)); }
  :deep(.exercise-log-name-actions) { grid-column: span 1; flex-wrap: wrap; }
  :deep(.exercise-stats-card) { padding: 15px; }
  :deep(.exercise-coverage-list) { grid-template-columns: repeat(2, minmax(0,1fr)); }
  :deep(.exercise-stats-intro .exercise-stats-badge) { display: none; }
  :deep(.cardio-run-summary) { grid-template-columns: repeat(2, minmax(0,1fr)); }
}
@media (max-width: 380px) {
  :deep(#exercise-coverage-chart) { grid-template-columns: 1fr; }
  :deep(.exercise-radar svg) { max-width: 280px; margin: auto; }
}
@media (max-width: 480px) {
  :deep(.exercise-stats-heading) { flex-wrap: wrap; }
  :deep(.exercise-coverage-mode) { margin-left: auto; }
}
</style>
