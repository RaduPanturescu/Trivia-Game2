<script setup lang="ts">
/** Minesweeper size screen: the mines/otters switch, the difficulty carousel and the custom board form. */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { AppScreen, BackButton, ScreenTitle } from '@/shared/components'
import { CustomDifficultyCard, DifficultyCard, DifficultyCarousel } from '@/shared/games'
import { SFX, useAudio } from '@/shared/composables/useAudio'
import { useMinesweeperLeaderboard } from './leaderboard'
import {
  buildPlayQuery,
  customMinesMax,
  customSize,
  customValidation,
  hazardWord,
  modeTitle,
  PRESET_DIFFICULTIES,
  presetCard,
  presetSize,
  sizeScreenChoices,
  type PresetCardProps,
} from './sizes'
import type { MinesweeperConfig, PresetDifficulty } from './types'

/** One carousel slide: a preset with its card copy, or the custom form. */
type CarouselItem = { key: PresetDifficulty; card: PresetCardProps } | { key: 'custom' }

const router = useRouter()
const audio = useAudio()
const leaderboard = useMinesweeperLeaderboard()
const choices = sizeScreenChoices

const rows = computed(() => Number(choices.rows))
const cols = computed(() => Number(choices.cols))
const mines = computed(() => Number(choices.mines))
const customSettings = computed(() => customSize(rows.value, cols.value, mines.value))
const validation = computed(() => customValidation(rows.value, cols.value, mines.value, choices.otterMode))
const minesMax = computed(() => customMinesMax(rows.value, cols.value))
const title = computed(() => modeTitle(choices.otterMode))
const hazard = computed(() => hazardWord(choices.otterMode))

const items = computed<CarouselItem[]>(() => [
  ...PRESET_DIFFICULTIES.map((key) => ({ key, card: presetCard(key, choices.otterMode, leaderboard.bestFor(key)) })),
  { key: 'custom' },
])

/**
 * Plays the click sound and opens the game screen with the round's settings in the query.
 * @param config - The round to start.
 */
function play(config: MinesweeperConfig): void {
  audio.playSfx(SFX.pop)
  void router.push({ name: 'minesweeper-play', query: buildPlayQuery(config) })
}

/**
 * Starts a preset round.
 * @param difficulty - The preset the player picked.
 */
function playPreset(difficulty: PresetDifficulty): void {
  play({ difficulty, size: presetSize(difficulty), otterMode: choices.otterMode })
}

/** Starts a custom round when the typed settings are valid. */
function startCustom(): void {
  const size = customSettings.value
  if (size) play({ difficulty: 'custom', size, otterMode: choices.otterMode })
}
</script>

<template>
  <AppScreen class="minesweeper-size">
    <BackButton :to="{ name: 'hub' }" />
    <ScreenTitle class="minesweeper-size-title">
      {{ title }}
    </ScreenTitle>
    <p class="minesweeper-subtitle">
      Select Difficulty
    </p>
    <div class="minesweeper-hazard-row">
      <label class="switch">
        <input
          v-model="choices.otterMode"
          type="checkbox"
          aria-label="Otter mode"
        >
        <span class="slider" />
      </label>
      <span class="minesweeper-hazard-label">{{ hazard }}</span>
    </div>
    <DifficultyCarousel
      :items="items"
      label="Minesweeper difficulty selection"
    >
      <template #card="{ item }">
        <DifficultyCard
          v-if="item.key !== 'custom'"
          v-bind="item.card"
          @play="playPreset(item.key)"
        />
        <CustomDifficultyCard
          v-else
          :validation="validation"
          :can-start="customSettings !== null"
          @start="startCustom"
        >
          <label>Rows <input
            v-model="choices.rows"
            type="number"
            min="5"
            max="30"
            step="1"
          ></label>
          <label>Columns <input
            v-model="choices.cols"
            type="number"
            min="5"
            max="30"
            step="1"
          ></label>
          <label><span>{{ hazard }}</span> <input
            v-model="choices.mines"
            type="number"
            min="1"
            :max="minesMax"
            step="1"
          ></label>
        </CustomDifficultyCard>
      </template>
    </DifficultyCarousel>
  </AppScreen>
</template>

<style scoped>
.minesweeper-size {
  align-items: center;
  text-align: center;
}

.minesweeper-size .minesweeper-size-title {
  margin-top: 36px;
  font-size: clamp(2.6rem, 9vw, 4.2rem);
  line-height: 1.05;
  letter-spacing: 0.02em;
  text-shadow: 0 0 22px rgba(108, 92, 231, 0.28);
}

.minesweeper-subtitle {
  text-align: center;
  color: var(--text-muted);
  font-size: 1.1rem;
  margin: 15px 0 30px 0;
}

.minesweeper-hazard-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.minesweeper-hazard-label {
  font-size: 0.95rem;
  color: var(--text);
}

/* Legacy switch: the knob shows a bomb, or an otter when checked. */
.switch {
  position: relative;
  display: inline-block;
  width: 70px;
  height: 36px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--glass-border);
  transition: background-color 0.4s;
  border-radius: 34px;
}

.slider::before {
  position: absolute;
  content: "";
  height: 28px;
  width: 28px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: transform 0.4s;
  border-radius: 50%;
}

.slider::after {
  position: absolute;
  content: '💣';
  top: 50%;
  left: 18px;
  transform: translate(-50%, -50%);
  font-size: 0.95rem;
  transition: left 0.4s, content 0.2s;
}

input:checked + .slider {
  background-color: var(--primary);
}

input:checked + .slider::before {
  transform: translateX(34px);
}

input:checked + .slider::after {
  content: '🦦';
  left: 52px;
}
</style>
