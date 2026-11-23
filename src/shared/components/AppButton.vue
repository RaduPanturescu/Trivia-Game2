<script setup lang="ts">
/** Shared button in the primary, subtle or danger look from the legacy stylesheet. */
withDefaults(defineProps<{ variant?: 'primary' | 'subtle' | 'danger'; block?: boolean }>(), {
  variant: 'primary',
  block: false,
})
</script>

<template>
  <button
    type="button"
    class="app-btn"
    :class="[`app-btn--${variant}`, { 'app-btn--block': block }]"
  >
    <slot />
  </button>
</template>

<style scoped>
.app-btn--primary {
  width: 100%;
  padding: 18px;
  border-radius: 15px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin-top: auto;
  box-shadow: var(--shadow-neon);
}

.app-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 25px rgba(108, 92, 231, 0.7);
}

.app-btn--subtle {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 8px;
  font-size: 0.85rem;
  font-weight: 700;
}

.app-btn--danger {
  background: #e74c3c;
  color: #fff;
  font-weight: 700;
  border-radius: 15px;
  padding: 15px 20px;
  box-shadow: 0 10px 30px rgba(231, 76, 60, 0.3);
}

.app-btn--block {
  width: 100%;
}
</style>
