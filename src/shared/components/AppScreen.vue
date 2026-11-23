<script setup lang="ts">
/** Full-height screen container; the router's `screen` transition classes below replace the legacy `.active` and `.slide-out` states. */
</script>

<template>
  <div class="screen">
    <slot />
  </div>
</template>

<style>
/* Screens. Base state is visible; the transition classes below hide an entering or leaving screen. */
.screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
  overflow-y: auto;
}

.screen-enter-active,
.screen-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease, visibility 0.4s;
}

.screen-enter-from {
  opacity: 0;
  visibility: hidden;
  transform: translateX(50px);
}

.screen-leave-to {
  opacity: 0;
  visibility: hidden;
  transform: translateX(-50px);
}

/* Small screens retain the screen transitions while each screen scrolls. */
@media (max-width: 600px), (max-height: 500px) {
  .screen {
    padding-top: max(30px, env(safe-area-inset-top));
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
    padding-bottom: max(24px, env(safe-area-inset-bottom));
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    -webkit-overflow-scrolling: touch;
  }

  .screen > .back-btn {
    top: max(20px, env(safe-area-inset-top));
    left: max(20px, env(safe-area-inset-left));
  }

  .screen > :not(.back-btn) {
    flex-shrink: 0;
  }
}
</style>
