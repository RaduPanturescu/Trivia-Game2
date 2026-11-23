<script setup lang="ts">
/**
 * Stacked answer buttons. Before an answer is picked every option is clickable.
 * After a pick, the correct option is marked correct, a wrong pick is marked
 * wrong, and all options are disabled. Renders the legacy `.options-container`.
 */
import { SFX, useAudio } from '../composables/useAudio'

const props = withDefaults(
  defineProps<{
    /** Answer texts, in display order. */
    options: string[]
    /** Index of the correct option. */
    answer: number
    /** Index of the option the player picked, or `null` if not answered yet. */
    selected: number | null
    /** Developer cheat: outlines the correct option. Pass the dev-mode flag. */
    devHint?: boolean
  }>(),
  { devHint: false },
)

const emit = defineEmits<{
  /** Fired once, with the index of the clicked option. Not fired after an answer is picked. */
  select: [index: number]
}>()

/** Plays the pop sound and emits `select`, unless an answer was already picked. */
function choose(index: number): void {
  if (props.selected !== null) return
  useAudio().playSfx(SFX.pop)
  emit('select', index)
}
</script>

<template>
  <div class="options-container">
    <button
      v-for="(option, index) in options"
      :key="index"
      type="button"
      class="option-btn"
      :class="{
        correct: selected !== null && index === answer,
        wrong: selected !== null && index === selected && index !== answer,
        'dev-hint': devHint && index === answer,
      }"
      :disabled="selected !== null"
      @click="choose(index)"
    >
      {{ option }}
    </button>
  </div>
</template>

<style scoped>
.options-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.option-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  padding: 18px 20px;
  border-radius: 12px;
  font-size: 1.1rem;
  text-align: left;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.option-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateX(5px);
}

.option-btn.correct {
  background: var(--correct);
  border-color: var(--correct);
  color: white;
  box-shadow: 0 0 15px rgba(0, 184, 148, 0.4);
}

.option-btn.wrong {
  background: var(--incorrect);
  border-color: var(--incorrect);
  color: white;
}

/* Declared after `.correct` so it overrides the box-shadow, as the legacy inline style did. */
.option-btn.dev-hint {
  outline: 3px solid var(--secondary);
  box-shadow: 0 0 15px var(--secondary);
}

.option-btn:disabled {
  cursor: default;
  opacity: 0.7;
}
</style>
