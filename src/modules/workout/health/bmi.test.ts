import { describe, expect, it } from 'vitest'
import {
  BMI_NO_WEIGHT_TEXT,
  BMI_PROMPT_TEXT,
  bmiCategory,
  bmiReadout,
  bmiScalePercent,
  calculateBmi,
  isValidBmiAge,
  isValidBmiHeight,
} from './bmi'

describe('calculateBmi', () => {
  it('divides weight by height in metres squared', () => {
    expect(calculateBmi(180, 75)).toBeCloseTo(23.148, 3)
  })
})

describe('bmiCategory', () => {
  it.each([
    [18.4999, 'underweight'],
    [18.5, 'healthy weight'],
    [24.99, 'healthy weight'],
    [25, 'overweight'],
    [29.99, 'overweight'],
    [30, 'obesity range'],
    [45, 'obesity range'],
  ] as const)('classifies %s as %s', (bmi, category) => {
    expect(bmiCategory(bmi)).toBe(category)
  })
})

describe('bmiScalePercent', () => {
  it('maps 15 to 40 onto 0 to 100 and clamps outside it', () => {
    expect(bmiScalePercent(15)).toBe(0)
    expect(bmiScalePercent(27.5)).toBe(50)
    expect(bmiScalePercent(40)).toBe(100)
    expect(bmiScalePercent(10)).toBe(0)
    expect(bmiScalePercent(50)).toBe(100)
  })
})

describe('isValidBmiHeight', () => {
  it.each([
    ['', false],
    ['abc', false],
    ['29.9', false],
    ['30', true],
    ['170.3', true],
    ['170.25', false],
    ['300', true],
    ['300.1', false],
  ])('accepts %j: %s', (value, valid) => {
    expect(isValidBmiHeight(value)).toBe(valid)
  })
})

describe('isValidBmiAge', () => {
  it.each([
    ['', false],
    ['0', false],
    ['1', true],
    ['120', true],
    ['121', false],
    ['30.5', false],
  ])('accepts %j: %s', (value, valid) => {
    expect(isValidBmiAge(value)).toBe(valid)
  })
})

describe('bmiReadout', () => {
  it('asks for inputs when none are set', () => {
    expect(bmiReadout(null, { date: '2026-11-20', weight: 75 })).toEqual({ text: BMI_PROMPT_TEXT, scale: null })
    expect(bmiReadout({ height: '180', age: '' }, { date: '2026-11-20', weight: 75 })).toEqual({ text: BMI_PROMPT_TEXT, scale: null })
  })

  it('asks for a weight when inputs are valid but nothing is logged', () => {
    expect(bmiReadout({ height: '180', age: '30' }, undefined)).toEqual({ text: BMI_NO_WEIGHT_TEXT, scale: null })
  })

  it('shows the result, the weight it used and the scale marker', () => {
    const readout = bmiReadout({ height: '180', age: '30' }, { date: '2026-11-20', weight: 75 })
    expect(readout.text).toBe('Your BMI is 23.1 kg/m², using 75 kg recorded on 20/11/2026.')
    expect(readout.scale?.valueText).toBe('23.1')
    expect(readout.scale?.markerPercent).toBeCloseTo(32.59, 1)
    expect(readout.scale?.trackLabel).toContain('in the healthy weight category')
  })
})
