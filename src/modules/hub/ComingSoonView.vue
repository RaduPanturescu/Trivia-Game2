<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'

/**
 * Placeholder for routes whose legacy screen is not ported yet. Shows the
 * route title from `meta.title`.
 */
const route = useRoute()
</script>

<template>
  <div class="screen coming-soon">
    <h2>{{ route.meta.title }}</h2>
    <p>Coming soon in the Vue rewrite</p>
    <RouterLink to="/hub">Back</RouterLink>
  </div>
</template>

<style scoped>
.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 16px;
  text-align: center;
}

.coming-soon p {
  color: var(--text-muted);
}
</style>
