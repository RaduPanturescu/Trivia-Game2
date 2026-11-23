<script setup lang="ts">
/** Welcome screen: entry point with Maya, the stats footer, the mailbox and the main launchers. */
import { computed, ref, type CSSProperties } from 'vue'
import { useRouter } from 'vue-router'
import { AppButton, AppScreen } from '@/shared/components'
import { SFX, useAudio } from '@/shared/composables/useAudio'
import { useToast } from '@/shared/composables/useToast'
import { useDevMode } from '@/shared/devMode'
import { useProfileImage } from '@/shared/profileImage'
import { useProgress } from '@/shared/progress'
import { useWelcomeStats } from '@/shared/welcomeStats'
import DevStatEditor from './DevStatEditor.vue'
import MailboxModal from './mail/MailboxModal.vue'
import { useMail } from './mail/useMail'

const router = useRouter()
const audio = useAudio()
const toast = useToast()
const { isDev } = useDevMode()
const { image: profileImage } = useProfileImage()
const { badgeCount: mailCount } = useMail()
const { points } = useProgress()
const { daysLeft, mayaClicks, clickMaya: countMayaClick } = useWelcomeStats()

// shortcut: real QotD countdown arrives with the qotd module (phase 3).
const qotdTimer = 'Available Now!'

const mailOpen = ref(false)
/** Welcome stat open in the developer editor, or `null` when the editor is closed. */
const editingStat = ref<'targetDate' | 'mayaClicks' | null>(null)

/** Inline style of the two developer-editable stats, as in the legacy dev-mode styling. */
const devStatStyle = computed<CSSProperties>(() => ({
  cursor: isDev.value ? 'pointer' : 'default',
  pointerEvents: 'auto',
  position: 'relative',
  border: isDev.value ? '1px dashed var(--secondary)' : '1px solid rgba(255, 255, 255, 0.06)',
}))

/**
 * Returns a tooltip for an editable stat, shown only in developer mode.
 * @param text - Tooltip text used in developer mode.
 * @returns The tooltip, or `''` outside developer mode.
 */
function devTitle(text: string): string {
  return isDev.value ? text : ''
}

/**
 * Plays the pop sound and navigates to a route.
 * @param to - Route path to open.
 */
function go(to: string): void {
  audio.playSfx(SFX.pop)
  void router.push(to)
}

/**
 * Opens the developer editor for a stat. Does nothing outside developer mode.
 * @param stat - Which stat to edit.
 */
function openDevEditor(stat: 'targetDate' | 'mayaClicks'): void {
  if (isDev.value) editingStat.value = stat
}

/** Counts a Maya click and shows the playful toast (silent, as in legacy). */
function clickMaya(): void {
  const count = countMayaClick()
  toast.show({ variant: 'maya', title: 'Maya!', message: `You've clicked ${count} times` })
}
</script>

