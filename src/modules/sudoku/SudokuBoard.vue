<script setup lang="ts">
/** The 9 x 9 grid of inputs. Turns DOM keyboard and pointer events into game actions; the rules live in useSudoku. */
import { nextTick, useTemplateRef } from 'vue'
import type { SudokuCell } from './types'

const props = defineProps<{
  /** Cell view models in row-major order. */
  cells: SudokuCell[]
  /** Whether input is blocked (no game running, or the game is over). */
  locked: boolean
}>()

const emit = defineEmits<{
  /** A cell received focus. */
  focusCell: [row: number, col: number]
  /** A cell's text changed to `text`. */
  enter: [row: number, col: number, text: string]
  /** Backspace or Delete was pressed on a cell. */
  clear: [row: number, col: number]
  /** Shift-click on a cell. The game ignores it unless developer mode is on. */
  reveal: [row: number, col: number]
}>()

const board = useTemplateRef<HTMLDivElement>('board')

/** Arrow keys and the (row, column) step each one takes. */
const ARROW_STEPS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
}

/**
 * Forwards typed text to the game, then shows the game's value in the input. Rejected keys therefore disappear.
 * @param cell - The cell that changed.
 * @param event - The input event.
 */
function onInput(cell: SudokuCell, event: Event): void {
  const input = event.target as HTMLInputElement
  emit('enter', cell.row, cell.col, input.value)
  syncInput(input, cell.index)
}

/**
 * Handles arrow keys (move focus) and Backspace or Delete (clear).
 * @param cell - The cell with the key press.
 * @param event - The keyboard event.
 */
function onKeydown(cell: SudokuCell, event: KeyboardEvent): void {
  const step = ARROW_STEPS[event.key]
  if (step) {
    event.preventDefault()
    const row = cell.row + step[0]
    const col = cell.col + step[1]
    if (row >= 0 && row < 9 && col >= 0 && col < 9) focusCell(row, col)
    return
  }
  if (event.key === 'Backspace' || event.key === 'Delete') {
    event.preventDefault()
    ;(event.target as HTMLInputElement).value = ''
    emit('clear', cell.row, cell.col)
  }
}

/**
 * Shift-click asks the game to reveal the cell. Only developer mode acts on it.
 * @param cell - The clicked cell.
 * @param event - The mouse event.
 */
function onClick(cell: SudokuCell, event: MouseEvent): void {
  if (!event.shiftKey) return
  emit('reveal', cell.row, cell.col)
  syncInput(event.target as HTMLInputElement, cell.index)
}

/**
 * Moves keyboard focus to a cell, if it exists.
 * @param row - Row index.
 * @param col - Column index.
 */
function focusCell(row: number, col: number): void {
  board.value?.querySelector<HTMLInputElement>(`[data-row="${row}"][data-col="${col}"]`)?.focus()
}

/**
 * Writes the game's value into an input once the game has updated.
 * @param input - The input to update.
 * @param index - Row-major index of the cell.
 */
function syncInput(input: HTMLInputElement, index: number): void {
  void nextTick(() => {
    const cell = props.cells[index]
    input.value = cell && cell.value !== 0 ? String(cell.value) : ''
  })
}
</script>

<template>
  <div
    ref="board"
    class="sudoku-board"
  >
    <input
      v-for="cell in cells"
      :key="cell.index"
      type="text"
      inputmode="numeric"
      maxlength="1"
      class="sudoku-cell"
      :class="{
        'sudoku-given': cell.given,
        selected: cell.selected,
        related: cell.related,
        error: cell.error,
        'sudoku-conflict': cell.conflict,
        'sudoku-flash': cell.flash,
        'dev-filled': cell.devFilled,
        'sudoku-box-bottom': cell.boxBottom,
        'sudoku-box-right': cell.boxRight,
      }"
      :data-row="cell.row"
      :data-col="cell.col"
      :value="cell.value === 0 ? '' : String(cell.value)"
      :disabled="cell.given || locked"
      @focus="emit('focusCell', cell.row, cell.col)"
      @input="onInput(cell, $event)"
      @keydown="onKeydown(cell, $event)"
      @click="onClick(cell, $event)"
    >
  </div>
</template>

