<script setup lang="ts">
/** Weight-over-time line chart drawn as SVG. Hovering or focusing a point shows its weight and date. */
import { computed, ref } from 'vue'
import type { BodyWeightEntry } from '../core/types'
import { buildWeightChart, WEIGHT_CHART_HEIGHT, WEIGHT_CHART_WIDTH, WEIGHT_TOOLTIP } from './weightChart'

const props = defineProps<{ entries: BodyWeightEntry[] }>()

const chart = computed(() => buildWeightChart(props.entries))
const activeIndex = ref<number | null>(null)
</script>

<template>
  <p
    v-if="!chart"
    class="weight-history-empty"
  >
    No weight entries yet. Log your first weight to see your progress.
  </p>
  <div
    v-else
    class="weight-chart-wrap"
    aria-label="Bodyweight over time chart"
  >
    <svg
      :viewBox="`0 0 ${WEIGHT_CHART_WIDTH} ${WEIGHT_CHART_HEIGHT}`"
      role="img"
      aria-label="Line graph of recorded bodyweight by date"
    >
      <template
        v-for="(tick, tickIndex) in chart.yTicks"
        :key="`tick-${tickIndex}`"
      >
        <line
          :x1="chart.plot.left"
          :x2="chart.plot.right"
          :y1="tick.y"
          :y2="tick.y"
          class="weight-chart-gridline"
        />
        <text
          :x="chart.plot.left - 12"
          :y="tick.y + 4"
          text-anchor="end"
          class="weight-chart-label"
        >{{ tick.text }}</text>
      </template>

      <line
        :x1="chart.plot.left"
        :x2="chart.plot.left"
        :y1="chart.plot.top"
        :y2="chart.plot.bottom"
        class="weight-chart-axis"
      />
      <line
        :x1="chart.plot.left"
        :x2="chart.plot.right"
        :y1="chart.plot.bottom"
        :y2="chart.plot.bottom"
        class="weight-chart-axis"
      />

      <polyline
        :points="chart.polyline"
        class="weight-chart-line"
      />

      <template
        v-for="point in chart.points"
        :key="`point-${point.index}`"
      >
        <circle
          :cx="point.x"
          :cy="point.y"
          :r="5"
          class="weight-chart-point"
          tabindex="0"
          role="img"
          :aria-label="point.ariaLabel"
          @mouseenter="activeIndex = point.index"
          @mouseleave="activeIndex = null"
          @focus="activeIndex = point.index"
          @blur="activeIndex = null"
        >
          <title>{{ point.title }}</title>
        </circle>
        <g
          class="weight-chart-tooltip"
          :visibility="activeIndex === point.index ? 'visible' : 'hidden'"
          :transform="`translate(${point.tooltipX} ${point.tooltipY})`"
        >
          <rect
            :width="WEIGHT_TOOLTIP.width"
            :height="WEIGHT_TOOLTIP.height"
            rx="9"
            class="weight-chart-tooltip-bg"
          />
          <text
            x="11"
            y="19"
            class="weight-chart-tooltip-weight"
          >{{ point.weightText }}</text>
          <text
            x="11"
            y="36"
            class="weight-chart-tooltip-date"
          >{{ point.dateText }}</text>
        </g>
      </template>

      <text
        v-for="(label, labelIndex) in chart.xLabels"
        :key="`x-${labelIndex}`"
        :x="label.x"
        :y="chart.plot.bottom + 25"
        :text-anchor="label.anchor"
        class="weight-chart-label"
      >{{ label.text }}</text>
      <text
        :x="(chart.plot.left + chart.plot.right) / 2"
        y="420"
        text-anchor="middle"
        class="weight-chart-axis-title"
      >Date</text>
      <text
        :x="18"
        :y="(chart.plot.top + chart.plot.bottom) / 2"
        text-anchor="middle"
        class="weight-chart-axis-title"
        :transform="`rotate(-90 18 ${(chart.plot.top + chart.plot.bottom) / 2})`"
        aria-hidden="true"
      >Weight (kg)</text>
    </svg>
  </div>
</template>

<style scoped>
.weight-history-empty {
  padding: 48px 12px;
  color: var(--text-muted);
  text-align: center;
}

.weight-chart-wrap {
  width: 100%;
  overflow: hidden;
}

.weight-chart-wrap svg {
  display: block;
  width: 100%;
  min-height: 260px;
}

.weight-chart-gridline {
  stroke: rgba(255, 255, 255, 0.09);
  stroke-width: 1;
  stroke-dasharray: 4 7;
}

.weight-chart-axis {
  stroke: rgba(178, 190, 195, 0.4);
  stroke-width: 1.5;
}

.weight-chart-line {
  fill: none;
  stroke: var(--secondary);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 7px rgba(0, 206, 201, 0.45));
}

.weight-chart-point {
  fill: #171a2c;
  stroke: var(--secondary);
  stroke-width: 3;
  cursor: crosshair;
}

.weight-chart-point:focus {
  outline: none;
  stroke: #ffffff;
  stroke-width: 4;
}

.weight-chart-tooltip {
  pointer-events: none;
}

.weight-chart-tooltip-bg {
  fill: #211d38;
  stroke: rgba(0, 206, 201, 0.7);
  stroke-width: 1.5;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45));
}

.weight-chart-tooltip-weight {
  fill: #ffffff;
  font-size: 14px;
  font-weight: 800;
  font-family: 'Outfit', sans-serif;
}

.weight-chart-tooltip-date {
  fill: #a9fffb;
  font-size: 11px;
  font-family: 'Outfit', sans-serif;
}

.weight-chart-label {
  fill: var(--text-muted);
  font-size: 13px;
  font-family: 'Outfit', sans-serif;
}

.weight-chart-axis-title {
  fill: #a9fffb;
  font-size: 14px;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
}
</style>
