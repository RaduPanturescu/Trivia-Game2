<script setup lang="ts">
/** Glass card used for grouped settings rows. */
</script>

<template>
  <div class="app-card">
    <slot />
  </div>
</template>

<style scoped>
.app-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 15px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
