<script setup lang="ts">
/**
 * Dashboard button showing the latest logged weight. With no entries it opens the log-weight dialog; otherwise it opens
 * a small menu with "Update weight" and "Show graph". Ports the legacy `workout-weight-btn` and its menu.
 */
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { formatDisplayDate } from '@/shared/dates'
import { useWorkoutStore } from '../core/store'
import WeightEntryModal from './WeightEntryModal.vue'

const store = useWorkoutStore()
const router = useRouter()
const modalOpen = ref(false)
const menuOpen = ref(false)
const wrap = useTemplateRef<HTMLElement>('wrap')
const latest = computed(() => store.bodyWeightEntries.value.at(-1))
const label = computed(() => (latest.value ? `${latest.value.weight} kg` : 'Your weight'))
const title = computed(() => (latest.value ? `Last recorded ${formatDisplayDate(latest.value.date)}` : 'Record your weight'))

/** Button press: opens the dialog when nothing is logged yet, otherwise toggles the menu. */
function onButtonClick(): void {
  if (!store.bodyWeightEntries.value.length) {
    modalOpen.value = true
    return
  }
  menuOpen.value = !menuOpen.value
}

/** Opens the log-weight dialog from the menu. */
function updateWeight(): void {
  menuOpen.value = false
  modalOpen.value = true
}

/** Opens the health stats screen with the weight graph. */
function showGraph(): void {
  menuOpen.value = false
  void router.push('/workout/health')
}

/**
 * Closes the menu when a click lands outside it.
 * @param event - The document click.
 */
function closeOnOutsideClick(event: MouseEvent): void {
  if (menuOpen.value && !wrap.value?.contains(event.target as Node)) menuOpen.value = false
}

onMounted(() => document.addEventListener('click', closeOnOutsideClick))
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutsideClick))
</script>

<template>
  <div
    ref="wrap"
    class="workout-weight-menu-wrap"
  >
    <button
      id="workout-weight-btn"
      class="mini-btn workout-weight-btn"
      type="button"
      aria-haspopup="true"
      :aria-expanded="menuOpen"
      :title="title"
      @click="onButtonClick"
    >
      {{ label }}
    </button>
    <div
      v-if="menuOpen"
      id="workout-weight-menu"
      class="workout-weight-menu"
    >
      <button
        type="button"
        data-weight-action="update"
        @click="updateWeight"
      >
        Update weight
      </button>
      <button
        type="button"
        data-weight-action="graph"
        @click="showGraph"
      >
        Show graph
      </button>
    </div>
    <WeightEntryModal
      :open="modalOpen"
      @close="modalOpen = false"
    />
  </div>
</template>
