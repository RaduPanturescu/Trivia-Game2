<script setup lang="ts">
/** BMI calculator. Height and age are saved; the result uses the latest logged weight. */
import { computed, onMounted, ref } from 'vue'
import '../workout.css'
import { useWorkoutStore } from '../core/store'
import type { WorkoutBmiInputs } from '../core/types'
import { bmiReadout, BMI_STALE_TEXT } from './bmi'

const store = useWorkoutStore()
const height = ref('')
const age = ref('')
/** The inputs last calculated. `null` until the saved inputs have loaded. */
const calculated = ref<WorkoutBmiInputs | null>(null)
/** `true` after an edit, until Calculate is pressed again. */
const stale = ref(false)

const latest = computed(() => store.bodyWeightEntries.value.at(-1))
const readout = computed(() => (stale.value
  ? { text: BMI_STALE_TEXT, scale: null }
  : bmiReadout(calculated.value, latest.value)))

onMounted(async () => {
  await store.ready
  const saved = store.bmiInputs.value ?? {}
  height.value = String(saved.height ?? '')
  age.value = String(saved.age ?? '')
  calculated.value = { height: height.value, age: age.value }
})

/** Saves the inputs and shows the result. */
function calculate(): void {
  store.bmiInputs.value = { height: height.value, age: age.value }
  calculated.value = { height: height.value, age: age.value }
  stale.value = false
}

/** Hides the previous result until Calculate is pressed again. */
function markStale(): void {
  stale.value = true
}
</script>

<template>
  <section class="workout-panel bmi-panel">
    <div class="panel-header">
      <h3>BMI Calculator</h3>
    </div>
    <p class="bmi-hint">
      Uses your most recently recorded weight.
    </p>
    <form
      class="bmi-form"
      @submit.prevent="calculate"
    >
      <label>Height (cm)
        <input
          v-model="height"
          type="number"
          min="30"
          max="300"
          step="0.1"
          inputmode="decimal"
          required
          placeholder="e.g. 170"
          @input="markStale"
        ></label>
      <label>Age (years)
        <input
          v-model="age"
          type="number"
          min="1"
          max="120"
          step="1"
          inputmode="numeric"
          required
          placeholder="e.g. 30"
          @input="markStale"
        ></label>
      <button
        class="bmi-submit"
        type="submit"
      >
        Calculate BMI
      </button>
    </form>
    <p
      class="bmi-result"
      aria-live="polite"
    >
      {{ readout.text }}
    </p>
    <div
      v-if="readout.scale"
      class="bmi-scale"
    >
      <div
        class="bmi-scale-track"
        role="img"
        :aria-label="readout.scale.trackLabel"
      >
        <span class="bmi-scale-segment bmi-scale-underweight" />
        <span class="bmi-scale-segment bmi-scale-healthy" />
        <span class="bmi-scale-segment bmi-scale-overweight" />
        <span class="bmi-scale-segment bmi-scale-obesity" />
        <span
          class="bmi-scale-marker"
          aria-hidden="true"
          :style="{ left: `${readout.scale.markerPercent}%` }"
        ><span>{{ readout.scale.valueText }}</span></span>
      </div>
      <div
        class="bmi-scale-labels"
        aria-hidden="true"
      >
        <span>Underweight<br>&lt;18.5</span>
        <span>Healthy<br>18.5–24.9</span>
        <span>Overweight<br>25–29.9</span>
        <span>Obesity<br>≥30</span>
      </div>
      <p class="bmi-scale-note">
        Adult ranges shown. For ages under 20, BMI is interpreted using age- and sex-specific percentiles.
      </p>
    </div>
  </section>
</template>

<style scoped>
.bmi-panel {
  border-color: rgba(0, 206, 201, 0.14);
}

.bmi-hint {
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.5;
}

.bmi-form {
  display: flex;
  align-items: end;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.bmi-form label {
  display: grid;
  flex: 1 1 150px;
  gap: 7px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.bmi-form input {
  width: 100%;
  padding: 11px;
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
  color: var(--text-main);
  font: inherit;
}

.bmi-form input:focus {
  outline: 2px solid rgba(0, 206, 201, 0.5);
  outline-offset: 2px;
}

.bmi-submit {
  padding: 12px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  box-shadow: var(--shadow-neon);
  color: var(--text-main);
  font-size: 0.9rem;
  font-weight: 700;
}

.bmi-result {
  margin: 16px 0 8px;
  color: var(--secondary);
  font-weight: 700;
  line-height: 1.5;
}

.bmi-scale {
  margin: 42px 2px 4px;
}

.bmi-scale-track {
  position: relative;
  display: flex;
  height: 13px;
  overflow: visible;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  box-shadow: 0 0 16px rgba(0, 0, 0, 0.2);
}

.bmi-scale-segment {
  display: block;
  height: 100%;
}

.bmi-scale-underweight {
  flex: 3.5;
  border-radius: 999px 0 0 999px;
  background: #5da9ff;
}

.bmi-scale-healthy {
  flex: 6.5;
  background: #00b894;
}

.bmi-scale-overweight {
  flex: 5;
  background: #f0b429;
}

.bmi-scale-obesity {
  flex: 10;
  border-radius: 0 999px 999px 0;
  background: #e85d75;
}

.bmi-scale-marker {
  position: absolute;
  top: -5px;
  z-index: 1;
  width: 3px;
  height: 23px;
  border: 1px solid #fff;
  border-radius: 3px;
  background: #fff;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.75);
  transform: translateX(-50%);
}

.bmi-scale-marker span {
  position: absolute;
  bottom: calc(100% + 5px);
  left: 50%;
  padding: 3px 7px;
  border: 1px solid rgba(0, 206, 201, 0.55);
  border-radius: 7px;
  background: #171a2c;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
  transform: translateX(-50%);
}

.bmi-scale-labels {
  display: grid;
  grid-template-columns: 3.5fr 6.5fr 5fr 10fr;
  gap: 0;
  margin-top: 11px;
  color: var(--text-muted);
  font-size: 0.68rem;
  line-height: 1.4;
  text-align: center;
}

.bmi-scale-labels span:first-child {
  text-align: left;
}

.bmi-scale-labels span:last-child {
  text-align: right;
}

.bmi-scale-note {
  margin: 10px 0 0;
  color: var(--text-muted);
  font-size: 0.72rem;
  line-height: 1.45;
}
</style>