<style scoped>
.sudoku-board {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    gap: 0;
    background: transparent;
    padding: 0;
    border-radius: 0;
    border: 0;
    margin-bottom: 20px;
    aspect-ratio: 1;
}

.sudoku-cell {
    width: 100%;
    aspect-ratio: 1;
    border: 1px solid var(--glass-border);
    background: linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(0, 206, 201, 0.1));
    color: var(--text-main);
    font-weight: bold;
    font-size: 1.1rem;
    text-align: center;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s ease;
    cursor: pointer;
}

.sudoku-cell:nth-child(-n+9) {
    border-top-width: 3px;
    border-top-color: var(--primary);
}

.sudoku-cell:nth-child(n+73) {
    border-bottom-width: 3px;
    border-bottom-color: var(--primary);
}

.sudoku-cell:nth-child(9n+1) {
    border-left-width: 3px;
    border-left-color: var(--primary);
}

.sudoku-cell:nth-child(9n) {
    border-right-width: 3px;
    border-right-color: var(--primary);
}

.sudoku-cell.sudoku-box-bottom {
    border-bottom: 3px solid var(--primary);
}

.sudoku-cell.sudoku-box-right {
    border-right: 3px solid var(--primary);
}

.sudoku-cell:focus {
    outline: none;
    background: linear-gradient(135deg, rgba(108, 92, 231, 0.35), rgba(0, 206, 201, 0.25));
}

.sudoku-cell.sudoku-given {
    background: rgba(0, 0, 0, 0.4);
    color: var(--secondary);
    font-weight: 800;
    cursor: default;
}

.sudoku-cell.selected {
    background: rgba(125, 125, 125, 0.48);
    border-color: #8a8a8a;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.sudoku-cell.related {
    background: rgba(125, 125, 125, 0.28);
}

.sudoku-cell.error,
.sudoku-cell.sudoku-conflict {
    background: rgba(214, 48, 49, 0.3);
    animation: errorShake 0.4s ease-in-out;
}

.sudoku-cell.dev-filled {
    background: rgba(255, 193, 7, 0.3);
    border-color: rgba(255, 193, 7, 0.6);
}

.sudoku-cell.sudoku-flash {
    animation: sudokuFlash 1s ease-in-out;
}

@keyframes errorShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

@keyframes sudokuFlash {
    0% {
        box-shadow: 0 0 0 rgba(255, 255, 255, 0);
        background: rgba(255, 255, 255, 0.08);
    }
    40% {
        box-shadow: 0 0 18px rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.18);
    }
    100% {
        box-shadow: 0 0 0 rgba(255, 255, 255, 0);
        background: rgba(108, 92, 231, 0.15);
    }
}

/* Light theme. The class sits on the screen root, above the board. */
.sudoku-light-theme .sudoku-board {
    background: #fff;
    box-shadow: none;
}

.sudoku-light-theme .sudoku-cell {
    border-color: #b7c0ca;
    background: #fff;
    color: #2161a5;
}

.sudoku-light-theme .sudoku-cell:nth-child(-n+9) {
    border-top-color: #000;
}

.sudoku-light-theme .sudoku-cell:nth-child(n+73) {
    border-bottom-color: #000;
}

.sudoku-light-theme .sudoku-cell:nth-child(9n+1) {
    border-left-color: #000;
}

.sudoku-light-theme .sudoku-cell:nth-child(9n) {
    border-right-color: #000;
}

.sudoku-light-theme .sudoku-cell.sudoku-box-bottom {
    border-bottom-color: #000;
}

.sudoku-light-theme .sudoku-cell.sudoku-box-right {
    border-right-color: #000;
}

.sudoku-light-theme .sudoku-cell:focus {
    background: #dceaff;
}

.sudoku-light-theme .sudoku-cell.sudoku-given {
    background: #edf0f3;
    color: #202833;
}

.sudoku-light-theme .sudoku-cell.related {
    background: #d7d7d7;
}

.sudoku-light-theme .sudoku-cell.selected {
    background: #b6b6b6;
    border-color: #777;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.sudoku-light-theme .sudoku-cell.error,
.sudoku-light-theme .sudoku-cell.sudoku-conflict {
    background: #f8d7da;
    color: #8f1d2c;
}
</style>
