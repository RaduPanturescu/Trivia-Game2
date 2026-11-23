<script setup lang="ts">
/** Volume-style range input bound with v-model, framed by speaker icons. */
withDefaults(defineProps<{ label: string; min?: number; max?: number; step?: number }>(), {
  min: 0,
  max: 1,
  step: 0.05,
})

const model = defineModel<number>()
</script>

<template>
  <div class="range-slider">
    <span class="range-icon">🔈</span>
    <input
      v-model.number="model"
      class="range-input"
      type="range"
      :aria-label="label"
      :min="min"
      :max="max"
      :step="step"
    >
    <span class="range-icon">🔊</span>
  </div>
</template>

<style scoped>
.range-slider {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
}

.range-icon {
  font-size: 0.9rem;
}

.range-input {
  flex-grow: 1;
}
</style>
