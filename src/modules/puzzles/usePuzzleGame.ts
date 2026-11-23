import { computed, ref, shallowRef, type ComputedRef, type Ref } from 'vue'
import { fitJigsawBoard, randomEdges, snapTarget } from './board'
import { markDailyCompleted } from './daily'
import { jigsawPieceSize, type JigsawLayout } from './jigsaw'
import { DIFFICULTIES, type Difficulty, type DifficultyConfig, type PlayablePuzzle } from './types'
import { shuffle } from './util'

/** Zoom limits and the change per wheel notch, as in the legacy app. */
const MIN_ZOOM = 0.65
const MAX_ZOOM = 2.5
const ZOOM_STEP = 0.1

/** Where a piece sits: in the tray, scattered on the workspace, or snapped onto the board. */
export type PieceZone = 'tray' | 'scattered' | 'placed'

/** One piece of the current puzzle. `index` is its correct cell, row-major. `x` and `y` apply when scattered. */
export interface PuzzlePiece {
  /** Correct cell index, row-major. */
  index: number
  /** Where the piece is. */
  zone: PieceZone
  /** Left offset in workspace pixels, when scattered. */
  x: number
  /** Top offset in workspace pixels, when scattered. */
  y: number
}

/** The piece being dragged. Its position follows the pointer in viewport pixels. */
export interface DragState {
  /** Index of the dragged piece. */
  index: number
  /** Pointer that started the drag. Other pointers are ignored. */
  pointerId: number
  /** Distance from the pointer to the piece's left edge at pointer down. */
  offsetX: number
  /** Distance from the pointer to the piece's top edge at pointer down. */
  offsetY: number
  /** Left edge of the piece in viewport pixels. */
  x: number
  /** Top edge of the piece in viewport pixels. */
  y: number
}

/** The puzzle being played. */
export interface ActiveGame {
  /** The picture and where it came from. */
  puzzle: PlayablePuzzle
  /** Grid size and label. */
  difficulty: DifficultyConfig
  /** The loaded picture. */
  image: HTMLImageElement
  /** Tab directions on horizontal seams, fixed for the whole game. */
  horizontalEdges: number[][]
  /** Tab directions on vertical seams, fixed for the whole game. */
  verticalEdges: number[][]
}

/** State and actions of one picture-puzzle game. */
export interface PuzzleGame {
  /** The puzzle being played, or `null` when the game panel is closed. */
  active: Ref<ActiveGame | null>
  /** Board geometry at the current zoom. `null` until the board has been fitted. */
  layout: Ref<JigsawLayout | null>
  /** All pieces of the current puzzle. */
  pieces: Ref<PuzzlePiece[]>
  /** Pieces waiting in the tray, excluding the one being dragged. */
  tray: ComputedRef<PuzzlePiece[]>
  /** Pieces scattered on the workspace, excluding the one being dragged. Later entries stack above earlier ones. */
  scattered: ComputedRef<PuzzlePiece[]>
  /** The piece being dragged, or `null`. */
  drag: Ref<DragState | null>
  /** Status line under the board. */
  message: Ref<string>
  /** Whether the piece for this cell has snapped into place. */
  isPlaced: (index: number) => boolean
  /** Loads the picture and starts a new game at `level`. The board is fitted by the caller via {@link PuzzleGame.fit}. */
  start: (puzzle: PlayablePuzzle, level: Difficulty) => void
  /** Fits the board to the workspace at the current zoom. */
  fit: (workspaceWidth: number) => void
  /** Zooms in or out for a wheel event and refits the board. */
  zoomBy: (deltaY: number, workspaceWidth: number) => void
  /** Starts dragging a piece on a left-button pointer down. */
  startDrag: (index: number, event: PointerEvent) => void
  /** Moves the dragged piece with the pointer. */
  moveDrag: (event: PointerEvent) => void
  /** Drops the dragged piece: snaps it into its cell, or leaves it scattered where it was released. */
  endDrag: (event: PointerEvent, board: HTMLElement, workspace: HTMLElement) => void
  /** Closes the game and clears the board. */
  close: () => void
}

/**
 * Creates the state of one picture-puzzle game. Board measurements come from the caller, so this composable never touches the DOM
 * except through the elements passed to {@link PuzzleGame.endDrag}.
 * @returns The game state and its actions.
 */
