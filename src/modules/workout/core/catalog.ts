import type { WorkoutExerciseOverrides, WorkoutLibraryExercise, WorkoutTemplateExercise, WorkoutDayExercise } from './types'

/**
 * The built-in exercise library, in legacy order. Edits made in the app are stored as overrides and merged on top
 * by {@link getWorkoutExerciseCatalog}. Copied verbatim from the legacy `workoutExerciseCatalog`.
 */
export const WORKOUT_EXERCISE_CATALOG: readonly WorkoutLibraryExercise[] = [
    { id: 'bench-press', name: 'Bench Press', category: 'chest', sets: 4, reps: 8, weight: 20, duration: 45, rest: 60, description: 'Press from a flat bench with a strong full-body brace.' },
    { id: 'incline-press', name: 'Incline Press', category: 'chest', sets: 3, reps: 10, weight: 15, duration: 45, rest: 60, description: 'Target the upper chest with controlled bar speed.' },
    { id: 'push-up', name: 'Push Ups', category: 'upper body', sets: 3, reps: 12, weight: 0, bodyWeight: true, duration: 35, rest: 45, description: 'Bodyweight press that hits chest, shoulders and triceps.' },
    { id: 'overhead-press', name: 'Overhead Press', category: 'upper body', sets: 4, reps: 8, weight: 10, duration: 40, rest: 60, description: 'Drive through with strict pressing form.' },
    { id: 'bicep-curl', name: 'Bicep Curl', category: 'arms', sets: 3, reps: 12, weight: 8, duration: 35, rest: 45, description: 'Curl the weight with a strong squeeze at the top.' },
    { id: 'tricep-dips', name: 'Tricep Dips', category: 'arms', sets: 3, reps: 10, weight: 0, bodyWeight: true, duration: 35, rest: 45, description: 'Use bench or chair to control each rep.' },
    { id: 'squat', name: 'Back Squat', category: 'legs', sets: 4, reps: 8, weight: 35, duration: 50, rest: 75, description: 'Standard lower-body lift to build strength and power.' },
    { id: 'lunge', name: 'Walking Lunge', category: 'legs', sets: 3, reps: 10, weight: 10, duration: 40, rest: 50, description: 'Strong single-leg control with an upright posture.' },
    { id: 'hip-thrust', name: 'Hip Thrust', category: 'glutes', sets: 4, reps: 10, weight: 25, duration: 45, rest: 60, description: 'Drive through the hips and keep the ribs down.' },
    { id: 'deadlift', name: 'Romanian Deadlift', category: 'glutes', sets: 3, reps: 8, weight: 30, duration: 45, rest: 60, description: 'Hinge at the hips and control the lower back.' },
    { id: 'kettlebell-swing', name: 'Kettlebell Swing', category: 'kettlebell', sets: 4, reps: 12, weight: 12, duration: 35, rest: 45, description: 'Explosive hip drive and a full range of motion.' },
    { id: 'goblet-squat', name: 'Goblet Squat', category: 'kettlebell', sets: 3, reps: 12, weight: 12, duration: 40, rest: 45, description: 'Hold the kettlebell close and maintain depth.' },
    { id: 'plank', name: 'Plank Hold', category: 'core', sets: 3, reps: 1, weight: 0, bodyWeight: true, duration: 45, rest: 30, description: 'Keep the torso braced and maintain a straight line.' },
    { id: 'jump-rope', name: 'Jump Rope', category: 'conditioning', sets: 4, reps: 20, weight: 0, bodyWeight: true, duration: 40, rest: 30, description: 'Short cardio bursts to keep the heart rate up.' },
    { id: 'sit-ups', name: 'Sit-Ups', category: 'core', sets: 3, reps: 12, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'Raise and lower your torso with control.' },
    { id: 'bodyweight-lunges', name: 'Lunges', category: 'legs', sets: 3, reps: 10, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'Step into a lunge and alternate legs with control.' },
    { id: 'bodyweight-squats', name: 'Squats', category: 'legs', sets: 3, reps: 12, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'Squat with your body weight and stand tall.' },
    { id: 'close-grip-push-ups', name: 'Close Grip Push Ups', category: 'upper body', sets: 3, reps: 10, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'Perform push-ups with your hands close together.' },
    { id: 'cheat-push-ups', name: 'Cheat Push-Ups', category: 'upper body', sets: 3, reps: 10, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'Push-ups from a kneeling position.' },
    { id: 'pull-ups', name: 'Pull Ups', category: 'upper body', sets: 3, reps: 8, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'Pull up to the bar and lower with control.' },
    { id: 'chin-ups', name: 'Chin-Ups', category: 'arms', sets: 3, reps: 8, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'Pull up to a bar with an underhand grip and lower with control.' },
    { id: 'reverse-crunches', name: 'Reverse Crunches', category: 'core', sets: 3, reps: 12, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'Bring your knees toward your chest with control.' },
    { id: 'plank-rotations', name: 'Plank Rotations', category: 'core', sets: 3, reps: 10, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'Rotate from a plank into a side plank, alternating sides.' },
    { id: 'mountain-climbers', name: 'Mountain Climbers', category: 'conditioning', sets: 3, reps: 20, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'Alternate bringing your knees forward from a plank.' },
    { id: 'burpees', name: 'Burpees', category: 'conditioning', sets: 3, reps: 10, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'Move from standing to a plank and back to standing.' },
    { id: 'wall-sit', name: 'Wall Sit', category: 'conditioning', sets: 3, reps: 1, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'Hold a seated position with your back against a wall.' },
    { id: 'shoulder-taps', name: 'Shoulder Taps', category: 'upper body', sets: 3, reps: 12, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'From a plank, alternate tapping each shoulder.' },
    { id: 'pike-push-ups', name: 'Pike Push Ups', category: 'upper body', sets: 3, reps: 10, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'Keep the hips high and lower the head toward the floor for a shoulder-focused press.' },
    { id: 'dips', name: 'Dips', category: 'upper body', sets: 3, reps: 10, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'Lower and press using parallel bars or a stable bench.' },
    { id: 'diamond-push-ups', name: 'Diamond Push Ups', category: 'upper body', sets: 3, reps: 10, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'Place your hands close together in a diamond shape and press with control.' },
    { id: 'step-ups', name: 'Step-Ups', category: 'legs', sets: 3, reps: 10, weight: 0, bodyWeight: true, duration: 45, rest: 60, description: 'Step onto a stable platform and return with control.' }
];

