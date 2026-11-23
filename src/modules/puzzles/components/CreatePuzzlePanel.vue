<script setup lang="ts">
/** Create Your Puzzle form: picture upload, name, difficulty and Save & Play. The values are owned by the parent. */
import { ref, watch } from 'vue'
import { AppButton } from '@/shared/components'
import { DIFFICULTY_LEVELS, difficultyOption, type Difficulty } from '../types'

const name = defineModel<string>('name', { required: true })
const level = defineModel<Difficulty>('level', { required: true })
const file = defineModel<File | null>('file', { required: true })

const emit = defineEmits<{
  /** Emitted when Save & Play is pressed. */
  save: []
}>()

/** Bumped when the picture is cleared, which remounts the file input so it shows no file. */
const inputKey = ref(0)
watch(file, (value) => {
  if (value === null) inputKey.value += 1
})

/**
 * Stores the picked file in the form.
 * @param event - The change event of the file input.
 */
function onFileChange(event: Event): void {
  file.value = (event.target as HTMLInputElement).files?.[0] ?? null
}
</script>

<template>
  <section class="puzzle-create-panel">
    <div class="puzzle-section-heading">
      <div><h3>Create Your Puzzle</h3></div>
    </div>
    <div class="puzzle-create-controls">
      <label class="puzzle-upload-control">
        Picture
        <input
          :key="inputKey"
          type="file"
          accept="image/*"
          @change="onFileChange"
        >
      </label>
      <label>
        Puzzle name
        <input
          v-model="name"
          type="text"
          maxlength="60"
          placeholder="e.g. Summer holiday"
        >
      </label>
      <label>
        Difficulty
        <select v-model="level">
          <option
            v-for="option in DIFFICULTY_LEVELS"
            :key="option"
            :value="option"
          >
            {{ difficultyOption(option) }}
          </option>
        </select>
      </label>
      <AppButton
        class="save-play-btn"
        @click="emit('save')"
      >
        Save &amp; Play
      </AppButton>
    </div>
  </section>
</template>

<style scoped>
.puzzle-create-panel {
  margin: 12px 0;
  padding: 18px;
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.14), rgba(0, 206, 201, 0.06));
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
}

.puzzle-section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.puzzle-section-heading h3 {
  color: var(--secondary);
  font-size: 1.2rem;
}

.puzzle-create-controls {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) minmax(180px, 1.2fr) minmax(180px, 1fr) auto;
  gap: 12px;
  align-items: end;
  margin-top: 16px;
}

.puzzle-create-controls label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.puzzle-create-controls input,
.puzzle-create-controls select {
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 9px 11px;
  border: 1px solid var(--glass-border);
  border-radius: 11px;
  background: rgba(8, 9, 18, 0.75);
  color: var(--text-main);
  font: inherit;
}

.puzzle-upload-control input {
  padding: 7px;
  font-size: 0.76rem;
}

.puzzle-create-controls .save-play-btn {
  width: auto;
  flex: 0 0 auto;
  margin: 0;
  padding: 12px 16px;
  font-size: 0.95rem;
}

@media (max-width: 720px) {
  .puzzle-create-controls {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 430px) {
  .puzzle-create-panel {
    padding: 14px;
  }

  .puzzle-create-controls {
    grid-template-columns: 1fr;
  }

  .puzzle-create-controls .save-play-btn {
    width: 100%;
  }
}
</style>
