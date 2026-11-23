import type { CSSProperties } from 'vue'
import type { JigsawLayout } from './jigsaw'

/** Size of a board after fitting the picture into the workspace and applying zoom. */
export interface FittedBoard {
  /** Board width in pixels. */
  boardWidth: number
  /** Board height in pixels. */
  boardHeight: number
  /** Cell width in pixels, without tabs. */
  cellWidth: number
  /** Cell height in pixels, without tabs. */
  cellHeight: number
  /** Tab size in pixels. */
  tab: number
}

/** Input to {@link fitJigsawBoard}. */
export interface FitOptions {
  /** Natural width of the picture. */
  imageWidth: number
  /** Natural height of the picture. */
  imageHeight: number
  /** Rows in the grid. */
  rows: number
  /** Columns in the grid. */
  columns: number
  /** Width of the workspace in pixels. */
  workspaceWidth: number
  /** Current zoom factor. */
  zoom: number
}

/** The part of a DOM rectangle that snapping needs. */
export type BoardRect = Pick<DOMRectReadOnly, 'left' | 'top' | 'right' | 'bottom' | 'width' | 'height'>

/** Result of {@link snapTarget}. */
export interface SnapResult {
  /** Row-major index of the cell under the piece centre, or -1 when the piece is off the board. */
  target: number
  /** True when the piece centre is close enough to the cell centre to snap in. */
  nearCenter: boolean
}

/**
 * Fits the picture into the workspace, keeping its ratio, then scales by zoom. Matches the legacy sizing rules.
 * @param options - Picture size, grid size, workspace width and zoom.
 * @returns The board size, cell size and tab size in pixels.
 */
export function fitJigsawBoard(options: FitOptions): FittedBoard {
  const { imageWidth, imageHeight, rows, columns, workspaceWidth, zoom } = options
  const maxWidth = Math.max(220, Math.min(740, workspaceWidth - 48))
  const fit = Math.min(maxWidth / imageWidth, 460 / imageHeight)
  const fittedWidth = Math.max(columns * 18, Math.round(imageWidth * fit))
  const fittedHeight = Math.max(rows * 18, Math.round(imageHeight * fit))
  const boardWidth = Math.round(fittedWidth * zoom)
  const boardHeight = Math.round(fittedHeight * zoom)
  const cellWidth = boardWidth / columns
  const cellHeight = boardHeight / rows
  const tab = Math.max(5, Math.min(cellWidth, cellHeight) * 0.2)
  return { boardWidth, boardHeight, cellWidth, cellHeight, tab }
}

/**
 * Finds the cell a dropped piece belongs to. A piece snaps only when its centre is within 30% of a cell's shorter side from the cell centre.
 * @param center - Piece centre in viewport pixels.
 * @param board - Board rectangle in viewport pixels.
 * @param rows - Rows in the grid.
 * @param columns - Columns in the grid.
 * @returns The nearest cell index and whether the piece is close enough to snap.
 */
export function snapTarget(center: { x: number; y: number }, board: BoardRect, rows: number, columns: number): SnapResult {
  const cellWidth = board.width / columns
  const cellHeight = board.height / rows
  const inside =
    center.x >= board.left - cellWidth * 0.5 &&
    center.x <= board.right + cellWidth * 0.5 &&
    center.y >= board.top - cellHeight * 0.5 &&
    center.y <= board.bottom + cellHeight * 0.5
  if (!inside) return { target: -1, nearCenter: false }
  const column = clamp(Math.round((center.x - board.left) / cellWidth - 0.5), 0, columns - 1)
  const row = clamp(Math.round((center.y - board.top) / cellHeight - 0.5), 0, rows - 1)
  const slotX = board.left + (column + 0.5) * cellWidth
  const slotY = board.top + (row + 0.5) * cellHeight
  const nearCenter = Math.hypot(center.x - slotX, center.y - slotY) <= Math.min(cellWidth, cellHeight) * 0.3
  return { target: row * columns + column, nearCenter }
}

/**
 * Picks a random tab direction for every seam of a grid.
 * @param rows - Rows in the grid.
 * @param columns - Columns in the grid.
 * @param random - Source of numbers in [0, 1). Defaults to `Math.random`.
 * @returns Horizontal seams (`rows - 1` rows) and vertical seams (`rows` rows of `columns - 1`).
 */
export function randomEdges(
  rows: number,
  columns: number,
  random: () => number = Math.random,
): Pick<JigsawLayout, 'horizontalEdges' | 'verticalEdges'> {
  const sign = () => (random() < 0.5 ? -1 : 1)
  return {
    horizontalEdges: Array.from({ length: rows - 1 }, () => Array.from({ length: columns }, sign)),
    verticalEdges: Array.from({ length: rows }, () => Array.from({ length: columns - 1 }, sign)),
  }
}

/**
 * Inline styles for the board and the piece tray, so the grid matches the layout.
 * @param layout - The board layout.
 * @returns Style objects for the board element and the tray element.
 */
export function layoutStyles(layout: JigsawLayout): { board: CSSProperties; tray: CSSProperties } {
  const { rows, columns, boardWidth, boardHeight, cellWidth, tab } = layout
  const pieceWidth = cellWidth + tab * 2
  return {
    board: {
      width: `${boardWidth}px`,
      height: `${boardHeight}px`,
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      '--jigsaw-tab': `${tab}px`,
    } as CSSProperties,
    tray: {
      gridTemplateColumns: `repeat(${columns}, ${pieceWidth}px)`,
      width: `${columns * pieceWidth + (columns - 1) * 5 + 20}px`,
    },
  }
}

/**
 * Clamps a number into an inclusive range.
 * @param value - Number to clamp.
 * @param min - Lower bound.
 * @param max - Upper bound.
 * @returns `value` limited to [min, max].
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
