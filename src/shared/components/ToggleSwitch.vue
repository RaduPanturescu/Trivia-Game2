<script setup lang="ts">
/** On/off switch bound with v-model, with its label on the left like the legacy settings rows. */
defineProps<{ label: string }>()

const model = defineModel<boolean>()
</script>

<template>
  <div class="toggle-row">
    <span class="toggle-label">{{ label }}</span>
    <label class="switch">
      <input
        v-model="model"
        type="checkbox"
        :aria-label="label"
      >
      <span class="slider round" />
    </label>
  </div>
</template>

<style scoped>
.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.switch {
  position: relative;
  display: inline-block;
  width: 70px;
  height: 36px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--glass-border);
  transition: background-color 0.4s;
  border-radius: 34px;
}

.slider::before {
  position: absolute;
  content: "";
  height: 28px;
  width: 28px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: transform 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--primary);
}

input:checked + .slider::before {
  transform: translateX(34px);
}
</style>
