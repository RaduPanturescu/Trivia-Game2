<script setup lang="ts">
/** Canvas for one jigsaw piece or one empty-slot outline. Redraws whenever the layout or the cell changes. */
import { computed, useTemplateRef, watchEffect } from 'vue'
import { drawJigsawOutline, drawJigsawPiece, jigsawPieceSize, type JigsawLayout } from '../jigsaw'

const props = defineProps<{
  /** `outline` draws the empty slot; `piece` draws the picture fragment. */
  kind: 'outline' | 'piece'
  /** Row-major index of the cell. */
  index: number
  /** Board layout the canvas is drawn from. */
  layout: JigsawLayout
}>()

const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const size = computed(() => jigsawPieceSize(props.layout))

watchEffect(() => {
  const element = canvas.value
  if (!element) return
  element.width = size.value.width
  element.height = size.value.height
  const context = element.getContext('2d')
  if (!context) return
  if (props.kind === 'outline') drawJigsawOutline(context, props.layout, props.index)
  else drawJigsawPiece(context, props.layout, props.index)
})
</script>

<template>
  <canvas
    ref="canvas"
    :class="kind === 'outline' ? 'puzzle-slot-outline' : undefined"
    :style="{ width: `${size.width}px`, height: `${size.height}px` }"
    aria-hidden="true"
  />
</template>

<style scoped>
canvas {
  display: block;
  pointer-events: none;
}

.puzzle-slot-outline {
  position: absolute;
  left: calc(-1 * var(--jigsaw-tab, 0px));
  top: calc(-1 * var(--jigsaw-tab, 0px));
  z-index: 0;
}
</style>
