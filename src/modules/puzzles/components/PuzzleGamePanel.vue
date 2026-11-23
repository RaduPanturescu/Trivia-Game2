<script setup lang="ts">
/** Board, tray and status line of the puzzle being played. Game rules live in usePuzzleGame; this component only binds them to elements. */
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import { AppButton } from '@/shared/components'
import { layoutStyles } from '../board'
import type { PuzzleGame } from '../usePuzzleGame'
import JigsawCanvas from './JigsawCanvas.vue'
import JigsawPiece from './JigsawPiece.vue'

const props = defineProps<{
  /** State and actions of the current game. */
  game: PuzzleGame
}>()

const { active, layout, drag, message, tray, scattered, isPlaced, fit, zoomBy, startDrag, moveDrag, endDrag, close } =
  props.game

const panel = useTemplateRef<HTMLElement>('panel')
const workspace = useTemplateRef<HTMLElement>('workspace')
const board = useTemplateRef<HTMLElement>('board')

/** Row-major indexes of every cell, one per board slot. */
const cells = computed(() => {
  const current = layout.value
  return current ? Array.from({ length: current.rows * current.columns }, (_, index) => index) : []
})

/**
 * Workspace width used for fitting. Falls back to 800 px as the legacy app does when the element has no width yet.
 * @returns The width in pixels.
 */
function workspaceWidth(): number {
  return workspace.value?.clientWidth || 800
}

// A new game opens its panel; fit the board once the panel is in the DOM, then bring it into view.
watch(active, async (game) => {
  if (!game) return
  await nextTick()
  fit(workspaceWidth())
  panel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

/**
 * Starts a drag and captures the pointer on the workspace, so moves and the release keep arriving while the piece is in the body.
 * @param index - Cell index of the piece.
 * @param event - The pointer down event.
 */
function beginDrag(index: number, event: PointerEvent): void {
  startDrag(index, event)
  if (drag.value) workspace.value?.setPointerCapture(event.pointerId)
}

/**
 * Ends a drag on pointer up or cancel.
 * @param event - The pointer event.
 */
function finishDrag(event: PointerEvent): void {
  if (board.value && workspace.value) endDrag(event, board.value, workspace.value)
}

/**
 * Zooms the board on wheel input. The page does not scroll while the wheel is over the workspace.
 * @param event - The wheel event.
 */
function onWheel(event: WheelEvent): void {
  event.preventDefault()
  zoomBy(event.deltaY, workspaceWidth())
}
</script>

<template>
  <section
    v-if="active"
    ref="panel"
    class="puzzle-game-panel"
  >
    <div class="puzzle-game-heading">
      <div><h3>{{ active.puzzle.title }}</h3></div>
      <AppButton
        variant="subtle"
        class="close-btn"
        @click="close"
      >
        Close Puzzle
      </AppButton>
    </div>
    <p class="puzzle-instructions">
      Hold the left mouse button and drag each piece. Release it near its matching outline to snap it into place. Scroll to zoom.
    </p>
    <div
      ref="workspace"
      class="puzzle-workspace"
      @pointermove="moveDrag"
      @pointerup="finishDrag"
      @pointercancel="finishDrag"
      @wheel="onWheel"
    >
      <template v-if="layout">
        <div class="puzzle-board-viewport">
          <div
            ref="board"
            class="puzzle-board"
            aria-label="Puzzle board"
            :style="layoutStyles(layout).board"
          >
            <div
              v-for="index in cells"
              :key="index"
              class="puzzle-slot"
            >
              <JigsawCanvas
                kind="outline"
                :index="index"
                :layout="layout"
              />
              <JigsawPiece
                v-if="isPlaced(index)"
                class="is-placed"
                disabled
                :index="index"
                :layout="layout"
              />
            </div>
          </div>
        </div>
        <div
          class="puzzle-piece-tray"
          aria-label="Scrambled puzzle pieces"
          :style="layoutStyles(layout).tray"
        >
          <JigsawPiece
            v-for="piece in tray"
            :key="piece.index"
            :index="piece.index"
            :layout="layout"
            @pointerdown="beginDrag(piece.index, $event)"
          />
        </div>
        <JigsawPiece
          v-for="piece in scattered"
          :key="piece.index"
          class="is-scattered"
          :index="piece.index"
          :layout="layout"
          :style="{ left: `${piece.x}px`, top: `${piece.y}px` }"
          @pointerdown="beginDrag(piece.index, $event)"
        />
      </template>
    </div>
    <Teleport to="body">
      <JigsawPiece
        v-if="drag && layout"
        class="is-dragging"
        :index="drag.index"
        :layout="layout"
        :style="{ transform: `translate3d(${drag.x}px, ${drag.y}px, 0)` }"
      />
    </Teleport>
    <p
      class="puzzle-game-message"
      aria-live="polite"
    >
      {{ message }}
    </p>
  </section>
</template>

<style scoped>
.puzzle-game-panel {
  margin: 12px 0;
  padding: 18px;
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.14), rgba(0, 206, 201, 0.06));
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.puzzle-game-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.puzzle-game-heading > div {
  min-width: 0;
  overflow-wrap: anywhere;
}

.puzzle-game-heading h3 {
  color: var(--secondary);
  font-size: 1.2rem;
}

.close-btn {
  flex: 0 0 auto;
}

.puzzle-instructions {
  margin: 12px 0;
  color: var(--text-muted);
  text-align: center;
  font-size: 0.88rem;
}

.puzzle-workspace {
  position: relative;
  overflow: auto;
  max-height: min(68vh, 760px);
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.18);
}

.puzzle-board-viewport {
  display: flex;
  justify-content: center;
  min-width: fit-content;
  margin: 0 auto 18px;
}

.puzzle-board {
  display: grid;
  flex: none;
  overflow: visible;
  isolation: isolate;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 4px;
  background: rgba(10, 11, 20, 0.8);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
}

.puzzle-slot {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: visible;
  border: 0;
  background: transparent;
}

.puzzle-piece-tray {
  position: relative;
  z-index: 4;
  display: grid;
  justify-content: center;
  align-content: start;
  gap: 5px;
  min-height: 50px;
  margin: 0 auto;
  padding: 10px;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.025);
}

.puzzle-slot .puzzle-piece {
  position: absolute;
  left: calc(-1 * var(--jigsaw-tab, 0px));
  top: calc(-1 * var(--jigsaw-tab, 0px));
  z-index: 2;
  box-shadow: none;
  pointer-events: none;
}

.puzzle-piece.is-placed {
  cursor: default;
}

.puzzle-workspace .puzzle-piece.is-scattered {
  position: absolute;
  z-index: 3;
}

.puzzle-piece.is-dragging {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 5000;
  pointer-events: none;
  will-change: transform;
  transition: none !important;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
}

.puzzle-game-message {
  min-height: 1.4em;
  margin-top: 10px;
  color: var(--secondary);
  text-align: center;
  font-weight: 700;
}

@media (max-width: 430px) {
  .puzzle-game-panel {
    padding: 14px;
  }

  .puzzle-game-heading {
    align-items: flex-start;
  }
}
</style>
