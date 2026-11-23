/**
 * Public surface of the workout timers. The dashboard mounts {@link WorkoutTimerModal} and calls
 * {@link useWorkoutTimer} to open it or to start an exercise.
 */
export { default as WorkoutTimerModal } from './WorkoutTimerModal.vue'
export { useWorkoutTimer } from './useWorkoutTimer'
export type { StopwatchMode, WorkoutTimerApi, WorkoutTimerPhase } from './useWorkoutTimer'
export { describeExercise, getExerciseRowControls } from './exerciseRows'
export type { ExerciseRowControls, ExerciseTimerState } from './exerciseRows'
