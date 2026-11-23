<script setup lang="ts">
/** Centered dialog teleported to body; closes on backdrop click or Escape and focuses its panel when opened. */
import { nextTick, onMounted, useId, useTemplateRef, watch } from 'vue'

const props = defineProps<{ open: boolean; title: string; panelClass?: string }>()

const emit = defineEmits<{ close: [] }>()

const titleId = useId()
const panel = useTemplateRef<HTMLDivElement>('panel')

/** Moves focus into the panel so keyboard users land inside the dialog. */
function focusPanel(): void {
  panel.value?.focus()
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    await nextTick()
    focusPanel()
  },
)

onMounted(() => {
  if (props.open) focusPanel()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal-overlay"
      @click.self="emit('close')"
      @keydown.esc="emit('close')"
    >
      <div
        ref="panel"
        class="modal-panel"
        :class="panelClass"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
      >
        <header class="modal-header">
          <h2 :id="titleId">
            {{ title }}
          </h2>
          <button
            type="button"
            class="modal-close"
            aria-label="Close"
            @click="emit('close')"
          >
            ×
          </button>
        </header>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(7, 9, 18, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 2000;
}

.modal-panel {
  width: min(92vw, 540px);
  max-height: 80vh;
  overflow: auto;
  background: linear-gradient(180deg, rgba(22, 21, 34, 0.98), rgba(17, 14, 31, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.45);
  padding: 20px 18px 18px;
}

.modal-panel:focus {
  outline: none;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.modal-header h2 {
  color: var(--secondary);
  font-size: 1.6rem;
  font-weight: 800;
}

.modal-close {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 1.6rem;
  line-height: 1;
}

@media (max-width: 600px), (max-height: 500px) {
  .modal-overlay {
    padding: 12px;
    overflow-y: auto;
    touch-action: auto;
    overscroll-behavior: contain;
  }

  .modal-panel {
    max-height: calc(100dvh - 24px);
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}
</style>
