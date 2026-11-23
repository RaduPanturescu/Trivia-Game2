<script setup lang="ts">
/** The seven day pills of the viewed week. A click selects a day; a workout pill can be dragged onto another day. */
import { ref } from 'vue'
import type { WorkoutDashboardApi } from './useDashboard'

const props = defineProps<{ dashboard: WorkoutDashboardApi }>()
const { pills } = props.dashboard

/** Index of the pill being dragged, or `null`. */
const dragSource = ref<number | null>(null)
/** Index of the pill a drag hovers, or `null`. */
const dropTarget = ref<number | null>(null)

/**
 * Starts dragging a workout pill.
 * @param event - The drag event.
 * @param index - The pill's day index.
 */
function onDragStart(event: DragEvent, index: number): void {
  dragSource.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

/** Ends a drag and clears the markers. */
function onDragEnd(): void {
  dragSource.value = null
  dropTarget.value = null
}

/**
 * Marks a pill as the drop target of another pill's drag.
 * @param event - The drag event.
 * @param index - The pill under the pointer.
 */
function onDragOver(event: DragEvent, index: number): void {
  if (dragSource.value === null || dragSource.value === index) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dropTarget.value = index
}

/**
 * Clears the drop marker when the pointer leaves a pill.
 * @param event - The drag event.
 * @param index - The pill being left.
 */
function onDragLeave(event: DragEvent, index: number): void {
  const pill = event.currentTarget as HTMLElement
  if (!pill.contains(event.relatedTarget as Node | null) && dropTarget.value === index) dropTarget.value = null
}

/**
 * Moves the dragged workout onto the pill it was dropped on.
 * @param index - The pill dropped on.
 */
function onDrop(index: number): void {
  const from = dragSource.value
  dragSource.value = null
  dropTarget.value = null
  if (from !== null && from !== index) props.dashboard.moveDay(from, index)
}
</script>

<template>
  <div
    id="workout-days-row"
    class="workout-days-row"
  >
    <button
      v-for="pill in pills"
      :key="pill.index"
      type="button"
      :class="[pill.classes, {
        'day-dragging': dragSource === pill.index,
        'day-drop-target': dropTarget === pill.index,
      }]"
      :draggable="pill.draggable"
      @click="dashboard.selectDay(pill.index)"
      @dragstart="onDragStart($event, pill.index)"
      @dragover="onDragOver($event, pill.index)"
      @dragleave="onDragLeave($event, pill.index)"
      @drop.prevent="onDrop(pill.index)"
      @dragend="onDragEnd"
    >
      <span class="day-letter">{{ pill.letter }}</span>
      <span class="day-number">{{ pill.number }}</span>
      <span class="day-status">{{ pill.status }}</span>
    </button>
  </div>
</template>
