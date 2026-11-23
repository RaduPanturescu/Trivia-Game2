<script setup lang="ts">
/**
 * Quiz header: exit button, progress bar and `current/total` counter.
 * Renders the legacy `.game-header` used by category trivia.
 */
import { computed } from 'vue'

const props = defineProps<{
  /** 1-based number of the question on screen. */
  current: number
  /** Number of questions in the round. */
  total: number
}>()

defineEmits<{
  /** Fired when the exit button is clicked. */
  exit: []
}>()

/** Bar fill as a percentage of the round reached so far. */
const percent = computed(() => (props.total > 0 ? (props.current / props.total) * 100 : 0))
</script>

<template>
  <div class="game-header">
    <button
      type="button"
      class="exit-btn"
      aria-label="Exit game"
      @click="$emit('exit')"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path
          d="M18 6L6 18M6 6l12 12"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <div class="progress-bar-container">
      <div
        class="progress-bar"
        :style="{ width: `${percent}%` }"
      />
    </div>
    <div class="stats">
      <span>{{ current }}/{{ total }}</span>
    </div>
  </div>
</template>

<style scoped>
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-top: 10px;
}

.exit-btn {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 50%;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  flex-shrink: 0;
  padding: 0;
}

.progress-bar-container {
  flex-grow: 1;
  height: 8px;
  background: var(--glass-bg);
  border-radius: 4px;
  margin-right: 20px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--secondary), var(--primary));
  border-radius: 4px;
  transition: width 0.4s ease;
}

.stats {
  font-weight: 800;
  color: var(--secondary);
  font-size: 1.2rem;
}
</style>
