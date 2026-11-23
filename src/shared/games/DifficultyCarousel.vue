<script setup lang="ts" generic="T extends { key: string }">
import { computed, ref } from 'vue'

/** Shows one item at a time with previous and next arrows. Each item is rendered through the `card` slot. */
const props = defineProps<{
  /** Items to page through, in order. Each needs a unique `key`. */
  items: T[]
  /** Accessible label for the carousel region. */
  label: string
}>()

defineSlots<{
  /** Renders the content of one item. */
  card(props: { item: T }): unknown
}>()

const index = ref(0)
const isFirst = computed(() => index.value === 0)
const isLast = computed(() => index.value >= props.items.length - 1)

/** Moves to `next`, clamped to the first and last item. */
function show(next: number): void {
  index.value = Math.max(0, Math.min(next, props.items.length - 1))
}
</script>

<template>
  <div
    class="difficulty-carousel"
    :aria-label="label"
  >
    <button
      class="difficulty-carousel-arrow"
      type="button"
      aria-label="Previous difficulty"
      :disabled="isFirst"
      @click="show(index - 1)"
    >
      ←
    </button>
    <div
      class="difficulty-slides"
      aria-live="polite"
    >
      <div
        v-for="(item, i) in items"
        :key="item.key"
        :hidden="i !== index"
        :aria-hidden="i !== index"
      >
        <slot
          name="card"
          :item="item"
        />
      </div>
    </div>
    <button
      class="difficulty-carousel-arrow"
      type="button"
      aria-label="Next difficulty"
      :disabled="isLast"
      @click="show(index + 1)"
    >
      →
    </button>
  </div>
</template>

<style scoped>
.difficulty-carousel {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) 42px;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 760px;
    margin: 18px auto 12px;
}

.difficulty-slides {
    min-width: 0;
}

.difficulty-slides > [hidden] {
    display: none !important;
}

.difficulty-carousel-arrow {
    display: grid;
    width: 42px;
    height: 48px;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.07);
    color: #fff;
    font-size: 1.5rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.difficulty-carousel-arrow:hover:not(:disabled) {
    transform: translateY(-2px);
    border-color: rgba(0, 206, 201, 0.38);
    background: rgba(0, 206, 201, 0.12);
}

.difficulty-carousel-arrow:disabled {
    opacity: 0.35;
    cursor: default;
}

.difficulty-carousel-arrow:focus-visible {
    outline: 2px solid rgba(0, 206, 201, 0.75);
    outline-offset: 3px;
}

@media (max-width: 600px), (max-height: 500px) {
    .difficulty-carousel {
        grid-template-columns: 36px minmax(0, 1fr) 36px;
        gap: 6px;
    }
}
</style>
