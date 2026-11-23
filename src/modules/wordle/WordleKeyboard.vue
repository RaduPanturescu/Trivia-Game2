<script setup lang="ts">
/** On-screen Wordle keyboard. Colours each used key and emits its label; collapses once the puzzle is complete. */
import type { KeyStates } from './types'

defineProps<{
  /** Colour of each used key, keyed by upper-case label. */
  keyStates: KeyStates
  /** Whether the puzzle has ended. Collapses the keyboard and disables it for assistive tech. */
  complete: boolean
}>()

const emit = defineEmits<{
  /** A key was pressed: `ENTER`, `⌫` or a letter. */
  key: [key: string]
}>()

/** Key rows. The bottom row holds ENTER and backspace around the Z-M letters. */
const ROWS: string[][] = [
  [...'QWERTYUIOP'],
  [...'ASDFGHJKL'],
  ['ENTER', ...'ZXCVBNM', '⌫'],
]

/**
 * Whether a key is a wide function key (ENTER or backspace).
 * @param key - Key label.
 * @returns True for ENTER and backspace.
 */
function isWide(key: string): boolean {
  return key === 'ENTER' || key === '⌫'
}
</script>

<template>
  <div
    class="wordle-keyboard"
    :class="{ 'is-complete': complete }"
    :aria-hidden="complete ? 'true' : 'false'"
    aria-label="On-screen keyboard"
  >
    <div
      v-for="(row, rowIndex) in ROWS"
      :key="rowIndex"
      class="wordle-key-row"
      :class="`wordle-key-row-${rowIndex + 1}`"
    >
      <button
        v-for="key in row"
        :key="key"
        type="button"
        class="wordle-key"
        :class="[
          keyStates[key] ? `is-${keyStates[key]}` : '',
          { 'wordle-key-wide': isWide(key) },
        ]"
        :data-key="key"
        @click="emit('key', key)"
      >
        {{ key }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.wordle-keyboard {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 7px;
  width: 100%;
  max-height: 180px;
  overflow: hidden;
  margin: 0 auto;
  opacity: 1;
  transform: translateY(0);
  visibility: inherit;
  transition: opacity 0.3s ease, transform 0.3s ease, max-height 0.3s ease, visibility 0s;
}

.wordle-keyboard.is-complete {
  max-height: 0;
  opacity: 0;
  transform: translateY(8px);
  visibility: hidden;
  transition: opacity 0.3s ease, transform 0.3s ease, max-height 0.3s ease, visibility 0s 0.3s;
}

.wordle-key-row {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.wordle-key {
  min-width: 0;
  flex: 1 1 0;
  height: 48px;
  padding: 0 3px;
  border-radius: 6px;
  background: #818384;
  color: white;
  font-size: clamp(0.72rem, 3vw, 0.9rem);
  font-weight: 800;
  touch-action: manipulation;
}

.wordle-key:hover {
  filter: brightness(1.15);
}

.wordle-key-wide {
  flex: 1.55 1 0;
  font-size: 0.68rem;
}

.wordle-key.is-correct {
  background: #538d4e;
  color: #fff;
  background-image: none;
}

.wordle-key.is-present {
  background: #b59f3b;
  color: #fff;
  background-image: none;
}

.wordle-key.is-absent {
  background: #3a3a3c;
  color: #fff;
  background-image: none;
}

@media (prefers-reduced-motion: reduce) {
  .wordle-keyboard,
  .wordle-keyboard.is-complete {
    transition-duration: 0.01ms;
  }
}

@media (max-width: 380px) {
  .wordle-key {
    height: 44px;
  }
}

@media (max-width: 320px) {
  .wordle-key-row {
    gap: 2px;
  }

  .wordle-key {
    padding: 0;
  }

  .wordle-key-wide {
    font-size: 0.55rem;
  }
}

@media (max-width: 270px) {
  .wordle-key-wide {
    flex-grow: 2;
  }
}
</style>
