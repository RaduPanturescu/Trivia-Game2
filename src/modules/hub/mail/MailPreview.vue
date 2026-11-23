<script setup lang="ts">
/** Full-screen view of a letter's inside image. Closes on the back button or Escape, and takes focus when opened. */
import { nextTick, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'
import { formatMailDate, type MailLetter } from './useMail'

const props = defineProps<{ letter: MailLetter | null }>()

const emit = defineEmits<{ close: [] }>()

const backButton = useTemplateRef<HTMLButtonElement>('backButton')

/** Closes the preview when Escape is pressed while it is open. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.letter) emit('close')
}

watch(
  () => props.letter,
  async (letter) => {
    if (!letter) return
    await nextTick()
    backButton.value?.focus()
  },
)

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="letter"
      class="mail-preview"
      aria-modal="true"
      role="dialog"
      aria-label="Letter inside view"
    >
      <button
        ref="backButton"
        type="button"
        class="mail-preview-back"
        aria-label="Back to mailbox"
        @click="emit('close')"
      >
        ← Back
      </button>
      <img
        class="mail-preview-image"
        :src="letter.insideImage"
        alt="Letter inside view"
      >
      <div class="mail-preview-date">
        Issue date: {{ formatMailDate(letter.date) }}
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.mail-preview {
  position: fixed;
  inset: 0;
  z-index: 2200;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #080912;
}

.mail-preview-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: radial-gradient(circle at center, #1d1d2e, #080912 75%);
}

.mail-preview-back {
  position: absolute;
  z-index: 1;
  top: max(16px, env(safe-area-inset-top));
  left: max(16px, env(safe-area-inset-left));
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 24px;
  background: rgba(17, 16, 34, 0.82);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(8px);
}

.mail-preview-date {
  position: absolute;
  right: max(16px, env(safe-area-inset-right));
  bottom: max(16px, env(safe-area-inset-bottom));
  left: max(16px, env(safe-area-inset-left));
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(17, 16, 34, 0.72);
  color: #fff;
  font-size: 0.9rem;
  text-align: center;
  pointer-events: none;
}
</style>
