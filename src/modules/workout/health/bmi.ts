import { formatDisplayDate } from '@/shared/dates'
import type { BodyWeightEntry, WorkoutBmiInputs } from '../core/types'

/** Lowest BMI shown on the scale. */
export const BMI_SCALE_MIN = 15

/** Highest BMI shown on the scale. */
export const BMI_SCALE_MAX = 40

/** Adult BMI category names used in the result text. */
export type BmiCategory = 'underweight' | 'healthy weight' | 'overweight' | 'obesity range'

/** Text shown before the calculator has usable inputs. */
export const BMI_PROMPT_TEXT = 'Log your weight and enter your height and age to calculate your BMI.'

/** Text shown when inputs are fine but no weight is logged. */
export const BMI_NO_WEIGHT_TEXT = 'Log your weight to calculate your BMI.'

/** Text shown after the inputs change and before Calculate is pressed again. */
export const BMI_STALE_TEXT = 'Select Calculate BMI to update your result.'

/** Position and labels of the category scale marker. */
export interface BmiScale {
  /** Marker position from the left edge, 0 to 100. */
  markerPercent: number
  /** BMI with one decimal, shown on the marker. */
  valueText: string
  /** Accessible name of the scale track. */
  trackLabel: string
}

/** What the calculator shows: a sentence and, when there is a result, the scale. */
export interface BmiReadout {
  /** Result sentence. */
  text: string
  /** Scale data, or `null` when there is no result to show. */
  scale: BmiScale | null
}

/**
 * Body mass index: weight divided by height in metres squared.
 * @param heightCm - Height in centimetres.
 * @param weightKg - Weight in kilograms.
 * @returns The BMI, unrounded.
 */
export function calculateBmi(heightCm: number, weightKg: number): number {
  const heightMetres = heightCm / 100
  return weightKg / (heightMetres * heightMetres)
}

/**
 * Adult category for a BMI. Lower bounds are inclusive: 18.5 is healthy, 25 is overweight, 30 is obesity.
 * @param bmi - The BMI.
 * @returns The category name.
 */
export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight'
  if (bmi < 25) return 'healthy weight'
  if (bmi < 30) return 'overweight'
  return 'obesity range'
}

/**
 * Marker position on the 15 to 40 scale, clamped to the track.
 * @param bmi - The BMI.
 * @returns A percentage from 0 to 100.
 */
export function bmiScalePercent(bmi: number): number {
  return Math.max(0, Math.min(100, ((bmi - BMI_SCALE_MIN) / (BMI_SCALE_MAX - BMI_SCALE_MIN)) * 100))
}

/**
 * Whether a height typed in centimetres is accepted: a number from 30 to 300 in steps of 0.1, as the legacy input says.
 * @param value - The raw input text.
 * @returns `true` when valid.
 */
export function isValidBmiHeight(value: string): boolean {
  if (value.trim() === '') return false
  const height = Number(value)
  if (!Number.isFinite(height) || height < 30 || height > 300) return false
  const tenths = (height - 30) * 10
  return Math.abs(tenths - Math.round(tenths)) < 1e-6
}

/**
 * Whether an age is accepted: a whole number from 1 to 120.
 * @param value - The raw input text.
 * @returns `true` when valid.
 */
export function isValidBmiAge(value: string): boolean {
  if (value.trim() === '') return false
  const age = Number(value)
  return Number.isInteger(age) && age >= 1 && age <= 120
}

/**
 * Builds the calculator readout from the inputs and the latest logged weight. The result always uses the latest
 * weight, so it stays current when a new weight is logged.
 * @param inputs - The height and age inputs, or `null` when none are set.
 * @param latest - The most recent body weight entry, if any.
 * @returns The sentence and, when a result exists, the scale.
 */
export function bmiReadout(inputs: WorkoutBmiInputs | null, latest: BodyWeightEntry | undefined): BmiReadout {
  const height = String(inputs?.height ?? '')
  const age = String(inputs?.age ?? '')
  if (!isValidBmiHeight(height) || !isValidBmiAge(age)) return { text: BMI_PROMPT_TEXT, scale: null }
  if (!latest) return { text: BMI_NO_WEIGHT_TEXT, scale: null }
  const bmi = calculateBmi(Number(height), latest.weight)
  const valueText = bmi.toFixed(1)
  return {
    text: `Your BMI is ${valueText} kg/m², using ${latest.weight} kg recorded on ${formatDisplayDate(latest.date)}.`,
    scale: {
      markerPercent: bmiScalePercent(bmi),
      valueText,
      trackLabel: `BMI ${valueText}, in the ${bmiCategory(bmi)} category. Adult BMI scale from ${BMI_SCALE_MIN} to ${BMI_SCALE_MAX}.`,
    },
  }
}
