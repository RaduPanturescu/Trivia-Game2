<script setup lang="ts">
/** One jigsaw piece: a button showing its part of the picture. Position, state and pointer handlers come from the parent as attributes. */
import { computed } from 'vue'
import { jigsawPieceSize, type JigsawLayout } from '../jigsaw'
import JigsawCanvas from './JigsawCanvas.vue'

const props = defineProps<{
  /** Correct cell index of the piece, row-major. */
  index: number
  /** Board layout the piece is drawn from. */
  layout: JigsawLayout
}>()

const size = computed(() => jigsawPieceSize(props.layout))
</script>

<template>
  <button
    type="button"
    class="puzzle-piece"
    :aria-label="`Puzzle piece ${index + 1}`"
    :style="{ width: `${size.width}px`, height: `${size.height}px` }"
  >
    <JigsawCanvas
      kind="piece"
      :index="index"
      :layout="layout"
    />
  </button>
</template>

<style scoped>
.puzzle-piece {
  display: block;
  position: relative;
  padding: 0;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: 0 4px 9px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  touch-action: none;
  user-select: none;
}

.puzzle-piece:hover {
  z-index: 2;
  filter: drop-shadow(0 0 4px rgba(0, 206, 201, 0.85));
}
</style>
