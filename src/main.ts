import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { useAchievements } from './shared/achievements'
import { useDevMode } from './shared/devMode'
import { useProfileImage } from './shared/profileImage'
import { useProgress } from './shared/progress'
import { useMusicEnabled, useMusicVolume, useSfxVolume, useSoundEnabled } from './shared/settings'
import { useWelcomeStats } from './shared/welcomeStats'
import { useMail } from './modules/hub/mail/useMail'
import './shared/styles/tokens.css'
import './shared/styles/base.css'

/**
 * Loads every stored value before the first render. Writes made before a repository has loaded are lost,
 * so the stores are awaited here instead of being read lazily.
 */
async function start(): Promise<void> {
  await Promise.all([
    useAchievements().ready,
    useProgress().ready,
    useDevMode().ready,
    useWelcomeStats().ready,
    useProfileImage().ready,
    useMail().ready,
    useMusicEnabled().ready,
    useMusicVolume().ready,
    useSoundEnabled().ready,
    useSfxVolume().ready,
  ])
  createApp(App).use(router).mount('#app')
}

void start()
