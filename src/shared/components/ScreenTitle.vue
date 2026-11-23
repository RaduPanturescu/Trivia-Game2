<script setup lang="ts">
/** Centered heading used at the top of a screen. */
</script>

<template>
  <h2 class="screen-title">
    <slot />
  </h2>
</template>

<style scoped>
.screen-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  text-align: center;
  margin-top: var(--space-4);
  color: var(--secondary);
}
</style>
