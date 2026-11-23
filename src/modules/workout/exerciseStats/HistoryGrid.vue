<script setup lang="ts">
/**
 * Calisthenics and weight history: the logged performances grouped by exercise, with their best figures and a delete
 * button per row.
 */
import { computed } from 'vue'
import { formatDisplayDate } from '@/shared/dates'
import { buildHistoryGroups } from './history'
import { updateExerciseStats, useExerciseStats } from './useExerciseStats'
import type { ExerciseLogType } from './types'

/** The two sections, in display order. */
const SECTIONS: { type: ExerciseLogType; kicker: string; title: string }[] = [
  { type: 'calisthenics', kicker: 'BODYWEIGHT', title: 'Calisthenics' },
  { type: 'weights', kicker: 'STRENGTH', title: 'Weight exercises' },
]

const { state } = useExerciseStats()
const sections = computed(() => SECTIONS.map((section) => ({ ...section, groups: buildHistoryGroups(state.value.logs, section.type) })))

/**
 * Deletes one performance after confirmation.
 * @param logId - Id of the log.
 */
async function deleteLog(logId: string): Promise<void> {
  if (!window.confirm('Delete this performance?')) return
  const saved = await updateExerciseStats((data) => {
    data.logs = data.logs.filter((log) => log.id !== logId)
  })
  if (!saved) window.alert('Could not save exercise stats. Check your browser storage and try again.')
}
</script>

<template>
  <div class="exercise-history-grid">
    <section
      v-for="section in sections"
      :key="section.type"
      class="exercise-stats-card"
    >
      <span class="exercise-stats-kicker">{{ section.kicker }}</span>
      <h4>{{ section.title }}</h4>
      <div :id="`exercise-history-${section.type}`">
        <p
          v-if="!section.groups.length"
          class="exercise-stats-empty"
        >
          No performances logged yet.
        </p>
        <template v-else>
          <article
            v-for="group in section.groups"
            :key="group.key"
            class="exercise-history-item"
          >
            <h5>{{ group.name }}</h5>
            <p>
              <template v-if="group.bodyweightBest !== null">
                <strong>{{ group.bodyweightBest }} Reps</strong> - Personal Best<template v-if="group.hasWeighted">
                  (bodyweight)
                </template>
              </template>
              <br v-if="group.bodyweightBest !== null && group.load">
              <template v-if="group.load">
                Best load: <strong>{{ group.load.weight }} kg × {{ group.load.reps }}</strong> · Best reps: <strong>{{ group.load.bestReps }}</strong> ({{ group.load.bestRepsWeight }} kg)
              </template>
            </p>
            <details
              class="exercise-history-details"
              :data-exercise-key="group.key"
            >
              <summary>History ({{ group.entries.length }})</summary>
              <div
                v-for="entry in group.entries"
                :key="entry.id"
                class="exercise-log-row"
              >
                <div>
                  <strong>{{ entry.title }}</strong>
                  <span
                    v-if="entry.meta"
                    class="exercise-log-meta"
                  >{{ entry.meta }}</span>
                </div>
                <button
                  type="button"
                  class="exercise-delete"
                  :aria-label="`Delete log for ${entry.name} on ${formatDisplayDate(entry.date)}`"
                  @click="deleteLog(entry.id)"
                >
                  ×
                </button>
              </div>
            </details>
          </article>
        </template>
      </div>
    </section>
  </div>
</template>
