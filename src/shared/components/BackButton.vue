<script setup lang="ts">
/** Round glass back button with a chevron icon; plays the pop sound and navigates to `to`. */
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { useAudio, SFX } from '../composables/useAudio'

const props = withDefaults(defineProps<{ to: RouteLocationRaw; ariaLabel?: string }>(), {
  ariaLabel: 'Back',
})

const router = useRouter()

/** Plays the click sound and navigates to the target route. */
function onClick(): void {
  useAudio().playSfx(SFX.pop)
  void router.push(props.to)
}
</script>

<template>
  <button
    type="button"
    class="back-btn"
    :aria-label="ariaLabel"
    @click="onClick"
  >
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18L9 12L15 6" />
    </svg>
  </button>
</template>

<style scoped>
.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  flex: 0 0 40px;
  aspect-ratio: 1 / 1;
  padding: 0;
  border-radius: 50%;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}
</style>