<template>
  <AppScreen class="welcome">
    <div
      class="otter-layer"
      aria-hidden="true"
    >
      <div class="otter o1">
        🦦📚
      </div>
      <div class="otter o2">
        📖
      </div>
      <div class="otter o3">
        🦦👓
      </div>
      <div class="otter o4">
        ✏️
      </div>
      <div class="otter o5">
        🦦💻
      </div>
      <div class="otter o6">
        📝
      </div>
      <div class="otter o7">
        🦦🧮
      </div>
    </div>
    <button
      type="button"
      class="welcome-profile-action"
      aria-label="Profile"
      title="Profile"
      @click="go('/profile')"
    >
      <img
        v-if="profileImage"
        class="profile-avatar"
        :src="profileImage"
        alt="Profile"
      >
      <template v-else>
        👤
      </template>
    </button>
    <div class="welcome-top-actions">
      <button
        type="button"
        class="mail-btn"
        aria-label="Mailbox"
        title="Mailbox"
        @click="mailOpen = true"
      >
        <span class="mail-icon">✉️</span>
        <span
          v-if="mailCount > 0"
          class="mail-count-badge"
        >{{ mailCount }}</span>
      </button>
      <button
        type="button"
        aria-label="Settings"
        title="Settings"
        @click="go('/settings')"
      >
        ⚙️
      </button>
    </div>
    <h1 class="title welcome-title">
      BIANKA <span>TRIVIA NIGHT</span>
    </h1>
    <div class="welcome-actions">
      <AppButton
        class="welcome-nav"
        @click="go('/hub')"
      >
        🎯 Start Game
      </AppButton>
      <AppButton
        class="welcome-nav qotd-welcome-btn"
        @click="go('/qotd')"
      >
        <span>❓ Question of the Day</span><span class="qotd-timer">{{ qotdTimer }}</span>
      </AppButton>
      <AppButton
        class="welcome-nav workout-btn"
        @click="go('/workout')"
      >
        💪 Workout Program
      </AppButton>
    </div>
    <div class="welcome-footer">
      <img
        class="maya-otter"
        src="/assets/otter.png"
        alt="Maya the otter — click for a surprise"
        title="Click Maya!"
        @click="clickMaya"
      >
      <div class="welcome-footer-stats">
        <div
          class="welcome-stat days-left-stat"
          :title="devTitle('Click to edit target date (Dev)')"
          :style="devStatStyle"
          @click="openDevEditor('targetDate')"
        >
          <span class="welcome-stat-icon">📅</span>
          <span><strong>{{ daysLeft }}</strong><small>days left</small></span>
        </div>
        <div
          class="welcome-stat score-stat"
          aria-label="Points earned"
        >
          <span class="welcome-stat-icon">⭐</span>
          <strong>{{ points }}</strong>
        </div>
        <div
          class="welcome-stat maya-click-stat"
          :title="devTitle('Click to edit click count (Dev)')"
          :style="devStatStyle"
          @click="openDevEditor('mayaClicks')"
        >
          <span class="welcome-stat-icon">🐾</span>
          <strong>{{ mayaClicks }}</strong>
          <small>clicks</small>
        </div>
      </div>
    </div>
    <MailboxModal
      :open="mailOpen"
      @close="mailOpen = false"
    />
    <DevStatEditor
      :stat="editingStat"
      @close="editingStat = null"
    />
  </AppScreen>
</template>

<style scoped>
/* Ported from legacy/style.css (#welcome-screen, .welcome-*, .mail-*, .otter, .maya-*, .days-left-stat, .score-stat). */
.welcome {
  isolation: isolate;
  align-items: center;
  justify-content: flex-start;
  gap: 0;
  padding: 20px 22px 16px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
}

.welcome::-webkit-scrollbar {
  display: none;
}

.welcome > :not(.otter-layer):not(.welcome-top-actions):not(.welcome-profile-action) {
  position: relative;
  z-index: 2;
}

.welcome > .welcome-top-actions {
  position: absolute;
  top: 16px;
  right: 18px;
  z-index: 10;
  display: flex;
  gap: 10px;
}

.welcome .welcome-top-actions .mail-btn {
  position: relative;
  overflow: visible;
}

.mail-icon {
  font-size: 1.15rem;
}

.mail-count-badge {
  position: absolute;
  top: -6px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff7675, #ff4d6d);
  color: white;
  font-size: 0.68rem;
  font-weight: 800;
  display: grid;
  place-items: center;
  box-shadow: 0 0 12px rgba(255, 77, 109, 0.7);
}

.welcome-profile-action {
  position: absolute !important;
  top: 16px;
  left: 18px;
  z-index: 10 !important;
}

.profile-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  border: 2px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}

.welcome .welcome-top-actions button,
.welcome .welcome-profile-action {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 50%;
  background: rgba(17, 16, 34, 0.82);
  box-shadow: 0 5px 16px rgba(0, 0, 0, 0.25);
  font-size: 1.15rem;
}

.welcome .welcome-top-actions button:hover,
.welcome .welcome-profile-action:hover {
  background: rgba(108, 92, 231, 0.55);
  transform: translateY(-2px);
}

.welcome .welcome-title {
  width: 100%;
  margin: 62px 0 18px;
  font-size: clamp(2.25rem, 9vw, 3.1rem);
  line-height: 1.05;
}

