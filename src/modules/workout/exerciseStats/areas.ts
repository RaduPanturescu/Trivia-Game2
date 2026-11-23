/**
 * Training areas and the name-based guess that assigns exercises to them. The rules are the legacy ones, verbatim.
 */

/** Muscle-group and fitness areas, in legacy order. The first ten form the muscle radar, the rest the fitness radar. */
export const EXERCISE_AREAS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quadriceps',
  'Glutes',
  'Hamstrings',
  'Calves',
  'Core',
  'Cardio',
  'Conditioning',
  'Mobility',
] as const

/** One training area name. */
export type ExerciseArea = (typeof EXERCISE_AREAS)[number]

/** Fallback areas per library category, used when no name rule matches. */
const CATEGORY_AREAS: Readonly<Record<string, readonly ExerciseArea[]>> = {
  chest: ['Chest'],
  back: ['Back'],
  shoulders: ['Shoulders'],
  biceps: ['Biceps'],
  triceps: ['Triceps'],
  legs: ['Quadriceps'],
  glutes: ['Glutes'],
  core: ['Core'],
  cardio: ['Cardio'],
  conditioning: ['Conditioning'],
  mobility: ['Mobility'],
  calves: ['Calves'],
  hamstrings: ['Hamstrings'],
}

/**
 * Whether a value is one of the known training areas.
 * @param value - Any string, for example from stored area assignments.
 * @returns `true` for a known area name.
 */
export function isExerciseArea(value: string): value is ExerciseArea {
  return (EXERCISE_AREAS as readonly string[]).includes(value)
}

/**
 * Normalised lookup key for an exercise name: trimmed and lower case, so names match regardless of case.
 * @param name - An exercise name, possibly empty.
 * @returns The key, or `''` when empty.
 */
export function exerciseKey(name: string | null | undefined): string {
  return String(name || '').trim().toLocaleLowerCase()
}

/**
 * Guesses the areas of an exercise from its name. When no name rule matches, the category decides.
 * @param exercise - An exercise with a name and a category.
 * @returns The matched areas in rule order, without duplicates. Empty when nothing matches.
 */
export function guessExerciseAreas(exercise: { name: string; category?: string }): ExerciseArea[] {
  const name = exerciseKey(exercise.name)
  const category = exerciseKey(exercise.category)
  const matches: ExerciseArea[] = []
  const add = (...areas: ExerciseArea[]): void => {
    for (const area of areas) if (!matches.includes(area)) matches.push(area)
  }
  if (/pull.?up|chin.?up|row|lat pull/.test(name)) add('Back', 'Biceps')
  else if (/overhead press|shoulder press|pike press|pike push|lateral raise/.test(name)) add('Shoulders', 'Triceps')
  else if (/push.?up|bench press|incline press|\bdips?\b/.test(name)) add('Chest', 'Shoulders', 'Triceps')
  else if (/curl/.test(name)) add('Biceps')
  else if (/tricep/.test(name)) add('Triceps')
  else if (/romanian deadlift|\brdl\b/.test(name)) add('Hamstrings', 'Glutes')
  else if (/deadlift/.test(name)) add('Back', 'Hamstrings', 'Glutes')
  else if (/hip thrust|glute bridge/.test(name)) add('Glutes', 'Hamstrings')
  else if (/squat|lunge|step.?up|wall sit/.test(name)) add('Quadriceps', 'Glutes')
  else if (/swing/.test(name)) add('Glutes', 'Hamstrings', 'Conditioning')
  else if (/plank|crunch|sit.?up|shoulder taps/.test(name)) add('Core')
  else if (/jump rope|running|jog|cycling|rowing|swim/.test(name)) add('Cardio', 'Conditioning')
  else if (/burpee|mountain climber/.test(name)) add('Conditioning', 'Core')
  else if (/stretch|mobility|yoga/.test(name)) add('Mobility')
  else if (/calf|calves/.test(name)) add('Calves')
  const fallback = Object.hasOwn(CATEGORY_AREAS, category) ? CATEGORY_AREAS[category] : undefined
  if (!matches.length && fallback) add(...fallback)
  return matches
}

/**
 * The areas of an exercise: the user's saved assignment when one exists (unknown names dropped), otherwise the guess.
 * @param exercise - An exercise with a name and a category.
 * @param saved - The `areas` map from the stats payload, keyed by exercise key.
 * @returns The assigned or guessed areas. An empty saved list means "no areas", not a fallback to the guess.
 */
export function exerciseAreas(exercise: { name: string; category?: string }, saved: Record<string, unknown>): ExerciseArea[] {
  const key = exerciseKey(exercise.name)
  const assigned: unknown = Object.hasOwn(saved, key) ? saved[key] : undefined
  if (Array.isArray(assigned)) {
    return (assigned as unknown[]).filter((area): area is ExerciseArea => typeof area === 'string' && isExerciseArea(area))
  }
  return guessExerciseAreas(exercise)
}
