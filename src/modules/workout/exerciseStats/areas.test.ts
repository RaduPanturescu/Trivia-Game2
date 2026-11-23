import { describe, expect, it } from 'vitest'
import { exerciseAreas, exerciseKey, guessExerciseAreas } from './areas'

describe('guessExerciseAreas', () => {
  it('assigns back and biceps to pull-ups and rows', () => {
    expect(guessExerciseAreas({ name: 'Pull-ups', category: 'back' })).toEqual(['Back', 'Biceps'])
    expect(guessExerciseAreas({ name: 'Seated Row', category: 'back' })).toEqual(['Back', 'Biceps'])
  })

  it('assigns chest, shoulders and triceps to pressing movements', () => {
    expect(guessExerciseAreas({ name: 'Bench Press', category: 'chest' })).toEqual(['Chest', 'Shoulders', 'Triceps'])
    expect(guessExerciseAreas({ name: 'Overhead Press', category: 'shoulders' })).toEqual(['Shoulders', 'Triceps'])
  })

  it('splits romanian deadlifts from conventional deadlifts', () => {
    expect(guessExerciseAreas({ name: 'Romanian Deadlift', category: 'legs' })).toEqual(['Hamstrings', 'Glutes'])
    expect(guessExerciseAreas({ name: 'Deadlift', category: 'legs' })).toEqual(['Back', 'Hamstrings', 'Glutes'])
  })

  it('assigns quadriceps and glutes to squats and lunges, and calves to calf raises', () => {
    expect(guessExerciseAreas({ name: 'Bulgarian Lunge', category: 'legs' })).toEqual(['Quadriceps', 'Glutes'])
    expect(guessExerciseAreas({ name: 'Standing Calf Raise', category: 'legs' })).toEqual(['Calves'])
  })

  it('assigns cardio and conditioning to running and burpees', () => {
    expect(guessExerciseAreas({ name: 'Jump Rope', category: 'cardio' })).toEqual(['Cardio', 'Conditioning'])
    expect(guessExerciseAreas({ name: 'Burpees', category: 'conditioning' })).toEqual(['Conditioning', 'Core'])
  })

  it('falls back to the category when no name rule matches', () => {
    expect(guessExerciseAreas({ name: 'Mystery Move', category: 'Core' })).toEqual(['Core'])
    expect(guessExerciseAreas({ name: 'Mystery Move', category: 'legs' })).toEqual(['Quadriceps'])
  })

  it('returns no areas when neither the name nor the category matches', () => {
    expect(guessExerciseAreas({ name: 'Zumba', category: 'dance' })).toEqual([])
  })
})

describe('exerciseAreas', () => {
  it('uses the saved assignment and drops unknown area names', () => {
    expect(exerciseAreas({ name: '  Bench Press ', category: 'chest' }, { 'bench press': ['Chest', 'Nope'] })).toEqual(['Chest'])
  })

  it('keeps an empty saved assignment empty instead of guessing again', () => {
    expect(exerciseAreas({ name: 'Bench Press', category: 'chest' }, { 'bench press': [] })).toEqual([])
  })

  it('guesses when nothing is saved for the exercise', () => {
    expect(exerciseAreas({ name: 'Plank', category: 'core' }, {})).toEqual(['Core'])
  })
})

describe('exerciseKey', () => {
  it('trims and lower-cases names', () => {
    expect(exerciseKey('  Bench PRESS ')).toBe('bench press')
    expect(exerciseKey(undefined)).toBe('')
  })
})