.title {
  font-size: 3rem;
  font-weight: 800;
  text-align: center;
  margin-top: 40px;
  background: linear-gradient(to right, var(--secondary), var(--primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 10px rgba(108, 92, 231, 0.4));
  line-height: 1.1;
}

.welcome-actions {
  width: min(100%, 350px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex: 0 1 auto;
  margin-right: auto;
  margin-left: auto;
}

.welcome .welcome-actions .welcome-nav {
  width: 100%;
  min-height: 90px;
  padding: 28px 18px;
  border-radius: 13px;
  font-size: 1.18rem;
  line-height: 1.2;
  box-shadow: 0 7px 20px rgba(0, 0, 0, 0.2);
  transform: translateZ(0);
  text-align: center;
}

.welcome .welcome-actions .welcome-nav:hover {
  transform: translateY(-2px);
}

.welcome .welcome-actions .qotd-welcome-btn {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  background: linear-gradient(110deg, #098f9b, #2563b8);
}

.qotd-timer {
  color: #b9fff0;
  font-size: 0.72rem;
  font-weight: 700;
}

.welcome .welcome-actions .workout-btn {
  background: linear-gradient(110deg, #087c68, #2d9f78);
}

.welcome-footer {
  width: min(100%, 390px);
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding-top: 12px;
}

.maya-otter {
  display: block;
  width: 76px;
  height: 76px;
  flex: 0 0 76px;
  object-fit: contain;
  cursor: pointer;
  filter: drop-shadow(0 5px 10px rgba(108, 92, 231, 0.35));
  animation: bob 3s ease-in-out infinite;
  transition: filter 0.2s ease, scale 0.2s ease;
}

.maya-otter:hover {
  scale: 1.08;
  filter: drop-shadow(0 0 16px rgba(0, 206, 201, 0.75));
}

.welcome-footer-stats {
  flex: 1;
  display: grid;
  grid-template-columns: 1.25fr 0.75fr 1fr;
  gap: 7px;
  min-width: 0;
}

.welcome-stat {
  min-width: 0;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 8px;
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.07);
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}

.welcome-stat-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.welcome-stat strong {
  color: #fff;
  font-size: 0.95rem;
}

.welcome-stat small {
  color: var(--text-muted);
  font-size: 0.65rem;
  white-space: nowrap;
}

.days-left-stat {
  border-color: rgba(0, 206, 201, 0.35);
}

.days-left-stat > span:nth-child(2) {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.score-stat {
  border-color: rgba(255, 215, 0, 0.35);
}

.maya-click-stat {
  border-color: rgba(253, 121, 168, 0.35);
}

.otter-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: -1;
  pointer-events: none;
}

.otter {
  position: absolute;
  font-size: 2.5rem;
  opacity: 0.22;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.2));
  pointer-events: none;
  z-index: 0;
}

.o1 { top: 10%; left: -60px; animation: floatRight 25s linear infinite; }
.o2 { top: 30%; right: -60px; animation: floatLeft 30s linear infinite; }
.o3 { top: 60%; left: -60px; animation: floatRight 35s linear infinite; animation-delay: -5s; }
.o4 { top: 80%; right: -60px; animation: floatLeft 28s linear infinite; animation-delay: -12s; }
.o5 { top: 15%; right: -60px; animation: floatLeft 40s linear infinite; animation-delay: -10s; }
.o6 { top: 70%; left: -60px; animation: floatRight 32s linear infinite; animation-delay: -8s; }
.o7 { top: 45%; left: -60px; animation: floatRight 22s linear infinite; animation-delay: -15s; }

@keyframes floatRight {
  0% { transform: translateX(0) rotate(0deg); }
  33% { transform: translateX(200px) translateY(-30px) rotate(15deg); }
  66% { transform: translateX(400px) translateY(30px) rotate(-10deg); }
  100% { transform: translateX(600px) rotate(0deg); }
}

@keyframes floatLeft {
  0% { transform: translateX(0) rotate(0deg); }
  33% { transform: translateX(-200px) translateY(40px) rotate(-15deg); }
  66% { transform: translateX(-400px) translateY(-40px) rotate(10deg); }
  100% { transform: translateX(-600px) rotate(0deg); }
}

@keyframes bob {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@media (max-width: 600px), (max-height: 500px) {
  .welcome {
    padding-top: max(20px, env(safe-area-inset-top));
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }

  .welcome > .welcome-top-actions {
    top: max(16px, env(safe-area-inset-top));
    right: max(18px, env(safe-area-inset-right));
  }
}
</style>
