import type { Achievement } from '@/shared/achievements'
import type { WorkoutStatsSnapshot } from '../core/types'

/** A stat an achievement trigger can read: the keys of the workout stats snapshot. */
export type TriggerStat = keyof WorkoutStatsSnapshot

/** Dropdown label per trigger stat, in legacy order. Typed so every snapshot key has a label. */
const TRIGGER_STAT_LABELS: Record<TriggerStat, string> = {
  workouts: 'Completed workouts',
  sets: 'Completed sets',
  reps: 'Completed reps',
  kg: 'KG moved',
  streak: 'Workout streak (days)',
  exercises: 'Completed exercises',
  points: 'Trivia points',
}

/** One option of the trigger dropdown. */
export interface TriggerStatOption {
  /** The stat key stored in the achievement's trigger. */
  value: TriggerStat
  /** Label shown in the dropdown. */
  label: string
}

/** Largest photo the editor accepts, in bytes (1 MB). */
export const MAX_PHOTO_BYTES = 1024 * 1024

/** Icon used when an achievement has neither a photo, an emoji nor a built-in image. */
export const DEFAULT_ACHIEVEMENT_ICON = '🏆'

/** Title shown on a locked card to visitors who are not in developer mode. */
export const LOCKED_TITLE = 'Locked'

/** Text shown on a locked card to visitors who are not in developer mode. */
export const LOCKED_DESCRIPTION = 'Complete the milestone to unlock this achievement.'

/** What a card or preview shows: a picture, or text (an emoji). */
export type AchievementIcon = { kind: 'image'; src: string } | { kind: 'text'; text: string }

/**
 * The editor's form state. `imageData` is the photo draft (a data URL, or `''`). `photoPicked` is `true` once a
 * file was chosen in this edit, which makes the photo win over an emoji, as legacy did.
 */
export interface AchievementDraft {
  /** Title. Trimmed on save. */
  name: string
  /** Description. Trimmed on save. */
  description: string
  /** Emoji. Trimmed on save; may be empty when a photo is used. */
  emoji: string
  /** Unlocked flag. */
  unlocked: boolean
  /** Trigger stat, or `''` for no automatic trigger. */
  triggerStat: TriggerStat | ''
  /** Trigger target. Must be greater than zero when a stat is chosen. */
  triggerTarget: number
  /** Photo as a data URL, or `''`. */
  imageData: string
  /** `true` once a photo was picked in this edit. */
  photoPicked: boolean
}

/**
 * Trigger dropdown options, one per stat snapshot key, in snapshot order.
 * @returns The options.
 */
export function triggerStatOptions(): TriggerStatOption[] {
  return (Object.keys(TRIGGER_STAT_LABELS) as TriggerStat[]).map((value) => ({ value, label: TRIGGER_STAT_LABELS[value] }))
}

/**
 * Whether a value is one of the trigger stat keys.
 * @param value - Any string, e.g. a stored trigger stat.
 * @returns `true` for a known stat.
 */
export function isTriggerStat(value: string): value is TriggerStat {
  return Object.hasOwn(TRIGGER_STAT_LABELS, value)
}

/**
 * A blank draft for a new achievement: no trigger, target 1, locked.
 * @returns A new draft.
 */
export function emptyAchievementDraft(): AchievementDraft {
  return { name: '', description: '', emoji: '', unlocked: false, triggerStat: '', triggerTarget: 1, imageData: '', photoPicked: false }
}

/**
 * The draft that fills the editor for an existing achievement, as legacy `openWorkoutAchievementEditor` did.
 * An unknown stored trigger stat reads as no trigger.
 * @param achievement - The achievement being edited.
 * @returns A new draft.
 */
export function achievementDraftFrom(achievement: Achievement): AchievementDraft {
  const stat = achievement.trigger?.stat ?? ''
  return {
    name: achievement.name,
    description: achievement.desc,
    emoji: achievement.emoji || '',
    unlocked: achievement.unlocked,
    triggerStat: isTriggerStat(stat) ? stat : '',
    triggerTarget: achievement.trigger?.target || 1,
    imageData: achievement.imageData || '',
    photoPicked: false,
  }
}

/**
 * Checks a draft the way legacy `saveWorkoutAchievementFromForm` did, in the same order, and returns the first
 * message to show.
 * @param draft - The form state.
 * @param isNew - `true` when creating; a new achievement needs an emoji or a photo.
 * @returns The alert text, or `null` when the draft is valid.
 */
