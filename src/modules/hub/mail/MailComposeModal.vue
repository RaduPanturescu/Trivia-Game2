<script setup lang="ts">
/** Developer-only form that adds a letter from two image files and an issue date. Checks run in the legacy order. */
import { ref, watch } from 'vue'
import { AppButton, AppModal } from '@/shared/components'
import { parseDisplayDate } from '@/shared/dates'
import { useDevMode } from '@/shared/devMode'
import { useMail } from './useMail'

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{ close: [] }>()

const mail = useMail()
const { isDev } = useDevMode()

const coverFile = ref<File | null>(null)
const insideFile = ref<File | null>(null)
const issueDateText = ref('')

watch(
  () => props.open,
  (open) => {
    if (open) return
    coverFile.value = null
    insideFile.value = null
    issueDateText.value = ''
  },
)

/**
 * Reads the first file picked in a file input.
 * @param event - The input's change event.
 * @returns The chosen file, or `null` when none was picked.
 */
function pickedFile(event: Event): File | null {
  const input = event.target
  return input instanceof HTMLInputElement ? (input.files?.[0] ?? null) : null
}

/** Validates the form and adds the letter, alerting with the legacy messages when a check fails. */
async function submit(): Promise<void> {
  const issueDate = parseDisplayDate(issueDateText.value)
  const cover = coverFile.value
  const inside = insideFile.value
  if (!cover || !inside || !issueDate) {
    alert('Please upload both images and add the issue date.')
    return
  }
  if (!isDev.value) {
    alert('Only developer mode can add a letter.')
    return
  }
  // shortcut: legacy counts the built-in letter here, so this guard always fires; kept as-is until the rule is decided.
  if (!mail.canAddLetter.value) {
    alert('Developer mode can only add one letter at a time.')
    return
  }
  try {
    await mail.addLetter(cover, inside, issueDate)
    emit('close')
  } catch {
    alert('There was a problem adding the letter.')
  }
}
</script>

<template>
  <AppModal
    :open="open"
    title="Send a Letter"
    @close="emit('close')"
  >
    <div class="mail-form-grid">
      <label class="mail-field">
        <span>Cover image</span>
        <input
          type="file"
          accept="image/*"
          @change="coverFile = pickedFile($event)"
        >
      </label>
      <label class="mail-field">
        <span>Inside image</span>
        <input
          type="file"
          accept="image/*"
          @change="insideFile = pickedFile($event)"
        >
      </label>
      <label class="mail-field">
        <span>Issue date</span>
        <input
          v-model="issueDateText"
          type="text"
          inputmode="numeric"
          placeholder="DD/MM/YYYY"
          maxlength="10"
        >
      </label>
    </div>
    <AppButton @click="submit">
      Add Letter
    </AppButton>
  </AppModal>
</template>

<style scoped>
.mail-form-grid {
  display: grid;
  gap: 14px;
  margin-bottom: 16px;
}

.mail-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.92rem;
}

.mail-field input {
  width: 100%;
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font: inherit;
}

.mail-field input::file-selector-button {
  background: rgba(108, 92, 231, 0.28);
  color: var(--text-main);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 8px 12px;
  margin-right: 12px;
  cursor: pointer;
}
</style>
