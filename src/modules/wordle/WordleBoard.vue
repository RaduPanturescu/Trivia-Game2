<script setup lang="ts">
/** Six-by-five Wordle grid. Shakes when a rejected word is submitted; the shake restarts on every rejection. */
import { computed, ref, watch } from 'vue'
import { WORD_LENGTH } from './useWordle'
import type { BoardTile } from './types'

const props = defineProps<{
  /** Rows of tiles, top to bottom. */
  rows: BoardTile[][]
  /** Changes on every rejected word. Each change replays the shake animation. */
  shake: number
}>()

const boardEl = ref<HTMLElement | null>(null)

/** Flat list of tiles in reading order, with the position used for the cell label. */
const tiles = computed(() =>
  props.rows.flatMap((row, rowIndex) =>
    row.map((tile, column) => ({ tile, label: `Row ${rowIndex + 1}, letter ${column + 1}`, key: rowIndex * WORD_LENGTH + column })),
  ),
)

/**
 * Classes for one tile, matching the legacy class names.
 * @param tile - The tile to style.
 * @returns Class names to apply.
 */
function tileClasses(tile: BoardTile): string[] {
  const classes: string[] = []
  if (tile.filled) classes.push('filled')
  if (tile.revealed && tile.result) classes.push('revealed', `tile-${tile.result}`)
  return classes
}

watch(
  () => props.shake,
  () => {
    const board = boardEl.value
    if (!board) return
    // Remove and re-add the class so the animation restarts even when it is already applied.
    board.classList.remove('wordle-shake')
    void board.offsetWidth
    board.classList.add('wordle-shake')
  },
)

</script>

<template>
  <div
    ref="boardEl"
    class="wordle-board"
    role="grid"
    aria-label="Six guesses of five letters"
  >
    <div
      v-for="entry in tiles"
      :key="entry.key"
      class="wordle-tile"
      :class="tileClasses(entry.tile)"
      role="gridcell"
      :aria-label="entry.label"
    >
      {{ entry.tile.letter }}
    </div>
  </div>
</template>

<style scoped>
.wordle-board {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  width: min(100%, 330px, max(180px, calc(83.333vh - 280px)));
  margin: 0 auto;
}

.wordle-tile {
  display: grid;
  aspect-ratio: 1;
  place-items: center;
  border: 2px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.025);
  color: #fff;
  font-size: clamp(1.25rem, 6vw, 1.8rem);
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
}

.wordle-tile.filled {
  border-color: rgba(255, 255, 255, 0.48);
  animation: wordlePop 0.08s ease-out;
}

.wordle-tile.revealed {
  border-color: transparent;
  animation: wordleFlip 0.45s ease both;
}

.wordle-tile.tile-correct {
  background: #538d4e;
  color: #fff;
}

.wordle-tile.tile-present {
  background: #b59f3b;
  color: #fff;
}

.wordle-tile.tile-absent {
  background: #3a3a3c;
  color: #fff;
}

.wordle-shake {
  animation: wordleShake 0.35s ease;
}

@keyframes wordlePop {
  50% { transform: scale(1.08); }
}

@keyframes wordleFlip {
  0% { transform: rotateX(0); }
  50% { transform: rotateX(90deg); }
  100% { transform: rotateX(0); }
}

@keyframes wordleShake {
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}
</style>
