<script setup lang="ts">
/** Leaderboard card with the personal-record line, a clear button and up to 20 ranked rows. */
defineProps<{
  /** Panel heading, e.g. `Minesweeper Leaderboard`. */
  title: string
  /** Personal-record line, e.g. `PR: 1:23 (easy)` or `PR: -`. */
  pr: string
  /** Preformatted rows, best first. */
  rows: { label: string; time: string; date: string }[]
  /** Text shown when there are no rows. */
  emptyText: string
}>()

const emit = defineEmits<{
  /** Emitted when the user presses Clear Leaderboard. */
  clear: []
}>()
</script>

<template>
  <section class="leaderboard-panel">
    <div class="leaderboard-header">
      <h3>{{ title }}</h3>
      <div>
        <span>{{ pr }}</span>
        <button
          class="leaderboard-clear"
          type="button"
          @click="emit('clear')"
        >
          Clear Leaderboard
        </button>
      </div>
    </div>
    <div class="leaderboard-list">
      <div
        v-if="rows.length === 0"
        class="leaderboard-empty"
      >
        {{ emptyText }}
      </div>
      <div
        v-for="(row, index) in rows"
        :key="index"
        class="leaderboard-row"
        :class="{ 'leaderboard-top': index === 0 }"
      >
        <div>#{{ index + 1 }}</div>
        <div>{{ row.label }}</div>
        <div>{{ row.time }}</div>
        <div>{{ row.date }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.leaderboard-panel {
    margin-top: 20px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 15px;
    background: rgba(255,255,255,0.04);
    padding: 15px;
}

.leaderboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.leaderboard-header h3 {
    margin: 0;
    font-size: 1.1rem;
}

.leaderboard-header > div {
    display: flex;
    gap: 10px;
    align-items: center;
}

.leaderboard-header span {
    font-size: 0.95rem;
    color: var(--secondary);
}

/* Legacy `primary-btn` look, with the inline font size and background of the clear button. */
.leaderboard-clear {
    width: 100%;
    padding: 8px 14px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 15px;
    background: rgba(255,255,255,0.08);
    font-size: 0.85rem;
    font-weight: 600;
    margin-top: auto;
    box-shadow: var(--shadow-neon);
}

.leaderboard-clear:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 25px rgba(108, 92, 231, 0.7);
}

.leaderboard-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 260px;
    overflow-y: auto;
    padding-right: 4px;
}

.leaderboard-row {
    display: grid;
    grid-template-columns: 32px 1fr 80px 130px;
    gap: 10px;
    align-items: center;
    padding: 10px;
    border-radius: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    font-size: 0.9rem;
}

.leaderboard-top {
    border-color: var(--secondary);
    box-shadow: 0 0 20px rgba(0, 206, 201, 0.15);
}

.leaderboard-empty {
    color: var(--text-muted);
    padding: 12px;
    text-align: center;
}

/* Sudoku light theme. */
.sudoku-light-theme .leaderboard-panel {
    border-color: #d1d7de;
    background: #fff;
}

.sudoku-light-theme .leaderboard-row {
    border-color: #d9dee5;
    background: #f6f7f9;
    color: #202833;
}

.sudoku-light-theme .leaderboard-top {
    border-color: #245c9e;
    box-shadow: 0 0 12px rgba(36,92,158,0.12);
}

.sudoku-light-theme .leaderboard-empty {
    color: #566170;
}

@media (max-width: 600px), (max-height: 500px) {
    .leaderboard-header,
    .leaderboard-header > div {
        flex-wrap: wrap;
        gap: 8px;
    }

    .leaderboard-row {
        grid-template-columns: 28px minmax(0, 1fr) auto;
        gap: 6px;
        overflow-wrap: anywhere;
    }

    .leaderboard-row > :last-child {
        grid-column: 2 / -1;
    }
}
</style>
