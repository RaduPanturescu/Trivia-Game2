<script setup lang="ts">
/** Minesweeper board grid. Emits `press` for a click and `flag` for a right click on a square. */
import { computed } from 'vue'
import { cellView, type Board } from './board'

const props = defineProps<{
  /** The board to draw. */
  cells: Board
  /** Emoji drawn for a mine or an otter. */
  hazardIcon: string
  /** Developer mode: draw unopened mines faintly. */
  showHazards: boolean
}>()

const emit = defineEmits<{
  /** A square was clicked. */
  press: [row: number, col: number]
  /** A square was right-clicked. */
  flag: [row: number, col: number]
}>()

const rows = computed(() => props.cells.length)
const cols = computed(() => props.cells[0]?.length ?? 0)

/** Every square with its position and what it shows, in reading order. */
const squares = computed(() =>
  props.cells.flatMap((line, row) =>
    line.map((cell, col) => ({
      key: `${row}-${col}`,
      row,
      col,
      view: cellView(cell, props.hazardIcon, props.showHazards),
    })),
  ),
)
</script>

<template>
  <div
    class="minesweeper-board-viewport"
    tabindex="0"
    role="region"
    aria-label="Minesweeper board, scroll horizontally for larger boards"
  >
    <div
      class="minesweeper-board"
      :style="{ '--minesweeper-columns': cols, '--minesweeper-rows': rows }"
    >
      <div
        v-for="square in squares"
        :key="square.key"
        class="minesweeper-cell"
        :class="square.view.classes"
        @click="emit('press', square.row, square.col)"
        @contextmenu.prevent="emit('flag', square.row, square.col)"
      >
        <span
          v-if="square.view.label"
          :class="{ 'minesweeper-cheat': square.view.cheat }"
        >{{ square.view.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.minesweeper-board-viewport {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.minesweeper-board {
  --minesweeper-cell-size: max(1px, min(
    (100cqw - 22px - (var(--minesweeper-columns) - 1) * 2px) / var(--minesweeper-columns),
    (100cqh - 75px - 22px - (var(--minesweeper-rows) - 1) * 2px) / var(--minesweeper-rows)
  ));
  display: grid;
  grid-template-columns: repeat(var(--minesweeper-columns), var(--minesweeper-cell-size));
  grid-template-rows: repeat(var(--minesweeper-rows), var(--minesweeper-cell-size));
  flex: none;
  align-self: center;
  width: max-content;
  gap: 2px;
  background: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 10px;
  border: 1px solid var(--glass-border);
  margin-bottom: 20px;
  margin-right: auto;
  margin-left: auto;
}

@media (max-width: 600px), (pointer: coarse) {
  .minesweeper-board {
    --minesweeper-cell-size: max(32px, min(
      (100cqw - 22px - (var(--minesweeper-columns) - 1) * 2px) / var(--minesweeper-columns),
      (100cqh - 75px - 22px - (var(--minesweeper-rows) - 1) * 2px) / var(--minesweeper-rows)
    ));
  }
}

.minesweeper-cell {
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(0, 206, 201, 0.1));
  border: 1px solid var(--glass-border);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  font-size: clamp(0.35rem, calc(var(--minesweeper-cell-size) * 0.55), 0.9rem);
  min-width: 0;
  min-height: 0;
  user-select: none;
  transition: all 0.1s ease;
  color: var(--text-main);
}

.minesweeper-cell:hover:not(.revealed):not(.flagged) {
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.25), rgba(0, 206, 201, 0.15));
  border-color: var(--primary);
  box-shadow: 0 0 10px rgba(108, 92, 231, 0.2);
  transform: scale(1.05);
}

.minesweeper-cell.revealed {
  background: rgba(0, 0, 0, 0.4);
  border-color: var(--glass-border);
  cursor: default;
}

.minesweeper-cell.revealed.mine {
  background: rgba(214, 48, 49, 0.3);
  color: #ff6b6b;
  border-color: var(--incorrect);
}

.minesweeper-cell.flagged {
  background: rgba(253, 121, 168, 0.2);
  border-color: var(--accent);
  cursor: default;
}

.minesweeper-cell.num-1 { color: #0984e3; }
.minesweeper-cell.num-2 { color: #00b894; }
.minesweeper-cell.num-3 { color: #d63031; }
.minesweeper-cell.num-4 { color: #6c5ce7; }
.minesweeper-cell.num-5 { color: #e17055; }
.minesweeper-cell.num-6 { color: #00cec9; }
.minesweeper-cell.num-7 { color: #fdcb6e; }
.minesweeper-cell.num-8 { color: #fd79a8; }

.minesweeper-cheat {
  opacity: 0.35;
}
</style>
