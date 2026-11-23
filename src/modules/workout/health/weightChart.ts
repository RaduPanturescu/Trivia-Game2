import { formatDisplayDate, parseLocalDate } from '@/shared/dates'
import type { BodyWeightEntry } from '../core/types'

/** Width of the chart's SVG viewBox. */
export const WEIGHT_CHART_WIDTH = 900

/** Height of the chart's SVG viewBox. */
export const WEIGHT_CHART_HEIGHT = 440

/** Plot rectangle inside the viewBox, in SVG units. */
export const WEIGHT_CHART_PLOT = { left: 78, right: 864, top: 32, bottom: 346 } as const

/** Size of the hover tooltip box, in SVG units. */
export const WEIGHT_TOOLTIP = { width: 144, height: 46 } as const

/** Y-axis range and tick spacing, in kilograms. */
export interface WeightAxis {
  /** Lowest tick value. */
  min: number
  /** Highest tick value. */
  max: number
  /** Distance between two ticks. */
  step: number
}

/** One point on the line, with its tooltip and accessible text already computed. */
export interface WeightChartPoint {
  /** Index into the entries the chart was built from. */
  index: number
  /** Horizontal centre in SVG units. */
  x: number
  /** Vertical centre in SVG units. */
  y: number
  /** Tooltip group x position. */
  tooltipX: number
  /** Tooltip group y position. */
  tooltipY: number
  /** Weight with unit, e.g. `70.5 kg`. */
  weightText: string
  /** Display date, `DD/MM/YYYY`. */
  dateText: string
  /** Hover title, e.g. `01/02/2026: 70.5 kg`. */
  title: string
  /** Accessible name, e.g. `70.5 kilograms on 01/02/2026`. */
  ariaLabel: string
}

/** A horizontal gridline with its label. */
export interface WeightChartTick {
  /** Vertical position in SVG units. */
  y: number
  /** Label, e.g. `70.5 kg`. */
  text: string
}

/** A date label under the x-axis. */
export interface WeightChartDateLabel {
  /** Horizontal position in SVG units. */
  x: number
  /** Text anchor, chosen so the first and last labels stay inside the plot. */
  anchor: 'start' | 'middle' | 'end'
  /** Display date, `DD/MM/YYYY`. */
  text: string
}

/** Everything the chart template draws. */
export interface WeightChartGeometry {
  /** The plot rectangle. */
  plot: typeof WEIGHT_CHART_PLOT
  /** The y-axis range. */
  axis: WeightAxis
  /** One entry per logged weight. */
  points: WeightChartPoint[]
  /** Value of the `points` attribute of the line. */
  polyline: string
  /** Gridlines and their labels. */
  yTicks: WeightChartTick[]
  /** Date labels under the x-axis, at most six. */
  xLabels: WeightChartDateLabel[]
}

/**
 * Computes the y-axis range for a set of weights: padded by 18% of the spread (at least 0.5 kg), snapped to half
 * kilograms, with about four ticks.
 * @param weights - The logged weights in kilograms. Must not be empty.
 * @returns The axis range and tick step.
 */
export function weightAxis(weights: number[]): WeightAxis {
  const lowest = Math.min(...weights)
  const highest = Math.max(...weights)
  const padding = Math.max((highest - lowest) * 0.18, 0.5)
  const minWeight = Math.max(0, Math.floor((lowest - padding) * 2) / 2)
  const maxWeight = Math.ceil((highest + padding) * 2) / 2
  const step = Math.max(0.5, Math.ceil(((maxWeight - minWeight) / 4) * 2) / 2)
  const min = Math.floor(minWeight / step) * step
  let max = Math.ceil(maxWeight / step) * step
  if (max <= min) max = min + step
  return { min, max, step }
}

/**
 * Builds the weight-over-time chart. X positions are spaced by calendar date, not by entry index. A single entry is
 * centred. Returns `null` when there is nothing to draw.
 * @param entries - Body weight entries, oldest first (as returned by the store).
 * @returns The geometry, or `null` for an empty list.
 */
export function buildWeightChart(entries: BodyWeightEntry[]): WeightChartGeometry | null {
  if (entries.length === 0) return null
  const { left, right, top, bottom } = WEIGHT_CHART_PLOT
  const axis = weightAxis(entries.map((entry) => entry.weight))
  const range = axis.max - axis.min
  const timestamps = entries.map((entry) => parseLocalDate(entry.date).getTime())
  const firstTime = timestamps[0] ?? 0
  const timeRange = (timestamps.at(-1) ?? firstTime) - firstTime
  const xFor = (index: number): number => (entries.length === 1 || timeRange === 0
    ? (left + right) / 2
    : left + (((timestamps[index] ?? firstTime) - firstTime) / timeRange) * (right - left))
  const yFor = (weight: number): number => bottom - ((weight - axis.min) / range) * (bottom - top)

  const yTicks: WeightChartTick[] = []
  for (let weight = axis.min; weight <= axis.max + axis.step * 0.001; weight += axis.step) {
    const rounded = Number(weight.toFixed(2))
    yTicks.push({ y: yFor(rounded), text: `${rounded.toFixed(rounded % 1 ? 1 : 0)} kg` })
  }

  const points: WeightChartPoint[] = entries.map((entry, index) => {
    const x = xFor(index)
    const y = yFor(entry.weight)
    const dateText = formatDisplayDate(entry.date)
    return {
      index,
      x,
      y,
      tooltipX: Math.max(8, Math.min(WEIGHT_CHART_WIDTH - WEIGHT_TOOLTIP.width, x - 72)),
      tooltipY: y - 56 < 8 ? y + 12 : y - 56,
      weightText: `${entry.weight} kg`,
      dateText,
      title: `${dateText}: ${entry.weight} kg`,
      ariaLabel: `${entry.weight} kilograms on ${dateText}`,
    }
  })

  const labelCount = Math.min(entries.length, 6)
  const labelIndexes = new Set<number>()
  for (let position = 0; position < labelCount; position++) {
    labelIndexes.add(labelCount === 1 ? 0 : Math.round((position * (entries.length - 1)) / (labelCount - 1)))
  }
  const xLabels: WeightChartDateLabel[] = [...labelIndexes].map((index) => ({
    x: xFor(index),
    anchor: index === 0 ? 'start' : index === entries.length - 1 ? 'end' : 'middle',
    text: formatDisplayDate(entries[index]?.date ?? ''),
  }))

  return {
    plot: WEIGHT_CHART_PLOT,
    axis,
    points,
    polyline: points.map((point) => `${point.x},${point.y}`).join(' '),
    yTicks,
    xLabels,
  }
}
