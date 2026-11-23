<script setup lang="ts">
import { useId } from 'vue'

/** Custom-size card: a slot for the size fields, a validation message and a start button. */
defineProps<{
  /** Validation message shown under the fields. Empty when the inputs are fine. */
  validation: string
  /** Whether the start button is enabled. */
  canStart: boolean
}>()

const emit = defineEmits<{
  /** Emitted when the user presses the start button. */
  start: []
}>()

const titleId = useId()
</script>

<template>
  <section
    class="difficulty-card difficulty-custom-card"
    :aria-labelledby="titleId"
  >
    <strong
      :id="titleId"
      class="difficulty-name"
    >Custom</strong>
    <div class="difficulty-custom-fields">
      <slot />
    </div>
    <p
      class="difficulty-custom-validation"
      aria-live="polite"
    >
      {{ validation }}
    </p>
    <button
      class="difficulty-custom-start"
      type="button"
      :disabled="!canStart"
      @click="emit('start')"
    >
      Start Custom Game
    </button>
  </section>
</template>

<style scoped src="./difficultyCard.css"></style>

<style scoped>
.difficulty-custom-card {
    cursor: default;
}

.difficulty-custom-card:hover {
    transform: translateY(-3px);
}

.difficulty-custom-fields {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    width: 100%;
}

.difficulty-custom-fields :deep(label) {
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: #e3e7f2;
    font-size: 0.85rem;
    font-weight: 700;
}

.difficulty-custom-fields :deep(input) {
    width: 100%;
    min-width: 0;
    padding: 9px 10px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 9px;
    background: rgba(0, 0, 0, 0.24);
    color: #fff;
    font-size: 0.95rem;
}

.difficulty-custom-validation {
    min-height: 2.5em;
    color: var(--text-muted);
    font-size: 0.78rem;
    line-height: 1.35;
    text-align: center;
}

.difficulty-custom-start {
    align-self: center;
    padding: 10px 18px;
    border: 1px solid rgba(0, 206, 201, 0.35);
    border-radius: 11px;
    background: linear-gradient(135deg, rgba(108, 92, 231, 0.88), rgba(0, 184, 148, 0.82));
    color: #fff;
    font-size: 0.9rem;
    font-weight: 800;
    cursor: pointer;
}

.difficulty-custom-start:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.difficulty-custom-start:focus-visible {
    outline: 2px solid rgba(0, 206, 201, 0.75);
    outline-offset: 3px;
}
</style>
