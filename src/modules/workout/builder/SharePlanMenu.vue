<script setup lang="ts">
/** "Share Workout Plan" menu: exports the whole program as JSON, or imports an export as a new saved plan. */
import { useTemplateRef } from 'vue'
import { useProgramTransfer } from './useProgramTransfer'

const emit = defineEmits<{
  /** An import was saved; the id of the new plan. */
  imported: [planId: string]
}>()

const transfer = useProgramTransfer()
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

/**
 * Imports the chosen file, then clears the input so the same file can be chosen again.
 * @param event - The file input's change event.
 */
async function onFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    const planId = await transfer.importFile(file)
    if (planId) emit('imported', planId)
  }
  input.value = ''
}
</script>

<template>
  <details class="workout-share-menu">
    <summary class="mini-btn">
      Share Workout Plan
    </summary>
    <div class="workout-plan-transfer-actions">
      <button
        class="mini-btn"
        type="button"
        @click="transfer.exportPlan()"
      >
        Export Plan
      </button>
      <button
        class="mini-btn"
        type="button"
        @click="fileInput?.click()"
      >
        Import Plan
      </button>
      <input
        id="workout-import-file"
        ref="fileInput"
        type="file"
        accept=".json,application/json"
        hidden
        @change="onFileChange"
      >
    </div>
  </details>
</template>

<style scoped>
.workout-share-menu {
  position: relative;
  align-self: stretch;
  margin-top: 4px;
}

.workout-share-menu > summary {
  list-style: none;
  cursor: pointer;
  min-height: 40px;
  display: flex;
  width: max-content;
  margin-left: auto;
  align-items: center;
  justify-content: center;
}

.workout-share-menu > summary::-webkit-details-marker {
  display: none;
}

.workout-plan-transfer-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
  justify-content: flex-end;
}

.workout-plan-transfer-actions .mini-btn {
  min-height: 42px;
  background: rgba(0, 206, 201, 0.12);
  border-color: rgba(0, 206, 201, 0.35);
}

.workout-plan-transfer-actions .mini-btn:hover {
  background: rgba(0, 206, 201, 0.22);
}
</style>
