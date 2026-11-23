<script setup lang="ts">
/** Dev tool dialog that turns typed text into a QR code image. Mounted fresh each time it opens, like the legacy dialog. */
import { onMounted, ref, useTemplateRef } from 'vue'
import { AppButton, AppModal } from '@/shared/components'
import { loadImage, qrCodeUrl } from './qrCode'

const emit = defineEmits<{ close: [] }>()

/** Where the generate request currently stands. */
type Status = 'idle' | 'loading' | 'ready' | 'error'

const text = ref('Workout Plan')
const status = ref<Status>('idle')
const imageUrl = ref<string | null>(null)
const input = useTemplateRef<HTMLInputElement>('input')
let latestRequest = 0

onMounted(() => input.value?.focus())

/** Generates the QR image for the typed text. Only the most recent request updates the dialog. */
async function generate(): Promise<void> {
  const value = text.value.trim()
  if (!value) {
    input.value?.focus()
    return
  }
  const request = ++latestRequest
  const url = qrCodeUrl(value)
  status.value = 'loading'
  imageUrl.value = null
  try {
    await loadImage(url)
    if (request !== latestRequest) return
    imageUrl.value = url
    status.value = 'ready'
  } catch {
    if (request !== latestRequest) return
    status.value = 'error'
  }
}
</script>

<template>
  <AppModal
    :open="true"
    title="Create QR Code"
    panel-class="qr-modal"
    @close="emit('close')"
  >
    <div class="qr-body">
      <label class="qr-label">
        Text or link
        <input
          ref="input"
          v-model="text"
          class="qr-input"
          type="text"
          placeholder="Enter text or a link"
          aria-label="Text or link to encode"
          @keydown.enter="generate"
        >
      </label>
      <AppButton
        block
        class="qr-generate"
        @click="generate"
      >
        Generate QR Code
      </AppButton>
      <div class="qr-result">
        <p v-if="status === 'loading'">
          Generating…
        </p>
        <p v-else-if="status === 'error'">
          QR code service is unavailable. Check your internet connection and try again.
        </p>
        <template v-else-if="status === 'ready' && imageUrl">
          <img
            class="qr-image"
            :src="imageUrl"
            alt="QR code"
          >
          <a
            class="qr-download"
            :href="imageUrl"
            download="qr-code.png"
          >Download PNG</a>
        </template>
      </div>
      <AppButton
        block
        class="qr-close"
        @click="emit('close')"
      >
        Close
      </AppButton>
    </div>
  </AppModal>
</template>

<style scoped>
/* AppModal panel, sized and coloured like the legacy QR dialog. Element selector raises specificity over AppModal's own rules. */
:global(div.qr-modal.modal-panel) {
  width: 360px;
  max-width: 90vw;
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  padding: 20px;
  color: #fff;
}

.qr-body {
  display: flex;
  flex-direction: column;
}

.qr-label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-muted);
}

.qr-body .qr-input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin-top: 8px;
  padding: 11px 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  background: #080b13;
  color: #fff;
  font: inherit;
}

.qr-body .qr-generate,
.qr-body .qr-close {
  background: linear-gradient(135deg, #00cec9, #6c5ce7);
  border-radius: 10px;
  padding: 11px;
  font-size: 1rem;
  font-weight: 700;
  box-shadow: none;
}

.qr-body .qr-generate {
  margin-top: 14px;
}

.qr-body .qr-close {
  margin-top: 12px;
  padding: 10px;
}

.qr-body .qr-generate:hover,
.qr-body .qr-close:hover {
  transform: none;
}

.qr-result {
  margin-top: 14px;
  text-align: center;
}

.qr-result p {
  margin: 0;
}

.qr-image {
  display: block;
  width: 220px;
  height: 220px;
  margin: 0 auto 12px;
  background: #fff;
  border-radius: 12px;
  padding: 8px;
}

.qr-download {
  display: inline-block;
  width: 100%;
  margin-top: 8px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  text-align: center;
  text-decoration: none;
  box-sizing: border-box;
}
</style>
