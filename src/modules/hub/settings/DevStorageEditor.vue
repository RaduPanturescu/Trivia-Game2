<script setup lang="ts">
/** Dev tool listing every stored key with an editable raw value, plus add, reload and QR actions. */
import { onMounted, ref } from 'vue'
import { AppButton } from '@/shared/components'
import QrCodeModal from './QrCodeModal.vue'
import { listStorageEntries, removeRawValue, setRawValue, type StorageEntry } from './devStorage'

const entries = ref<StorageEntry[]>([])
const qrOpen = ref(false)

/** Re-reads every key and value from storage into the list. */
async function refresh(): Promise<void> {
  entries.value = await listStorageEntries()
}

/**
 * Saves an edited raw value. Storage writes reload the app (see `setRawValue`).
 * @param key - Storage key that was edited.
 * @param event - The change event from the value input.
 */
async function onValueChange(key: string, event: Event): Promise<void> {
  if (!(event.target instanceof HTMLInputElement)) return
  await setRawValue(key, event.target.value)
}

/** Prompts for a new key and value, then stores them. */
async function addItem(): Promise<void> {
  const key = prompt('Enter new local storage key:')
  if (!key) return
  const value = prompt(`Enter value for key '${key}':`)
  if (value === null) return
  await setRawValue(key, value)
}

/**
 * Deletes one stored key.
 * @param key - Storage key to delete.
 */
async function removeEntry(key: string): Promise<void> {
  await removeRawValue(key)
}

onMounted(refresh)
</script>

<template>
  <div class="dev-storage">
    <h4 class="dev-storage-title">
      Dev LocalStorage Editor
    </h4>
    <div class="dev-storage-list">
      <div
        v-for="entry in entries"
        :key="entry.key"
        class="dev-storage-row"
      >
        <span
          class="dev-storage-key"
          :title="entry.key"
        >{{ entry.key }}</span>
        <input
          class="dev-storage-value"
          type="text"
          :value="entry.value"
          :aria-label="`Value of ${entry.key}`"
          @change="onValueChange(entry.key, $event)"
        >
        <button
          type="button"
          class="dev-storage-delete"
          :aria-label="`Delete ${entry.key}`"
          @click="removeEntry(entry.key)"
        >
          🗑️
        </button>
      </div>
    </div>
    <div class="dev-storage-actions">
      <AppButton
        variant="subtle"
        class="dev-action"
        @click="addItem"
      >
        + Add Item
      </AppButton>
      <AppButton
        variant="subtle"
        class="dev-action"
        @click="refresh"
      >
        🔄 Reload
      </AppButton>
      <AppButton
        variant="subtle"
        class="dev-action dev-action-qr"
        @click="qrOpen = true"
      >
        QR Code
      </AppButton>
    </div>
    <QrCodeModal
      v-if="qrOpen"
      @close="qrOpen = false"
    />
  </div>
</template>

<style scoped>
.dev-storage {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-top: 15px;
  border-top: 1px solid var(--glass-border);
  padding-top: 15px;
}

.dev-storage-title {
  color: var(--secondary);
  font-size: 1rem;
  margin-bottom: 5px;
}

.dev-storage-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 5px;
}

.dev-storage-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.dev-storage-key {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--secondary);
}

.dev-storage-value {
  width: 120px;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid var(--glass-border);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 0.8rem;
}

.dev-storage-delete {
  padding: 2px 6px;
  background: transparent;
  border: none;
  color: #e74c3c;
  font-size: 1.1rem;
  cursor: pointer;
}

.dev-storage-actions {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 10px;
}

.dev-storage-actions .dev-action {
  flex: 1;
}

.dev-storage-actions .dev-action-qr {
  background: rgba(0, 206, 201, 0.12);
  border-color: rgba(0, 206, 201, 0.4);
}
</style>
