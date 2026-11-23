<script setup lang="ts">
import { useInfoPopover } from './useInfoPopover'

/** One selectable difficulty with its play button, personal best and info popover. */
defineProps<{
  /** Difficulty name, e.g. `Beginner`. */
  name: string
  /** Label/value lines shown under the name, e.g. `Grid: 9 × 9`. */
  details: { label: string; value: string }[]
  /** Personal best already formatted, or `N/A`. */
  bestTime: string
  /** Lines shown in the `?` popover. */
  info: string[]
}>()

const emit = defineEmits<{
  /** Emitted when the user picks this difficulty. */
  play: []
}>()

const { isOpen, toggle } = useInfoPopover()
</script>

<template>
  <article class="difficulty-card">
    <button
      class="difficulty-select"
      type="button"
      @click="emit('play')"
    >
      <strong class="difficulty-name">{{ name }}</strong>
      <span
        v-for="detail in details"
        :key="detail.label"
        class="difficulty-detail"
      >
        <strong>{{ detail.label }}:</strong> {{ detail.value }}
      </span>
      <span class="difficulty-play-hint">Click to play</span>
    </button>
    <span class="difficulty-card-best-time">Personal best: {{ bestTime }}</span>
    <div class="difficulty-info-area">
      <button
        class="difficulty-info-btn"
        type="button"
        :aria-label="`More information about ${name}`"
        :aria-expanded="isOpen"
        @click.stop="toggle"
      >
        ?
      </button>
      <div
        class="difficulty-info-popover"
        :hidden="!isOpen"
      >
        <span
          v-for="line in info"
          :key="line"
        >{{ line }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped src="./difficultyCard.css"></style>

<style scoped>
.difficulty-select {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    gap: 11px;
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: center;
    cursor: pointer;
}

.difficulty-select:focus-visible {
    outline: none;
}

.difficulty-detail {
    color: #e3e7f2;
    font-size: 0.98rem;
    text-align: center;
}

.difficulty-detail strong {
    font-weight: 800;
}

.difficulty-card-best-time {
    position: absolute;
    bottom: 17px;
    left: 50%;
    color: #cbd1e5;
    font-size: 0.78rem;
    font-weight: 700;
    transform: translateX(-50%);
    white-space: nowrap;
}

.difficulty-info-area {
    position: absolute;
    right: 12px;
    bottom: 12px;
    z-index: 2;
}

.difficulty-info-btn {
    display: grid;
    width: 28px;
    height: 28px;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 0.9rem;
    font-weight: 800;
    cursor: pointer;
}

.difficulty-info-btn:hover,
.difficulty-info-btn[aria-expanded="true"] {
    border-color: rgba(0, 206, 201, 0.55);
    background: rgba(0, 206, 201, 0.18);
}

.difficulty-info-popover {
    position: absolute;
    right: 0;
    bottom: 36px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: min(280px, calc(100vw - 120px));
    padding: 12px 14px;
    border: 1px solid rgba(160, 149, 255, 0.32);
    border-radius: 12px;
    background: rgba(17, 18, 35, 0.98);
    color: #e3e7f2;
    font-size: 0.8rem;
    line-height: 1.4;
    text-align: center;
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.34);
}

.difficulty-info-popover[hidden] {
    display: none;
}
</style>