export function usePuzzleGame(): PuzzleGame {
  const active = shallowRef<ActiveGame | null>(null)
  const layout = shallowRef<JigsawLayout | null>(null)
  const pieces = ref<PuzzlePiece[]>([])
  const drag = ref<DragState | null>(null)
  const message = ref('')
  let zoom = 1
  let placed = 0

  /** Pieces in one zone, leaving out the piece under the pointer. */
  function inZone(zone: PieceZone): PuzzlePiece[] {
    const dragged = drag.value?.index
    return pieces.value.filter((piece) => piece.zone === zone && piece.index !== dragged)
  }

  const tray = computed(() => inZone('tray'))
  const scattered = computed(() => inZone('scattered'))

  /**
   * Whether a cell's piece has snapped in.
   * @param index - Cell index.
   * @returns True when the piece for `index` is placed.
   */
  function isPlaced(index: number): boolean {
    return pieces.value.some((piece) => piece.index === index && piece.zone === 'placed')
  }

  /**
   * Loads the picture, shuffles the pieces into the tray and starts with new seams.
   * @param puzzle - The picture to play.
   * @param level - Difficulty, which sets the grid size.
   */
  function start(puzzle: PlayablePuzzle, level: Difficulty): void {
    const difficulty = DIFFICULTIES[level]
    const image = new Image()
    image.onload = () => {
      const total = difficulty.rows * difficulty.columns
      active.value = { puzzle, difficulty, image, ...randomEdges(difficulty.rows, difficulty.columns) }
      zoom = 1
      placed = 0
      drag.value = null
      layout.value = null
      message.value = 'Hold the left mouse button and drag a piece onto its matching outline.'
      pieces.value = shuffle(Array.from({ length: total }, (_, index) => index)).map(
        (index): PuzzlePiece => ({ index, zone: 'tray', x: 0, y: 0 }),
      )
    }
    image.onerror = () => {
      alert('That image could not be opened. Check the image file and daily puzzle list.')
    }
    image.src = puzzle.src
  }

  function fit(workspaceWidth: number): void {
    const game = active.value
    if (!game) return
    const { rows, columns } = game.difficulty
    layout.value = {
      rows,
      columns,
      horizontalEdges: game.horizontalEdges,
      verticalEdges: game.verticalEdges,
      image: game.image,
      ...fitJigsawBoard({
        imageWidth: game.image.naturalWidth,
        imageHeight: game.image.naturalHeight,
        rows,
        columns,
        workspaceWidth,
        zoom,
      }),
    }
  }

  function zoomBy(deltaY: number, workspaceWidth: number): void {
    if (!active.value) return
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + (deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)))
    fit(workspaceWidth)
  }

  function startDrag(index: number, event: PointerEvent): void {
    const piece = pieces.value.find((item) => item.index === index)
    // A second pointer cannot take over a drag that is already running.
    if (event.button !== 0 || !piece || piece.zone === 'placed' || drag.value) return
    event.preventDefault()
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    drag.value = {
      index,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      x: rect.left,
      y: rect.top,
    }
    message.value = 'Dragging — release near the matching outline to snap the piece in place.'
  }

  function moveDrag(event: PointerEvent): void {
    const current = drag.value
    if (!current || event.pointerId !== current.pointerId) return
    current.x = event.clientX - current.offsetX
    current.y = event.clientY - current.offsetY
  }

  function endDrag(event: PointerEvent, board: HTMLElement, workspace: HTMLElement): void {
    const current = drag.value
    const game = active.value
    const currentLayout = layout.value
    if (!current || !game || !currentLayout || event.pointerId !== current.pointerId) return
    drag.value = null
    const piece = pieces.value.find((item) => item.index === current.index)
    if (!piece) return

    const size = jigsawPieceSize(currentLayout)
    const { rows, columns } = game.difficulty
    const snap = snapTarget(
      { x: current.x + size.width / 2, y: current.y + size.height / 2 },
      board.getBoundingClientRect(),
      rows,
      columns,
    )
    if (snap.target === current.index && snap.nearCenter) {
      piece.zone = 'placed'
      placed += 1
      finish(game)
      return
    }

    const origin = workspace.getBoundingClientRect()
    piece.zone = 'scattered'
    piece.x = current.x - origin.left - workspace.clientLeft + workspace.scrollLeft
    piece.y = current.y - origin.top - workspace.clientTop + workspace.scrollTop
    // Moved to the end so the dropped piece stacks above the others.
    pieces.value = [...pieces.value.filter((item) => item !== piece), piece]
    message.value = 'Piece dropped. Keep moving it until it is close to its matching outline.'
  }

  /**
   * Updates the status line after a piece snaps in, and marks the daily puzzle done when the picture is complete.
   * @param game - The game that was just played.
   */
  function finish(game: ActiveGame): void {
    const total = game.difficulty.rows * game.difficulty.columns
    if (placed !== total) {
      message.value = `${placed} of ${total} pieces placed.`
      return
    }
    if (game.puzzle.source === 'daily') {
      void markDailyCompleted()
      message.value = 'Picture complete! Your next daily puzzle will be ready tomorrow. 🎉'
    } else {
      message.value = 'Picture complete! Great work! 🎉'
    }
  }

  function close(): void {
    drag.value = null
    active.value = null
    layout.value = null
    pieces.value = []
  }

  return {
    active,
    layout,
    pieces,
    tray,
    scattered,
    drag,
    message,
    isPlaced,
    start,
    fit,
    zoomBy,
    startDrag,
    moveDrag,
    endDrag,
    close,
  }
}
