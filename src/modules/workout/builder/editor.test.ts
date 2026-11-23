import { describe, expect, it } from 'vitest'
import type { WorkoutLibraryExercise } from '../core/types'
import {
  createEmptyDraft,
  DEFAULT_EXERCISE_DESCRIPTION,
  draftFromExercise,
  draftToExerciseDetails,
  EDITOR_BOUNDS,
  EDITOR_COPY,
  isDraftValid,
  isValidNumberInput,
  setDraftOption,
  snapToStep,
  stepDraftNumber,
} from './editor'
import type { ExerciseDraft } from './types'

/** A form that passes validation: a weighted exercise with every field filled. */
function validDraft(overrides: Partial<ExerciseDraft> = {}): ExerciseDraft {
  return {
    ...createEmptyDraft(),
    name: '  Goblet squat ',
    category: 'legs',
    sets: '3',
    reps: '12',
    weight: '16',
    duration: '45',
    rest: '60',
    ...overrides,
  }
}

describe('snapToStep (timer sliders and inputs)', () => {
  it('rounds to the nearest step inside the bounds', () => {
    expect(snapToStep('50', EDITOR_BOUNDS.duration)).toBe('45')
    expect(snapToStep('53', EDITOR_BOUNDS.duration)).toBe('60')
  })

  it('clamps to the minimum and maximum', () => {
    expect(snapToStep('7', EDITOR_BOUNDS.rest)).toBe('15')
    expect(snapToStep('400', EDITOR_BOUNDS.duration)).toBe('300')
    expect(snapToStep('400', EDITOR_BOUNDS.rest)).toBe('180')
  })

  it('treats an empty or non-numeric input as the minimum, as legacy did', () => {
    expect(snapToStep('', EDITOR_BOUNDS.duration)).toBe('15')
    expect(snapToStep('abc', EDITOR_BOUNDS.rest)).toBe('15')
  })
})

describe('isValidNumberInput', () => {
  it('accepts whole numbers in range on the step', () => {
    expect(isValidNumberInput('12', EDITOR_BOUNDS.reps)).toBe(true)
    expect(isValidNumberInput('30', EDITOR_BOUNDS.duration)).toBe(true)
    expect(isValidNumberInput('0', EDITOR_BOUNDS.weight)).toBe(true)
  })

  it('rejects blank, out of range, fractional and off-step values', () => {
    expect(isValidNumberInput(' ', EDITOR_BOUNDS.sets)).toBe(false)
    expect(isValidNumberInput('13', EDITOR_BOUNDS.sets)).toBe(false)
    expect(isValidNumberInput('2.5', EDITOR_BOUNDS.sets)).toBe(false)
    expect(isValidNumberInput('20', EDITOR_BOUNDS.duration)).toBe(false)
    expect(isValidNumberInput('315', EDITOR_BOUNDS.duration)).toBe(false)
  })
})

describe('isDraftValid (save validation)', () => {
  it('accepts a complete form', () => {
    expect(isDraftValid(validDraft())).toBe(true)
  })

  it('needs a name and a category', () => {
    expect(isDraftValid(validDraft({ name: '   ' }))).toBe(false)
    expect(isDraftValid(validDraft({ category: '' }))).toBe(false)
  })

  it('needs sets, timers and rest to be valid', () => {
    expect(isDraftValid(validDraft({ sets: '0' }))).toBe(false)
    expect(isDraftValid(validDraft({ duration: '' }))).toBe(false)
    expect(isDraftValid(validDraft({ rest: '20' }))).toBe(false)
  })

  it('needs reps unless the exercise is done till failure', () => {
    expect(isDraftValid(validDraft({ reps: '' }))).toBe(false)
    expect(isDraftValid(validDraft({ reps: '', repsTillFailure: true }))).toBe(true)
  })

  it('does not check weight, as legacy did', () => {
    expect(isDraftValid(validDraft({ weight: '' }))).toBe(true)
  })
})

