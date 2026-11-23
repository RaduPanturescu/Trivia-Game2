<script setup lang="ts">
/** One achievement row: icon, name and description. In developer mode a click (or Enter / Space) toggles the unlock state. */
import { computed } from 'vue'
import { useAchievements, type Achievement } from '@/shared/achievements'
import { useDevMode } from '@/shared/devMode'

const props = defineProps<{ achievement: Achievement }>()

const achievements = useAchievements()
const { isDev } = useDevMode()

/** Image to show: the user's upload first, then the built-in image. Empty when the achievement uses an emoji. */
const imageSrc = computed(() => props.achievement.imageData || props.achievement.image || '')

/** Toggles unlock state in developer mode only. */
function toggle(): void {
  if (!isDev.value) return
  if (props.achievement.unlocked) achievements.relock(props.achievement.id)
  else achievements.unlock(props.achievement.id)
}
</script>

<template>
  <div
    class="achievement-card"
    :class="{ unlocked: achievement.unlocked }"
    :role="isDev ? 'button' : undefined"
    :tabindex="isDev ? 0 : undefined"
    :title="isDev ? (achievement.unlocked ? 'Click to re-lock (Dev)' : 'Click to unlock (Dev)') : undefined"
    :style="isDev ? { cursor: 'pointer' } : undefined"
    @click="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
  >
    <div
      class="achievement-icon"
      :class="{ locked: !achievement.unlocked }"
    >
      <img
        v-if="imageSrc"
        :src="imageSrc"
        alt=""
      >
      <template v-else>
        {{ achievement.emoji }}
      </template>
    </div>
    <div>
      <h4 class="achievement-name">
        {{ achievement.unlocked ? achievement.name : '???' }}
      </h4>
      <p class="achievement-desc">
        {{ achievement.desc }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.achievement-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 15px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  opacity: 0.5;
  filter: grayscale(100%);
  transition: all 0.3s;
}

.achievement-card.unlocked {
  opacity: 1;
  filter: grayscale(0%);
  border-color: var(--primary);
  box-shadow: 0 0 10px rgba(108, 92, 231, 0.3);
}

.achievement-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  flex-shrink: 0;
}

.achievement-icon.locked {
  filter: blur(5.12px);
  opacity: 0.6;
}

.achievement-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  display: block;
}

.achievement-name {
  color: var(--secondary);
  margin: 0 0 5px 0;
}

.achievement-desc {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0;
}
</style>
