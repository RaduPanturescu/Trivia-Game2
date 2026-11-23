<script setup lang="ts">
/** Mailbox dialog: letter cards that flip, open a full-screen preview, and delete. Developers can also compose. */
import { ref, watch } from 'vue'
import { AppButton, AppModal } from '@/shared/components'
import { useDevMode } from '@/shared/devMode'
import MailComposeModal from './MailComposeModal.vue'
import MailPreview from './MailPreview.vue'
import { formatMailDate, useMail, type MailLetter } from './useMail'

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{ close: [] }>()

const mail = useMail()
const { isDev } = useDevMode()

const composeOpen = ref(false)
const flippedIds = ref(new Set<string>())
const preview = ref<MailLetter | null>(null)
/** Element that had focus when the preview opened, so closing the preview can return to it. */
let previewReturnFocus: HTMLElement | null = null

// Legacy re-rendered the list on open and on every change, which reset every card to its front.
watch(() => props.open, (open) => open && flippedIds.value.clear())
watch(() => mail.letters.value, () => flippedIds.value.clear())

/**
 * Flips a letter card between its cover and its inside.
 * @param id - Id of the letter whose card was clicked.
 */
function toggleFlip(id: string): void {
  if (flippedIds.value.has(id)) flippedIds.value.delete(id)
  else flippedIds.value.add(id)
}

/**
 * Opens the full-screen preview of a letter. Letters without an inside image do not open.
 * @param letter - The letter to preview.
 * @param event - The click on the open button, used to remember where focus returns.
 */
function openPreview(letter: MailLetter, event: MouseEvent): void {
  if (!letter.insideImage) return
  const target = event.currentTarget
  previewReturnFocus = target instanceof HTMLElement ? target : null
  preview.value = letter
}

/** Closes the preview and restores focus to the button that opened it. */
function closePreview(): void {
  preview.value = null
  if (previewReturnFocus?.isConnected) previewReturnFocus.focus()
  previewReturnFocus = null
}
</script>

<template>
  <AppModal
    :open="open"
    title="Mailbox"
    @close="emit('close')"
  >
    <AppButton
      v-if="isDev"
      class="mail-compose-btn"
      @click="composeOpen = true"
    >
      Send Mail
    </AppButton>
    <div
      v-if="mail.letters.value.length === 0"
      class="mail-empty-state"
    >
      <div class="mail-empty-icon">
        📭
      </div>
      <p>No letters yet.</p>
    </div>
    <div
      v-else
      class="mail-list"
    >
      <div
        v-for="letter in mail.letters.value"
        :key="letter.id"
        class="mail-letter-card"
        :class="{ 'is-flipped': flippedIds.has(letter.id) }"
      >
        <button
          type="button"
          class="mail-letter-open-tab"
          aria-label="Open letter in a big view"
          @click="openPreview(letter, $event)"
        >
          🔎
        </button>
        <button
          v-if="!letter.builtIn"
          type="button"
          class="mail-letter-delete"
          aria-label="Delete letter"
          @click="mail.removeLetter(letter.id)"
        >
          ✕
        </button>
        <button
          type="button"
          class="mail-letter-button"
          :aria-label="`Open letter from ${formatMailDate(letter.date)}`"
          @click="toggleFlip(letter.id)"
        >
          <div class="mail-letter-inner">
            <div class="mail-letter-face mail-letter-front">
              <img
                :src="letter.coverImage"
                alt="Letter cover"
              >
            </div>
            <div class="mail-letter-face mail-letter-back">
              <img
                :src="letter.insideImage"
                alt="Letter contents"
              >
              <div class="mail-letter-inside-overlay" />
              <div class="mail-letter-date">
                <span>Issue date</span>
                <strong>{{ formatMailDate(letter.date) }}</strong>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  </AppModal>
  <MailComposeModal
    :open="composeOpen"
    @close="composeOpen = false"
  />
  <MailPreview
    :letter="preview"
    @close="closePreview"
  />
</template>

<style scoped>
.mail-compose-btn.app-btn {
  width: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 16px;
  padding: 12px 18px;
  font-size: 1rem;
}

.mail-empty-state {
  display: grid;
  place-items: center;
  text-align: center;
  color: var(--text-muted);
  padding: 28px 12px 12px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
}

.mail-empty-icon {
  font-size: 2.5rem;
  margin-bottom: 8px;
}

.mail-list {
  display: grid;
  gap: 16px;
  margin-top: 18px;
}

.mail-letter-card {
  perspective: 1200px;
  position: relative;
}

.mail-letter-open-tab,
.mail-letter-delete {
  position: absolute;
  top: 10px;
  z-index: 5;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(17, 16, 34, 0.8);
  color: white;
  font-size: 1.1rem;
  line-height: 1;
  display: grid;
  place-items: center;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.25);
}

.mail-letter-open-tab {
  right: 50px;
}

.mail-letter-delete {
  right: 10px;
}

.mail-letter-button {
  width: 100%;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

.mail-letter-inner {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  transform-style: preserve-3d;
  transition: transform 0.7s ease;
}

.mail-letter-card.is-flipped .mail-letter-inner {
  transform: rotateY(180deg);
}

.mail-letter-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.2);
}

.mail-letter-face img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: rgba(255, 255, 255, 0.04);
}

.mail-letter-back {
  transform: rotateY(180deg);
}

.mail-letter-inside-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: end;
  justify-content: center;
  background: linear-gradient(180deg, rgba(7, 7, 11, 0.18), rgba(7, 7, 11, 0.72));
  padding: 14px;
}

.mail-letter-date {
  position: absolute;
  left: 14px;
  right: 14px;
  top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(6, 7, 15, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e8dfff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.mail-letter-date strong {
  color: #fff;
  font-size: 0.8rem;
}
</style>