export function validateAchievementDraft(draft: AchievementDraft, isNew: boolean): string | null {
  const name = draft.name.trim()
  const description = draft.description.trim()
  const emoji = draft.emoji.trim()
  if (emoji && /[<>]/.test(emoji)) return 'Enter an emoji, not markup.'
  if (!name || !description || (isNew && !emoji && !draft.imageData)) {
    return 'Enter a name and description, and choose an emoji or photo.'
  }
  if (draft.triggerStat && (!Number.isFinite(draft.triggerTarget) || draft.triggerTarget <= 0)) {
    return 'Enter a target greater than zero for the achievement trigger.'
  }
  return null
}

/**
 * Checks a picked photo: an image no larger than 1 MB.
 * @param file - The picked file (only its type and size are read).
 * @returns The alert text, or `null` when the file is acceptable.
 */
export function photoFileError(file: { type: string; size: number }): string | null {
  return file.type.startsWith('image/') && file.size <= MAX_PHOTO_BYTES ? null : 'Choose an image smaller than 1 MB.'
}

/**
 * Legacy HTML icon for a photo, written next to `imageData` so older builds can still read the stored data.
 * @param imageData - The photo as a data URL.
 * @returns The `<img>` markup.
 */
function photoIconMarkup(imageData: string): string {
  return `<img src="${imageData}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;">`
}

/**
 * Builds the achievement to store from the draft, keeping the fields of the existing one. Photo and emoji follow
 * legacy `saveWorkoutAchievementFromForm`: a picked photo (or a photo with no emoji) wins; otherwise an emoji replaces
 * the photo. The trigger is set only when a stat is chosen.
 * @param draft - A draft that passed {@link validateAchievementDraft}.
 * @param existing - The achievement being edited, or `undefined` for a new one.
 * @param id - The id to store under.
 * @returns The achievement to pass to `saveCustom`.
 */
export function buildAchievement(draft: AchievementDraft, existing: Achievement | undefined, id: string): Achievement {
  const emoji = draft.emoji.trim()
  const next: Achievement = {
    ...existing,
    id,
    name: draft.name.trim(),
    desc: draft.description.trim(),
    unlocked: draft.unlocked,
  }
  if (draft.triggerStat) next.trigger = { stat: draft.triggerStat, target: draft.triggerTarget }
  else delete next.trigger
  if (draft.imageData && (draft.photoPicked || !emoji)) {
    next.imageData = draft.imageData
    next.emoji = ''
    next.icon = photoIconMarkup(draft.imageData)
  } else if (emoji) {
    next.emoji = emoji
    next.imageData = ''
    next.icon = emoji
  }
  return next
}

/**
 * The icon a stored achievement shows: its photo, then its emoji, then its built-in image, then the default.
 * @param achievement - The achievement, or `undefined`.
 * @returns The icon to render.
 */
export function achievementIcon(achievement: Pick<Achievement, 'imageData' | 'emoji' | 'image'> | undefined): AchievementIcon {
  if (achievement?.imageData) return { kind: 'image', src: achievement.imageData }
  if (achievement?.emoji) return { kind: 'text', text: achievement.emoji }
  if (achievement?.image) return { kind: 'image', src: achievement.image }
  return { kind: 'text', text: DEFAULT_ACHIEVEMENT_ICON }
}

/**
 * The icon the editor previews: the photo draft, then the typed emoji, then the achievement's own icon.
 * @param draft - The form state.
 * @param existing - The achievement being edited, if any.
 * @returns The icon to preview.
 */
export function previewIcon(draft: AchievementDraft, existing: Achievement | undefined): AchievementIcon {
  if (draft.imageData) return { kind: 'image', src: draft.imageData }
  const emoji = draft.emoji.trim()
  if (emoji) return { kind: 'text', text: emoji }
  return achievementIcon(existing)
}

/**
 * Title and description of a card. Locked achievements hide their text from visitors, but developers see it.
 * @param achievement - The card's achievement.
 * @param developer - `true` in developer mode.
 * @returns The texts to show.
 */
export function achievementCardText(achievement: Achievement, developer: boolean): { title: string; description: string } {
  const revealed = achievement.unlocked || developer
  return {
    title: revealed ? achievement.name : LOCKED_TITLE,
    description: revealed ? achievement.desc : LOCKED_DESCRIPTION,
  }
}