describe('setDraftOption (till failure and body weight)', () => {
  it('empties the input when switched on and restores the typed value when switched off', () => {
    const draft = validDraft({ reps: '10' })
    setDraftOption(draft, 'reps', true)
    expect(draft).toMatchObject({ repsTillFailure: true, reps: '', previousReps: '10' })
    setDraftOption(draft, 'reps', false)
    expect(draft).toMatchObject({ repsTillFailure: false, reps: '10', previousReps: undefined })
  })

  it('falls back to 10 reps when the remembered reps are below the minimum', () => {
    const draft = validDraft({ reps: '0' })
    setDraftOption(draft, 'reps', true)
    setDraftOption(draft, 'reps', false)
    expect(draft.reps).toBe('10')
  })

  it('restores an empty weight as empty, as legacy did (0 is not below the minimum of 0)', () => {
    const draft = validDraft({ weight: '' })
    setDraftOption(draft, 'weight', true)
    setDraftOption(draft, 'weight', false)
    expect(draft.weight).toBe('')
  })

  it('keeps the value typed before the option when switched on twice', () => {
    const draft = validDraft({ weight: '25' })
    setDraftOption(draft, 'weight', true)
    setDraftOption(draft, 'weight', true)
    setDraftOption(draft, 'weight', false)
    expect(draft.weight).toBe('25')
  })
})

describe('stepDraftNumber', () => {
  it('moves by one within the bounds', () => {
    const draft = validDraft({ sets: '1', reps: '30' })
    stepDraftNumber(draft, 'sets', -1)
    stepDraftNumber(draft, 'reps', 1)
    expect(draft.sets).toBe('1')
    expect(draft.reps).toBe('30')
    stepDraftNumber(draft, 'sets', 1)
    expect(draft.sets).toBe('2')
  })

  it('starts from the minimum when the input is empty', () => {
    const draft = validDraft({ weight: '' })
    stepDraftNumber(draft, 'weight', 1)
    expect(draft.weight).toBe('1')
  })

  it('leaves a locked input alone', () => {
    const draft = validDraft({ reps: '', repsTillFailure: true })
    stepDraftNumber(draft, 'reps', 1)
    expect(draft.reps).toBe('')
  })
})

describe('draftToExerciseDetails', () => {
  it('stores trimmed values and numbers', () => {
    expect(draftToExerciseDetails(validDraft({ description: '  Keep the chest up ' }))).toEqual({
      name: 'Goblet squat',
      category: 'legs',
      sets: 3,
      reps: 12,
      repsTillFailure: false,
      weight: 16,
      bodyWeight: false,
      duration: 45,
      rest: 60,
      description: 'Keep the chest up',
    })
  })

  it('stores reps 0 for till failure and weight 0 for body weight', () => {
    const details = draftToExerciseDetails(validDraft({ reps: '', repsTillFailure: true, weight: '', bodyWeight: true }))
    expect(details).toMatchObject({ reps: 0, repsTillFailure: true, weight: 0, bodyWeight: true })
  })

  it('uses the default description when the field is blank', () => {
    expect(draftToExerciseDetails(validDraft({ description: '  ' })).description).toBe(DEFAULT_EXERCISE_DESCRIPTION)
  })
})

describe('draftFromExercise (editing)', () => {
  const plank: WorkoutLibraryExercise = {
    id: 'plank',
    name: 'Plank Hold',
    category: 'core',
    sets: 3,
    reps: 0,
    weight: 0,
    duration: 47,
    rest: 62,
    repsTillFailure: true,
    description: 'Keep the torso braced.',
  }

  it('fills the form and snaps the timers', () => {
    const draft = draftFromExercise(plank)
    expect(draft).toMatchObject({
      name: 'Plank Hold',
      category: 'core',
      description: 'Keep the torso braced.',
      sets: '3',
      duration: '45',
      rest: '60',
    })
  })

  it('switches till failure on for an exercise that has it, and remembers the typed reps', () => {
    const draft = draftFromExercise(plank)
    expect(draft).toMatchObject({ repsTillFailure: true, reps: '', previousReps: '0' })
  })

  it('switches body weight on for a zero-load exercise', () => {
    const draft = draftFromExercise({ ...plank, repsTillFailure: false, reps: 20, weight: 0, bodyWeight: true })
    expect(draft).toMatchObject({ bodyWeight: true, weight: '', previousWeight: '0', reps: '20' })
  })
})

describe('EDITOR_COPY', () => {
  it('keeps the legacy headings and button labels for each mode', () => {
    expect(EDITOR_COPY.new).toEqual({
      title: 'Create New Exercise',
      description: 'Create an exercise for your reusable exercise list.',
      saveLabel: 'Add Exercise To List',
    })
    expect(EDITOR_COPY.day.title).toBe('Edit Today’s Exercise')
    expect(EDITOR_COPY.library.saveLabel).toBe('Save Exercise Changes')
  })
})
