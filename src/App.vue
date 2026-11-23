<script setup lang="ts">
/** App shell: routed screens with the legacy slide transition, the toast host, route-driven layout and music. */
import { onUnmounted, watch, watchEffect } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { ToastHost } from '@/shared/components'
import { useAchievements } from '@/shared/achievements'
import { useAudio } from '@/shared/composables/useAudio'
import { useToast } from '@/shared/composables/useToast'

const route = useRoute()
const toast = useToast()

watchEffect(() => {
  document.getElementById('app')?.classList.toggle('wide', route.meta.wide === true)
})

watch(
  () => route.meta.music ?? 'main',
  (track) => useAudio().setMusicTrack(track),
  { immediate: true },
)

const offUnlocked = useAchievements().onUnlocked((achievement) => {
  toast.show({
    title: 'Achievement Unlocked!',
    message: achievement.name,
    icon: achievement.image
      ? { image: achievement.image }
      : achievement.imageData
        ? { image: achievement.imageData }
        : { emoji: achievement.emoji ?? '🏆' },
  })
})
onUnmounted(offUnlocked)
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="screen">
      <component :is="Component" />
    </Transition>
  </RouterView>
  <ToastHost />
</template>
