<script setup lang="ts">
/** Fixed stack of transient toasts, rendered from the shared useToast queue. */
import { useToast } from '../composables/useToast'

const { toasts } = useToast()
</script>

<template>
  <div
    class="toast-host"
    aria-live="polite"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="{ 'maya-toast': toast.variant === 'maya', 'task-complete-toast': toast.variant === 'task' }"
    >
      <template v-if="toast.variant === 'maya'">
        <div class="toast-content maya-content">
          <h4>{{ toast.title }}</h4>
          <p>{{ toast.message }}</p>
        </div>
      </template>
      <template v-else>
        <div
          v-if="toast.icon"
          class="toast-icon"
        >
          <img
            v-if="toast.icon.image"
            :src="toast.icon.image"
            alt=""
          >
          <template v-else>
            {{ toast.icon.emoji }}
          </template>
        </div>
        <div class="toast-content">
          <h4>{{ toast.title }}</h4>
          <p>{{ toast.message }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  z-index: 1000;
}

.toast {
  background: linear-gradient(135deg, #2d3436, #0b0c10);
  border: 1px solid var(--primary);
  border-radius: 15px;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: var(--shadow-neon);
  animation: toastSlideUp 0.3s ease-out forwards, toastFadeOut 0.3s ease-in forwards 4s;
  width: 320px;
  max-width: calc(100vw - 32px);
}

.toast.maya-toast {
  width: min(250px, calc(100vw - 32px));
  padding: 11px 14px;
  gap: var(--space-3);
}

@keyframes toastSlideUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes toastFadeOut {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(50px);
    opacity: 0;
  }
}

.toast-icon {
  font-size: 2.5rem;
}

.toast-icon img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.toast-content h4 {
  margin: 0;
  color: var(--secondary);
  font-size: var(--font-size-lg);
}

.toast-content p {
  margin: 5px 0 0;
  color: var(--text-main);
  font-size: 0.9rem;
}

.maya-content {
  text-align: center;
  width: 100%;
}

.maya-content p {
  margin-top: 6px;
  color: var(--text-muted);
}
</style>
