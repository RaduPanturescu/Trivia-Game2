<script setup lang="ts">
/** Developer Mode card: a password gate while locked, and the storage editor plus deactivate while unlocked. */
import { ref } from 'vue'
import { AppButton, AppCard } from '@/shared/components'
import { MAX_FAILED_ATTEMPTS, useDevMode } from '@/shared/devMode'
import DevStorageEditor from './DevStorageEditor.vue'

const { isDev, failStreak, tryUnlock, deactivate: deactivateDevMode } = useDevMode()
const password = ref('')

/** Checks the typed password. The fifth miss shows the hacker achievement toast instead of an alert. */
function unlock(): void {
  const result = tryUnlock(password.value)
  password.value = ''
  if (result === 'ok') alert('Developer Mode Activated!')
  else if (result === 'wrong') alert(`Incorrect password. (${failStreak.value}/${MAX_FAILED_ATTEMPTS})`)
}

/** Turns developer mode off and confirms. */
function deactivate(): void {
  deactivateDevMode()
  alert('Developer Mode Deactivated.')
}
</script>

<template>
  <AppCard class="dev-card">
    <div class="dev-header">
      <span>Developer Mode</span>
      <span
        class="dev-status"
        :class="{ 'dev-status--on': isDev }"
      >{{ isDev ? 'ENABLED' : 'DISABLED' }}</span>
    </div>
    <div
      v-if="!isDev"
      class="dev-unlock"
    >
      <input
        v-model="password"
        class="dev-password"
        type="password"
        placeholder="Enter password"
        aria-label="Developer password"
        @keydown.enter="unlock"
      >
      <AppButton
        variant="subtle"
        class="dev-unlock-btn"
        @click="unlock"
      >
        Unlock
      </AppButton>
    </div>
    <template v-else>
      <DevStorageEditor />
      <AppButton
        variant="subtle"
        block
        class="dev-deactivate"
        @click="deactivate"
      >
        Deactivate Dev Mode
      </AppButton>
    </template>
  </AppCard>
</template>

<style scoped>
.dev-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dev-status {
  font-size: 0.95rem;
  font-weight: bold;
  color: var(--accent);
}

.dev-status--on {
  color: var(--correct);
}

.dev-unlock {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 10px;
}

.dev-password {
  flex-grow: 1;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid var(--glass-border);
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  font-family: inherit;
  font-size: 0.9rem;
}

.dev-card .dev-unlock-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 10px;
  background: var(--primary);
  font-size: 0.9rem;
}

.dev-card .dev-deactivate {
  margin-top: 15px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(231, 76, 60, 0.15);
  border: 1px solid #e74c3c;
  color: #ff7675;
  font-size: 0.9rem;
}
</style>
