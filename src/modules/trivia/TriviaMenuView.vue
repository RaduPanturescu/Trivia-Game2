<script setup lang="ts">
/**
 * Category Trivia menu: season picker, the five category cards and a locked Mystery card.
 * Picking a category opens its difficulty screen. Legacy `#menu-screen`.
 */
import { useRouter } from 'vue-router'
import { AppScreen, BackButton, ScreenTitle } from '@/shared/components'
import { SFX, useAudio } from '@/shared/composables/useAudio'
import { CATEGORY_IDS, type CategoryId } from '@/shared/progress'
import { useProfileImage } from '@/shared/profileImage'
import { CATEGORY_META } from './categories'
import { useTriviaSeason } from './season'

const router = useRouter()
const audio = useAudio()
const season = useTriviaSeason().state
const { image: profileImage } = useProfileImage()

/**
 * Plays the pop sound and opens the difficulty screen of a category.
 * @param category - The category that was picked.
 */
function open(category: CategoryId): void {
  audio.playSfx(SFX.pop)
  void router.push({ name: 'trivia-difficulty', params: { category } })
}

/** Plays the pop sound and opens the profile screen. */
function openProfile(): void {
  audio.playSfx(SFX.pop)
  void router.push('/profile')
}
</script>

<template>
  <AppScreen class="trivia-menu-screen">
    <BackButton to="/hub" />
    <ScreenTitle>Choose a Category</ScreenTitle>
    <div class="season-picker">
      <label for="trivia-season-select">Trivia Season</label>
      <select
        id="trivia-season-select"
        v-model="season"
        :data-season="season"
        aria-label="Choose trivia season"
      >
        <option value="1">
          Season 1
        </option>
        <option value="2">
          Season 2
        </option>
      </select>
    </div>
    <div class="category-grid">
      <button
        v-for="id in CATEGORY_IDS"
        :key="id"
        type="button"
        class="category-btn"
        :data-category="id"
        @click="open(id)"
      >
        <span class="icon">{{ CATEGORY_META[id].icon }}</span>
        <span class="label">{{ CATEGORY_META[id].label }}</span>
      </button>
      <button
        type="button"
        class="category-btn locked mystery-btn"
        disabled
      >
        <span class="icon">🔒</span>
        <span class="label">Mystery (Need 5 ⭐)</span>
      </button>
    </div>
    <button
      type="button"
      class="profile-btn"
      aria-label="Profile"
      @click="openProfile"
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
  </AppScreen>
</template>

<style scoped>
.season-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 14px 0 2px;
  padding: 10px 14px;
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.045);
}

.season-picker label {
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 600;
}

#trivia-season-select {
  min-width: 132px;
  padding: 9px 34px 9px 12px;
  border: 1px solid;
  border-radius: 11px;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

#trivia-season-select[data-season='1'] {
  border-color: #4dabf7;
  background-color: #123b68;
  box-shadow: 0 0 12px rgba(77, 171, 247, 0.2);
}

#trivia-season-select[data-season='2'] {
  border-color: #f6b93b;
  background-color: #713f12;
  box-shadow: 0 0 12px rgba(246, 185, 59, 0.24);
}

#trivia-season-select option {
  color: #fff;
  background: #171326;
}

.category-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 20px;
  padding-bottom: 20px;
}

.category-btn {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 20px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s, background 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 15px;
  aspect-ratio: 1 / 1;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  z-index: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

.category-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: var(--primary);
  transition: width 0.3s ease;
  z-index: 1;
}

/* Category background images, fading left to right. */
.category-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  -webkit-mask-image: linear-gradient(to right, rgba(0, 0, 0, 0.55) 0%, transparent 85%);
  mask-image: linear-gradient(to right, rgba(0, 0, 0, 0.55) 0%, transparent 85%);
  border-radius: inherit;
  z-index: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.category-btn[data-category='eu']::after { background-image: url('/assets/eu_bg.png'); }
.category-btn[data-category='hungary']::after { background-image: url('/assets/hungary_bg.png'); }
.category-btn[data-category='romania']::after { background-image: url('/assets/romania_bg.png'); }
.category-btn[data-category='trains']::after { background-image: url('/assets/trains_bg.jpg'); }
.category-btn[data-category='personal']::after { background-image: url('/assets/personal_bg.png'); background-position: top center; }

.category-btn span {
  position: relative;
  z-index: 2;
}

.category-btn:hover::before {
  width: 100%;
  opacity: 0.1;
}

.category-btn:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.category-btn .icon {
  font-size: 2rem;
  z-index: 1;
}

.category-btn.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.category-btn.locked:hover {
  transform: none;
  box-shadow: none;
  border-color: var(--glass-border);
}

.mystery-btn {
  grid-column: span 2;
}

.profile-btn {
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--text-main);
  align-self: flex-start;
}

.profile-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  border: 2px solid rgba(255, 255, 255, 0.08);
}
</style>
