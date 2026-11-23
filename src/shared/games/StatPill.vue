<script setup lang="ts">
/** Small rounded badge for a game stat such as the timer or mine count. */
defineProps<{
  /** Border colour: `secondary` (teal) or `accent` (pink). */
  tone: 'secondary' | 'accent'
}>()
</script>

<template>
  <div
    class="stat-pill"
    :class="`stat-pill--${tone}`"
  >
    <slot />
  </div>
</template>

<style scoped>
.stat-pill {
    background: var(--glass-bg);
    padding: 8px 15px;
    border-radius: 15px;
    font-weight: bold;
}

.stat-pill--secondary {
    border: 1px solid var(--secondary);
}

.stat-pill--accent {
    border: 1px solid var(--accent);
}
</style>
