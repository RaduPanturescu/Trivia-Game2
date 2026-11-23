import { describe, expect, it } from 'vitest'
import { buildWeightChart, weightAxis, WEIGHT_CHART_PLOT, WEIGHT_CHART_WIDTH } from './weightChart'
import type { BodyWeightEntry } from '../core/types'

describe('buildWeightChart', () => {
  it('returns null when there are no entries', () => {
    expect(buildWeightChart([])).toBeNull()
  })

  it('centres a single entry horizontally and labels it with its date', () => {
    const chart = buildWeightChart([{ date: '2026-11-23', weight: 70 }])
    expect(chart).not.toBeNull()
    expect(chart?.points).toHaveLength(1)
    expect(chart?.points[0]?.x).toBe((WEIGHT_CHART_PLOT.left + WEIGHT_CHART_PLOT.right) / 2)
    expect(chart?.xLabels).toEqual([{ x: 471, anchor: 'start', text: '23/11/2026' }])
  })

  it('pads a single weight by half a kilogram on each side with half-kilogram ticks', () => {
    const chart = buildWeightChart([{ date: '2026-11-23', weight: 70 }])
    expect(chart?.axis).toEqual({ min: 69.5, max: 70.5, step: 0.5 })
    expect(chart?.yTicks.map((tick) => tick.text)).toEqual(['69.5 kg', '70 kg', '70.5 kg'])
    expect(chart?.points[0]?.y).toBe(189)
  })

  it('spaces many entries by calendar date, not by index', () => {
    const entries: BodyWeightEntry[] = [
      { date: '2026-11-01', weight: 70 },
      { date: '2026-11-11', weight: 72 },
      { date: '2026-11-21', weight: 71 },
    ]
    const chart = buildWeightChart(entries)
    const xs = chart?.points.map((point) => point.x)
    expect(xs).toEqual([WEIGHT_CHART_PLOT.left, 471, WEIGHT_CHART_PLOT.right])
    expect(chart?.polyline).toBe(chart?.points.map((point) => `${point.x},${point.y}`).join(' '))
  })

  it('spaces uneven dates by their real distance', () => {
    const chart = buildWeightChart([
      { date: '2026-11-01', weight: 70 },
      { date: '2026-11-02', weight: 71 },
      { date: '2026-11-11', weight: 72 },
    ])
    const xs = chart?.points.map((point) => point.x) ?? []
    expect(xs[1]).toBeCloseTo(WEIGHT_CHART_PLOT.left + (1 / 10) * (WEIGHT_CHART_PLOT.right - WEIGHT_CHART_PLOT.left))
  })

  it('computes the y-axis from the padded weight range with one-kilogram ticks for a 2 kg spread', () => {
    const chart = buildWeightChart([
      { date: '2026-11-01', weight: 70 },
      { date: '2026-11-11', weight: 72 },
      { date: '2026-11-21', weight: 71 },
    ])
    expect(chart?.axis).toEqual({ min: 69, max: 73, step: 1 })
    expect(chart?.yTicks.map((tick) => tick.text)).toEqual(['69 kg', '70 kg', '71 kg', '72 kg', '73 kg'])
    // 70 kg sits a quarter of the way up the 69 to 73 range.
    expect(chart?.points[0]?.y).toBeCloseTo(346 - (1 / 4) * (346 - 32))
  })

  it('shows at most six date labels, always including the first and last entry', () => {
    const entries: BodyWeightEntry[] = Array.from({ length: 10 }, (_, index) => ({
      date: `2026-11-${String(index + 1).padStart(2, '0')}`,
      weight: 70 + index * 0.1,
    }))
    const chart = buildWeightChart(entries)
    expect(chart?.xLabels).toHaveLength(6)
    expect(chart?.xLabels[0]).toMatchObject({ anchor: 'start', text: '01/11/2026' })
    expect(chart?.xLabels.at(-1)).toMatchObject({ anchor: 'end', text: '10/11/2026' })
    expect(chart?.xLabels[1]?.anchor).toBe('middle')
  })

  it('clamps the tooltip inside the plot width and sits 56 units above its point', () => {
    const chart = buildWeightChart([
      { date: '2026-11-01', weight: 70 },
      { date: '2026-11-11', weight: 73 },
    ])
    const first = chart?.points[0]
    const last = chart?.points[1]
    expect(first?.tooltipX).toBe(8)
    expect(last?.tooltipX).toBe(WEIGHT_CHART_WIDTH - 144)
    expect(first?.tooltipY).toBeCloseTo((first?.y ?? 0) - 56)
    expect(last?.tooltipY).toBeCloseTo((last?.y ?? 0) - 56)
  })

  it('builds accessible labels and hover titles from the display date and weight', () => {
    const chart = buildWeightChart([{ date: '2026-11-23', weight: 70.5 }])
    expect(chart?.points[0]).toMatchObject({
      weightText: '70.5 kg',
      dateText: '23/11/2026',
      title: '23/11/2026: 70.5 kg',
      ariaLabel: '70.5 kilograms on 23/11/2026',
    })
  })
})

describe('weightAxis', () => {
  it('never returns a step below half a kilogram', () => {
    expect(weightAxis([70, 70.1]).step).toBe(0.5)
  })
})
