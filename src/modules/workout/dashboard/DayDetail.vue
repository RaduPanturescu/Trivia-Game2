<script setup lang="ts">
/** "Today's Exercises" panel of the dashboard: the selected day's exercise rows and their controls. */
import { ref } from 'vue'
import type { DayDetailApi } from './useDayDetail'

const props = defineProps<{ detail: DayDetailApi }>()
const { title, settingWorkoutDay, message, rows } = props.detail

/** Index of the row being dragged, or `null`. */
const dragFrom = ref<number | null>(null)
/** Index of the row a drag is hovering, or `null`. */
const dropTarget = ref<number | null>(null)

/**
 * Starts a row drag. Firefox needs data set on the transfer.
 * @param event - The drag event.
 * @param index - Row being dragged.
 */
function onDragStart(event: DragEvent, index: number): void {
  dragFrom.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

/** Ends a row drag and clears the markers. */
function onDragEnd(): void {
  dragFrom.value = null
  dropTarget.value = null
}

/**
 * Marks the row under a drag as the drop target.
 * @param event - The drag event.
 * @param index - Row under the pointer.
 */
function onDragOver(event: DragEvent, index: number): void {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dropTarget.value = index
}

/**
 * Clears the drop marker once the pointer leaves the row.
 * @param event - The drag event.
 * @param index - Row being left.
 */
function onDragLeave(event: DragEvent, index: number): void {
  const row = event.currentTarget as HTMLElement
  if (!row.contains(event.relatedTarget as Node | null) && dropTarget.value === index) dropTarget.value = null
}

/**
 * Moves the dragged row to the row it was dropped on.
 * @param index - Row dropped on.
 */
function onDrop(index: number): void {
  const from = dragFrom.value
  dropTarget.value = null
  dragFrom.value = null
  if (from !== null) props.detail.reorder(from, index)
}

/**
 * Opens the editor when a row is clicked outside its buttons.
 * @param event - The click event.
 * @param index - Row clicked.
 */
function onRowClick(event: MouseEvent, index: number): void {
  if ((event.target as HTMLElement).closest('button')) return
  props.detail.edit(index)
}
</script>

<template>
  <section class="workout-panel today-exercises-panel">
    <div class="panel-header">
      <h3 id="workout-day-title">
        {{ title }}
      </h3>
      <button
        id="workout-toggle-rest-btn"
        class="mini-btn"
        type="button"
        :class="settingWorkoutDay ? 'set-workout-day-btn' : 'set-rest-day-btn'"
        @click="detail.toggleType()"
      >
        {{ settingWorkoutDay ? 'SET WORKOUT DAY' : 'SET REST DAY' }}
      </button>
    </div>
    <div class="workout-day-detail">
      <div
        v-if="message"
        class="rest-box"
      >
        <h4>{{ message.heading }}</h4>
        <p v-if="message.hint">
          {{ message.hint }}
        </p>
      </div>
      <template v-else>
        <div
          v-for="row in rows"
          :key="row.exercise.id"
          class="exercise-box"
          :class="{
            completed: row.controls.completed,
            resting: row.controls.resting,
            'exercise-dragging': dragFrom === row.index,
            'exercise-drop-target': dropTarget === row.index,
          }"
          draggable="true"
          title="Click to edit this exercise for this day"
          @dragstart="onDragStart($event, row.index)"
          @dragend="onDragEnd"
          @dragover="onDragOver($event, row.index)"
          @dragleave="onDragLeave($event, row.index)"
          @drop.prevent="onDrop(row.index)"
          @click="onRowClick($event, row.index)"
        >
          <div class="exercise-box-header">
            <div class="exercise-name-order">
              <span class="exercise-order-number">{{ row.index + 1 }}.</span>
              <h4>{{ row.exercise.name }}</h4>
            </div>
          </div>
          <div class="meta-line">
            <span>{{ row.category }}</span>
            <span
              class="meta-separator"
              aria-hidden="true"
            />
            <span>{{ row.load }}</span>
            <span
              class="meta-separator"
              aria-hidden="true"
            />
            <span>{{ row.exercise.sets }} sets</span>
            <span
              class="meta-separator"
              aria-hidden="true"
            />
            <span>{{ row.reps }}</span>
            <span
              class="meta-separator"
              aria-hidden="true"
            />
            <span>{{ row.rest }}</span>
          </div>
          <div class="exercise-start-control">
            <button
              class="start-btn"
              type="button"
              :disabled="row.controls.startDisabled"
              @click="detail.start(row.index)"
            >
              {{ row.controls.startLabel }}
            </button>
            <button
              class="complete-exercise-btn"
              :class="{ 'is-completed': row.controls.completed }"
              type="button"
              @click="detail.complete(row.index)"
            >
              {{ row.controls.completeLabel }}
            </button>
            <button
              v-if="row.controls.skipVisible"
              class="skip-workout-phase-btn"
              type="button"
              @click="detail.skipPhase()"
            >
              Skip Timer →
            </button>
          </div>
          <div class="exercise-actions">
            <button
              class="secondary-btn edit-exercise-btn"
              type="button"
              @click="detail.edit(row.index)"
            >
              Edit
            </button>
            <button
              class="secondary-btn remove-exercise-btn"
              type="button"
              @click="detail.remove(row.exercise.id)"
            >
              Remove
            </button>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
