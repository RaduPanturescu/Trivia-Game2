<script setup lang="ts">
/** Glass card that shows the question text. Renders the legacy `.question-container` and its `h3`. */
defineProps<{
  /** Question text shown as the card heading. */
  text: string
  /** Optional minimum card height as a CSS length. Defaults to 150px. */
  minHeight?: string
}>()
</script>

<template>
  <div
    class="question-container"
    :style="minHeight ? { minHeight } : undefined"
  >
    <h3 class="question-text">
      {{ text }}
    </h3>
  </div>
</template>

<style scoped>
.question-container {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  padding: 30px 20px;
  border-radius: 20px;
  margin-bottom: 30px;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.question-container::after {
  content: '';
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 15px 15px 0;
  border-style: solid;
  border-color: var(--glass-border) transparent transparent transparent;
}

.question-text {
  font-size: 1.4rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.4;
}
</style>