/** Categories every library starts with. Custom categories are added on top. */
export const DEFAULT_WORKOUT_CATEGORIES: readonly string[] = ['chest', 'upper body', 'arms', 'legs', 'glutes', 'core', 'kettlebell', 'conditioning']

/**
 * Returns the built-in library with user overrides applied. An override may change any field except `id`.
 * A legacy-style override that sets only `weight` also updates `bodyWeight` when `bodyWeight` is not overridden.
 * @param overrides - The stored `triviaWorkoutExerciseOverrides` payload.
 * @returns A new array of library exercises, in catalog order.
 */
export function getWorkoutExerciseCatalog(overrides: WorkoutExerciseOverrides): WorkoutLibraryExercise[] {
  return WORKOUT_EXERCISE_CATALOG.map((exercise) => {
    const override = overrides[exercise.id] ?? {}
    const result: WorkoutLibraryExercise = { ...exercise, ...override, id: exercise.id }
    if (exercise.bodyWeight && override.bodyWeight === undefined && override.weight !== undefined) {
      result.bodyWeight = Number(override.weight) === 0
    }
    return result
  })
}

/**
 * Whether an exercise is bodyweight. Uses the explicit flag when present, otherwise a zero load.
 * @param exercise - Any exercise-shaped object.
 * @returns `true` for bodyweight exercises.
 */
export function isBodyweightExercise(exercise: Pick<WorkoutTemplateExercise, 'bodyWeight' | 'weight'>): boolean {
  return typeof exercise.bodyWeight === 'boolean' ? exercise.bodyWeight : Number(exercise.weight || 0) === 0
}

/**
 * Copies template or library exercises onto a day: a new id per day, `completed: false` and `currentSet: 1`.
 * @param exercises - Exercises to copy. Missing or non-array input gives `[]`.
 * @param dayDate - The day's `YYYY-MM-DD`, used to build the new ids.
 * @returns New day exercises. The input is not modified.
 */
export function cloneWorkoutExercises(
  exercises: readonly (WorkoutTemplateExercise & { id?: string })[] | undefined,
  dayDate: string,
): WorkoutDayExercise[] {
  return (exercises ?? []).map((exercise, index) => ({
    ...exercise,
    id: `${exercise.id || 'exercise'}-${dayDate}-${index}`,
    completed: false,
    currentSet: 1,
  }))
}
