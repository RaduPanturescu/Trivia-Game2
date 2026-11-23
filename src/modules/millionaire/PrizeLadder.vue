<script setup lang="ts">
/** Collapsible prize ladder and contestant block beside the Millionaire questions. Q5, Q10 and Q15 are the safe havens. */
import { ref } from 'vue'

/** Indexes of the guaranteed safe-haven prizes (Q5, Q10, Q15). */
const SAFE_HAVENS = [4, 9, 14]

defineProps<{
  /** Prize amounts from Q1 to Q15. */
  levels: readonly string[]
  /** 0-based index of the current question. */
  currentIndex: number
  /** Name of the contestant. */
  contestant: string
}>()

const expanded = ref(false)

/**
 * Whether a prize level is a safe haven.
 * @param index - 0-based prize index.
 * @returns True for Q5, Q10 and Q15.
 */
function isSafeHaven(index: number): boolean {
  return SAFE_HAVENS.includes(index)
}
</script>

<template>
  <aside
    class="millionaire-sidebar"
    :class="expanded ? 'expanded' : 'collapsed'"
  >
    <button
      type="button"
      class="millionaire-prize-toggle"
      :aria-expanded="expanded ? 'true' : 'false'"
      @click="expanded = !expanded"
    >
      {{ expanded ? '◀' : '▶' }}
    </button>
    <div class="millionaire-prize-content">
      <div class="millionaire-contestant-block">
        <div class="millionaire-contestant-label">
          Contestant
        </div>
        <div class="millionaire-contestant-name">
          {{ contestant }}
        </div>
      </div>
      <h4>Prize Ladder</h4>
      <div class="millionaire-prize-list">
        <div
          v-for="(amount, index) in levels"
          :key="index"
          class="millionaire-prize-item"
          :class="{
            active: index === currentIndex,
            guaranteed: isSafeHaven(index),
            'safe-haven-unlocked': isSafeHaven(index) && currentIndex > index,
          }"
        >
          <span>Q{{ index + 1 }}</span>
          <span>{{ amount }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.millionaire-sidebar {
  flex: 0 0 auto;
  width: 64px;
  max-width: 64px;
  min-width: 64px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  transition: width 0.3s ease;
}

.millionaire-sidebar.expanded {
  width: 280px;
  max-width: 280px;
  min-width: 280px;
}

#app.millionaire-active .millionaire-prize-content {
  padding-top: 80px;
}

.millionaire-prize-toggle {
  position: absolute;
  top: 12px;
  left: 8px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(0,0,0,0.25);
  color: var(--text-main);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.millionaire-prize-content {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease 0.05s;
  padding: 64px 18px 18px;
}

.millionaire-sidebar.expanded .millionaire-prize-content {
  opacity: 1;
  pointer-events: auto;
}

.millionaire-sidebar.expanded .millionaire-prize-toggle {
  transform: rotate(180deg);
}

.millionaire-sidebar h4 {
  margin: 0 0 15px 0;
  color: var(--secondary);
  font-size: 1.05rem;
  letter-spacing: 0.03em;
}

.millionaire-contestant-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.millionaire-contestant-label {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.millionaire-contestant-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
  word-break: break-word;
}

.millionaire-prize-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  margin-bottom: 10px;
  border-radius: 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid transparent;
  color: var(--text-main);
  font-size: 0.95rem;
}

.millionaire-prize-item.active {
  background: rgba(108,92,231,0.18);
  border-color: rgba(108,92,231,0.35);
}

.millionaire-prize-item.guaranteed {
  border-color: rgba(255,215,0,0.5);
}

.millionaire-prize-item.guaranteed.safe-haven-unlocked {
  box-shadow: 0 0 12px rgba(255,215,0,0.5), inset 0 0 8px rgba(255,215,0,0.3);
  border-color: #ffd700;
  color: #ffd700;
  text-shadow: 0 0 5px rgba(255,215,0,0.5);
}

.millionaire-prize-item span:last-child {
  font-weight: 700;
}

@media (max-width: 600px), (max-height: 500px) {
  .millionaire-sidebar,
  .millionaire-sidebar.expanded {
    width: 100%;
    min-width: 0;
    max-width: none;
  }

  .millionaire-sidebar.collapsed:not(.expanded) {
    height: 54px;
  }

  .millionaire-sidebar.expanded {
    max-height: 50dvh;
    overflow-y: auto;
  }

  #app.millionaire-active .millionaire-prize-content {
    padding: 54px 16px 16px;
  }
}
</style>
