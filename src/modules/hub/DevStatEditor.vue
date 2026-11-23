<script setup lang="ts">
/** Developer editor for the welcome-screen countdown date or Maya click count. Enter saves; Escape or the backdrop cancels. */
import { computed, ref, useTemplateRef, watch } from 'vue'
import { AppModal } from '@/shared/components'
import { isoDate, parseLocalDate } from '@/shared/dates'
import { DEFAULT_DAYS_LEFT_TARGET_DATE, useWelcomeStats } from '@/shared/welcomeStats'

const props = defineProps<{ stat: 'targetDate' | 'mayaClicks' | null }>()

const emit = defineEmits<{ close: [] }>()

const stats = useWelcomeStats()
const draft = ref('')
const input = useTemplateRef<HTMLInputElement>('input')

const isDate = computed(() => props.stat === 'targetDate')

watch(
  () => props.stat,
  (stat) => {
    if (!stat) return
    draft.value = stat === 'targetDate' ? stats.targetDate.value || DEFAULT_DAYS_LEFT_TARGET_DATE : String(stats.mayaClicks.value)
    // Deferred so the focus lands after AppModal focuses its own panel.
    setTimeout(() => input.value?.focus(), 0)
  },
)

/**
 * Checks that a value is a real calendar date written as `YYYY-MM-DD`.
 * @param value - The text from the date input.
 * @returns `true` when the date exists.
 */
function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && isoDate(parseLocalDate(value)) === value
}

/** Validates the draft with the legacy messages, saves it, and closes the editor. */
async function save(): Promise<void> {
  const value = draft.value.trim()
  if (isDate.value) {
    if (value && !isValidIsoDate(value)) {
      alert('Choose a valid target date.')
      return
    }
    await stats.setTargetDate(value)
  } else {
    const count = Number(value)
    if (!Number.isSafeInteger(count) || count < 0) {
      alert('Enter a whole number of zero or greater.')
      return
    }
    stats.setMayaClicks(count)
  }
  emit('close')
}
</script>

<template>
  <AppModal
    :open="stat !== null"
    :title="isDate ? 'Edit countdown date' : 'Edit Maya clicks'"
    @close="emit('close')"
  >
    <label
      class="dev-stat-label"
      for="dev-stat-input"
    >{{ isDate ? 'Target date' : 'Click count' }}</label>
    <input
      id="dev-stat-input"
      ref="input"
      v-model="draft"
      class="dev-stat-input"
      :type="isDate ? 'date' : 'number'"
      :min="isDate ? undefined : 0"
      step="1"
      autocomplete="off"
      @keydown.enter="save"
    >
    <div class="dev-stat-actions">
      <button
        type="button"
        @click="emit('close')"
      >
        Cancel
      </button>
      <button
        type="button"
        class="dev-stat-save"
        @click="save"
      >
        Save
      </button>
    </div>
  </AppModal>
</template>

<style scoped>
.dev-stat-label {
  display: block;
  margin-bottom: 7px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.dev-stat-input {
  width: 100%;
  min-height: 46px;
  padding: 10px 12px;
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font: inherit;
}

.dev-stat-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.dev-stat-actions button {
  min-width: 84px;
  padding: 10px 14px;
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  font-weight: 700;
}

.dev-stat-actions .dev-stat-save {
  border-color: rgba(0, 206, 201, 0.45);
  background: rgba(0, 206, 201, 0.2);
}
</style>
