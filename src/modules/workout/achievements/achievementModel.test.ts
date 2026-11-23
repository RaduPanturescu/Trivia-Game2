import { describe, expect, it } from 'vitest'
import type { Achievement } from '@/shared/achievements'
import {
  achievementCardText,
  achievementDraftFrom,
  achievementIcon,
  buildAchievement,
  emptyAchievementDraft,
  photoFileError,
  previewIcon,
  triggerStatOptions,
  validateAchievementDraft,
  type AchievementDraft,
} from './achievementModel'
import { clampPage, pageCountFor, pageSlice } from './paging'

/** A valid draft with an emoji and no trigger. */
function draft(overrides: Partial<AchievementDraft> = {}): AchievementDraft {
  return { ...emptyAchievementDraft(), name: 'Iron', description: 'Lift a lot.', emoji: '🏋️', ...overrides }
}

describe('validateAchievementDraft', () => {
  it('accepts a complete new achievement', () => {
    expect(validateAchievementDraft(draft(), true)).toBeNull()
  })

  it('rejects an emoji that contains markup', () => {
    expect(validateAchievementDraft(draft({ emoji: '<b>x</b>' }), true)).toBe('Enter an emoji, not markup.')
    expect(validateAchievementDraft(draft({ emoji: 'a>b' }), false)).toBe('Enter an emoji, not markup.')
  })

  it('checks the markup rule before the required fields', () => {
    expect(validateAchievementDraft(draft({ emoji: '<', name: '' }), true)).toBe('Enter an emoji, not markup.')
  })

  it('requires a name and a description after trimming', () => {
    const message = 'Enter a name and description, and choose an emoji or photo.'
    expect(validateAchievementDraft(draft({ name: '   ' }), true)).toBe(message)
    expect(validateAchievementDraft(draft({ description: ' ' }), false)).toBe(message)
  })

  it('requires an emoji or a photo only for a new achievement', () => {
    const message = 'Enter a name and description, and choose an emoji or photo.'
    expect(validateAchievementDraft(draft({ emoji: '' }), true)).toBe(message)
    expect(validateAchievementDraft(draft({ emoji: '', imageData: 'data:image/png;base64,AA==' }), true)).toBeNull()
    expect(validateAchievementDraft(draft({ emoji: '' }), false)).toBeNull()
  })

  it('rejects a trigger target that is not greater than zero', () => {
    const message = 'Enter a target greater than zero for the achievement trigger.'
    expect(validateAchievementDraft(draft({ triggerStat: 'workouts', triggerTarget: 0 }), true)).toBe(message)
    expect(validateAchievementDraft(draft({ triggerStat: 'kg', triggerTarget: -2 }), true)).toBe(message)
    expect(validateAchievementDraft(draft({ triggerStat: 'kg', triggerTarget: Number.NaN }), true)).toBe(message)
    expect(validateAchievementDraft(draft({ triggerStat: 'kg', triggerTarget: 0.5 }), true)).toBeNull()
  })

  it('ignores the target when no trigger stat is chosen', () => {
    expect(validateAchievementDraft(draft({ triggerStat: '', triggerTarget: 0 }), true)).toBeNull()
  })
})

describe('triggerStatOptions', () => {
  it('lists the stat snapshot keys in legacy order with their labels', () => {
    expect(triggerStatOptions()).toEqual([
      { value: 'workouts', label: 'Completed workouts' },
      { value: 'sets', label: 'Completed sets' },
      { value: 'reps', label: 'Completed reps' },
      { value: 'kg', label: 'KG moved' },
      { value: 'streak', label: 'Workout streak (days)' },
      { value: 'exercises', label: 'Completed exercises' },
      { value: 'points', label: 'Trivia points' },
    ])
  })
})

describe('buildAchievement', () => {
  it('stores an emoji and clears the photo', () => {
    const existing: Achievement = { id: 'customWorkout-1', name: 'Old', desc: 'Old', unlocked: false, customWorkoutAchievement: true, imageData: 'data:old', emoji: '', icon: '<img>' }
    const next = buildAchievement(draft({ name: ' New ', description: ' Desc ', emoji: ' 🔥 ' }), existing, 'customWorkout-1')
    expect(next).toMatchObject({ id: 'customWorkout-1', name: 'New', desc: 'Desc', emoji: '🔥', imageData: '', icon: '🔥', customWorkoutAchievement: true })
    expect(next.trigger).toBeUndefined()
  })

  it('stores a picked photo over a typed emoji', () => {
    const next = buildAchievement(draft({ imageData: 'data:image/png;base64,AA==', photoPicked: true }), undefined, 'customWorkout-2')
    expect(next).toMatchObject({ emoji: '', imageData: 'data:image/png;base64,AA==' })
    expect(next.icon).toContain('<img src="data:image/png;base64,AA=="')
  })

  it('keeps an existing photo when no emoji is typed', () => {
    const next = buildAchievement(draft({ emoji: '', imageData: 'data:existing', photoPicked: false }), undefined, 'customWorkout-3')
    expect(next).toMatchObject({ emoji: '', imageData: 'data:existing' })
  })

  it('switches from a photo to an emoji when an emoji is typed and no new photo was picked', () => {
    const next = buildAchievement(draft({ emoji: '⭐', imageData: 'data:existing', photoPicked: false }), undefined, 'customWorkout-4')
    expect(next).toMatchObject({ emoji: '⭐', imageData: '' })
  })

  it('sets the trigger only when a stat is chosen, and removes an old one otherwise', () => {
    const withTrigger = buildAchievement(draft({ triggerStat: 'sets', triggerTarget: 12 }), undefined, 'customWorkout-5')
    expect(withTrigger.trigger).toEqual({ stat: 'sets', target: 12 })

    const existing: Achievement = { id: 'customWorkout-5', name: 'A', desc: 'B', unlocked: true, emoji: '⭐', trigger: { stat: 'sets', target: 12 } }
    const cleared = buildAchievement(draft({ triggerStat: '' }), existing, 'customWorkout-5')
    expect(cleared).not.toHaveProperty('trigger')
    expect(cleared.unlocked).toBe(false)
  })
})

