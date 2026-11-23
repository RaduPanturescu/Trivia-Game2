import { computed, reactive, ref, type ComputedRef, type Ref } from 'vue'
import { useAchievements, WORKOUT_MILESTONE_ACHIEVEMENTS, type Achievement } from '@/shared/achievements'
import { useDevMode } from '@/shared/devMode'
import { useWorkoutStore } from '../core/store'
import {
  achievementCardText,
  achievementDraftFrom,
  achievementIcon,
  buildAchievement,
  emptyAchievementDraft,
  photoFileError,
  previewIcon,
  validateAchievementDraft,
  type AchievementDraft,
  type AchievementIcon,
} from './achievementModel'
import { clampPage, pageCountFor, pageSlice } from './paging'

/** Ids of the six fixed workout milestones. The panel shows these plus the user's custom workout achievements. */
const MILESTONE_IDS = new Set(WORKOUT_MILESTONE_ACHIEVEMENTS.map((achievement) => achievement.id))

/** One card of the panel, with its texts and icon already worked out. */
export interface WorkoutAchievementCard {
  /** Achievement id. */
  id: string
  /** Whether the card shows as unlocked. */
  unlocked: boolean
  /** Title, or the locked title for hidden achievements. */
  title: string
  /** Description, or the locked description for hidden achievements. */
  description: string
  /** Icon to render. */
  icon: AchievementIcon
  /** Accessible name of the icon. */
  iconAlt: string
}

/** Public surface of the workout achievements panel. */
export interface WorkoutAchievementsApi {
  /** `true` in developer mode; shows the admin controls and reveals locked text. */
  isDev: Ref<boolean>
  /** Cards on the shown page. */
  cards: ComputedRef<WorkoutAchievementCard[]>
  /** Number of pages, at least 1. */
  pageCount: ComputedRef<number>
  /** The shown page, zero-based and clamped. */
  currentPage: ComputedRef<number>
  /** Shows the previous page. */
  previousPage(): void
  /** Shows the next page. */
  nextPage(): void
  /** Whether the editor form is open. */
  editorOpen: Ref<boolean>
  /** Id of the achievement being edited, or `null` for a new one. */
  editingId: Ref<string | null>
  /** The editor's form state. */
  draft: AchievementDraft
  /** The icon the editor previews. */
  preview: ComputedRef<AchievementIcon>
  /** Opens the editor: blank for a new achievement, or filled from the given id. */
  openEditor(id?: string): void
  /** Closes the editor and drops the photo draft. */
  closeEditor(): void
  /** Checks and reads a picked photo into the draft. Alerts and returns `false` when it is rejected. */
  pickPhoto(file: File): Promise<boolean>
  /** Validates the draft and saves it, then checks the triggers and shows the last page. Alerts on errors. */
  saveDraft(): void
  /** Asks for confirmation and deletes an achievement. */
  removeAchievement(id: string): void
}

/**
 * Reads a file as a data URL.
 * @param file - The file to read.
 * @returns The data URL.
 */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Unable to read selected file.'))
    reader.readAsDataURL(file)
  })
}

/**
 * State and actions of the workout achievements panel: the paged list and the developer-only editor. Saves and
 * deletes go through the shared achievements store.
 * @returns The panel API.
 */
export function useWorkoutAchievements(): WorkoutAchievementsApi {
  const achievements = useAchievements()
  const store = useWorkoutStore()
  const { isDev } = useDevMode()
  const page = ref(0)
  const editorOpen = ref(false)
  const editingId = ref<string | null>(null)
  const draft = reactive<AchievementDraft>(emptyAchievementDraft())

  const items = computed(() => achievements.list.value.filter((achievement) => achievement.customWorkoutAchievement || MILESTONE_IDS.has(achievement.id)))
  const pageCount = computed(() => pageCountFor(items.value.length))
  const currentPage = computed(() => clampPage(page.value, pageCount.value))
  const cards = computed<WorkoutAchievementCard[]>(() => pageSlice(items.value, currentPage.value).map((achievement) => {
    const text = achievementCardText(achievement, isDev.value)
    return {
      id: achievement.id,
      unlocked: achievement.unlocked,
      title: text.title,
      description: text.description,
      icon: achievementIcon(achievement),
      iconAlt: `${achievement.name} icon`,
    }
  }))

  /**
   * The achievement being edited, read from the live list so it is the stored copy.
   * @returns The achievement, or `undefined` for a new one.
   */
  function editedAchievement(): Achievement | undefined {
    return editingId.value ? items.value.find((achievement) => achievement.id === editingId.value) : undefined
  }

  const preview = computed(() => previewIcon(draft, editedAchievement()))

  /** Closes the editor and drops the photo draft, as legacy did. */
  function closeEditor(): void {
    editorOpen.value = false
    editingId.value = null
    draft.imageData = ''
    draft.photoPicked = false
  }

  /**
   * Opens the editor for a new achievement or an existing one.
   * @param id - The achievement to edit. Omit to create one.
   */
  function openEditor(id?: string): void {
    const achievement = id ? items.value.find((item) => item.id === id) : undefined
    editingId.value = achievement?.id ?? null
    Object.assign(draft, achievement ? achievementDraftFrom(achievement) : emptyAchievementDraft())
    editorOpen.value = true
  }

  async function pickPhoto(file: File): Promise<boolean> {
    const error = photoFileError(file)
    if (error) {
      alert(error)
      return false
    }
    try {
      draft.imageData = await readAsDataUrl(file)
      draft.photoPicked = true
      return true
    } catch {
      alert('Could not read the selected achievement image.')
      return false
    }
  }

  function saveDraft(): void {
    if (!isDev.value) return
    const existing = editedAchievement()
    const error = validateAchievementDraft(draft, existing === undefined)
    if (error) {
      alert(error)
      return
    }
    const id = existing?.id ?? `customWorkout-${Date.now()}`
    achievements.saveCustom(buildAchievement(draft, existing, id))
    store.evaluateAchievements()
    page.value = pageCount.value - 1
    closeEditor()
  }

  function removeAchievement(id: string): void {
    if (!isDev.value) return
    const target = items.value.find((achievement) => achievement.id === id)
    if (!target) return
    if (!confirm(`Delete “${target.name}”? This cannot be undone.`)) return
    if (editingId.value === id) closeEditor()
    achievements.remove(id)
  }

  return {
    isDev,
    cards,
    pageCount,
    currentPage,
    previousPage: () => { page.value = Math.max(0, currentPage.value - 1) },
    nextPage: () => { page.value = Math.min(pageCount.value - 1, currentPage.value + 1) },
    editorOpen,
    editingId,
    draft,
    preview,
    openEditor,
    closeEditor,
    pickPhoto,
    saveDraft,
    removeAchievement,
  }
}
