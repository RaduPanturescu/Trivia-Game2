<script setup lang="ts">
/** Profile screen: profile picture upload and removal, trivia points, and the achievements list. */
import { ref } from 'vue'
import { useAchievements } from '@/shared/achievements'
import { AppButton, AppScreen, BackButton, ScreenTitle } from '@/shared/components'
import { DEFAULT_AVATAR, useProfileImage } from '@/shared/profileImage'
import { useProgress } from '@/shared/progress'
import AchievementCard from './profile/AchievementCard.vue'

const { image, setFromFile, remove } = useProfileImage()
const { points } = useProgress()
const { list } = useAchievements()

const fileInput = ref<HTMLInputElement | null>(null)

/** Opens the hidden file picker. */
function openPicker(): void {
  fileInput.value?.click()
}

/** Stores the chosen picture, then clears the input so the same file can be picked again. */
async function onFileChange(event: Event): Promise<void> {
  if (!(event.target instanceof HTMLInputElement)) return
  const file = event.target.files?.[0]
  event.target.value = ''
  if (file) await setFromFile(file)
}
</script>

<template>
  <AppScreen class="profile-screen">
    <BackButton to="/" />
    <ScreenTitle class="profile-title">
      Profile
    </ScreenTitle>

    <div class="profile-header">
      <div class="profile-row">
        <img
          class="profile-screen-avatar"
          :src="image || DEFAULT_AVATAR"
          alt="Profile"
        >
        <h3 class="profile-points">
          ⭐ {{ points }} Points
        </h3>
      </div>
      <div class="photo-actions">
        <AppButton
          class="upload-btn"
          @click="openPicker"
        >
          Upload Photo
        </AppButton>
        <button
          v-if="image"
          type="button"
          class="remove-btn"
          @click="remove"
        >
          Remove Photo
        </button>
      </div>
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      hidden
      @change="onFileChange"
    >

    <h3 class="achievements-heading">
      Achievements
    </h3>
    <div class="achievements-list">
      <AchievementCard
        v-for="achievement in list"
        :key="achievement.id"
        :achievement="achievement"
      />
    </div>
  </AppScreen>
</template>

<style scoped>
.profile-screen .profile-title {
  margin-top: 40px;
}

.profile-header {
  text-align: center;
  margin-top: 20px;
}

.profile-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.profile-screen-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
}

.profile-points {
  font-size: 2rem;
  color: var(--secondary);
}

.photo-actions {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.photo-actions .upload-btn {
  width: auto;
  margin-top: 0;
  padding: 8px 12px;
  font-size: 0.95rem;
}

.remove-btn {
  padding: 8px 12px;
  font-size: 0.95rem;
  color: var(--text-main);
}

.achievements-heading {
  margin-top: 30px;
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: 10px;
}

.achievements-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
  overflow-y: auto;
  max-height: 50vh;
}
</style>