describe('achievementDraftFrom', () => {
  it('fills the form from a stored achievement', () => {
    const achievement: Achievement = { id: 'x', name: 'N', desc: 'D', unlocked: true, emoji: '🌟', trigger: { stat: 'kg', target: 500 } }
    expect(achievementDraftFrom(achievement)).toEqual({
      name: 'N',
      description: 'D',
      emoji: '🌟',
      unlocked: true,
      triggerStat: 'kg',
      triggerTarget: 500,
      imageData: '',
      photoPicked: false,
    })
  })

  it('reads an unknown stored stat as no trigger and a missing target as 1', () => {
    const achievement: Achievement = { id: 'x', name: 'N', desc: 'D', unlocked: false, trigger: { stat: 'nope', target: 0 } }
    expect(achievementDraftFrom(achievement)).toMatchObject({ triggerStat: '', triggerTarget: 1 })
  })
})

describe('icons and card text', () => {
  it('prefers a photo, then an emoji, then the built-in image, then the default', () => {
    expect(achievementIcon({ imageData: 'data:a', emoji: '⭐', image: '/a.png' })).toEqual({ kind: 'image', src: 'data:a' })
    expect(achievementIcon({ emoji: '⭐', image: '/a.png' })).toEqual({ kind: 'text', text: '⭐' })
    expect(achievementIcon({ image: '/a.png' })).toEqual({ kind: 'image', src: '/a.png' })
    expect(achievementIcon(undefined)).toEqual({ kind: 'text', text: '🏆' })
  })

  it('previews the photo draft, then the typed emoji, then the achievement icon', () => {
    const existing: Achievement = { id: 'x', name: 'N', desc: 'D', unlocked: false, emoji: '👑' }
    expect(previewIcon({ ...draft(), imageData: 'data:p', emoji: '⭐' }, existing)).toEqual({ kind: 'image', src: 'data:p' })
    expect(previewIcon({ ...draft(), emoji: ' ⭐ ' }, existing)).toEqual({ kind: 'text', text: '⭐' })
    expect(previewIcon({ ...draft(), emoji: '' }, existing)).toEqual({ kind: 'text', text: '👑' })
  })

  it('hides locked text from visitors but not from developers', () => {
    const locked: Achievement = { id: 'x', name: 'Secret', desc: 'Hidden', unlocked: false }
    expect(achievementCardText(locked, false)).toEqual({ title: 'Locked', description: 'Complete the milestone to unlock this achievement.' })
    expect(achievementCardText(locked, true)).toEqual({ title: 'Secret', description: 'Hidden' })
    expect(achievementCardText({ ...locked, unlocked: true }, false)).toEqual({ title: 'Secret', description: 'Hidden' })
  })
})

describe('photoFileError', () => {
  it('accepts images up to 1 MB', () => {
    expect(photoFileError({ type: 'image/png', size: 1024 * 1024 })).toBeNull()
  })

  it('rejects other types and larger files', () => {
    const message = 'Choose an image smaller than 1 MB.'
    expect(photoFileError({ type: 'application/pdf', size: 10 })).toBe(message)
    expect(photoFileError({ type: 'image/jpeg', size: 1024 * 1024 + 1 })).toBe(message)
  })
})

describe('paging', () => {
  it('shows six per page and always has at least one page', () => {
    expect(pageCountFor(0)).toBe(1)
    expect(pageCountFor(6)).toBe(1)
    expect(pageCountFor(7)).toBe(2)
    expect(pageSlice([1, 2, 3, 4, 5, 6, 7, 8], 1)).toEqual([7, 8])
  })

  it('clamps a page index into range', () => {
    expect(clampPage(-1, 3)).toBe(0)
    expect(clampPage(5, 3)).toBe(2)
    expect(clampPage(1, 3)).toBe(1)
  })
})
