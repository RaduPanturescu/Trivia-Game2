/** Geometry of one board at the current zoom. Every piece and slot outline is drawn from the same layout. */
export interface JigsawLayout {
  /** Rows in the grid. */
  rows: number
  /** Columns in the grid. */
  columns: number
  /** Tab direction (-1 or 1) on each horizontal seam, indexed `[row][column]`; there are `rows - 1` rows. */
  horizontalEdges: number[][]
  /** Tab direction (-1 or 1) on each vertical seam, indexed `[row][column]`; there are `columns - 1` columns. */
  verticalEdges: number[][]
  /** The picture. Each piece clips its part from it. */
  image: HTMLImageElement
  /** Width of the whole board in CSS pixels at the current zoom. */
  boardWidth: number
  /** Height of the whole board in CSS pixels at the current zoom. */
  boardHeight: number
  /** Width of one grid cell, without tabs. */
  cellWidth: number
  /** Height of one grid cell, without tabs. */
  cellHeight: number
  /** How far a tab sticks out of a cell edge, in pixels. */
  tab: number
}

/**
 * Size of the canvas that holds one piece or outline: the cell plus a tab on every side, rounded up.
 * @param layout - The board layout.
 * @returns The canvas width and height in pixels.
 */
export function jigsawPieceSize(layout: JigsawLayout): { width: number; height: number } {
  return {
    width: Math.ceil(layout.cellWidth + layout.tab * 2),
    height: Math.ceil(layout.cellHeight + layout.tab * 2),
  }
}

/**
 * Draws the empty-slot outline of one cell on a canvas that is already sized with {@link jigsawPieceSize}.
 * @param context - 2D context of the outline canvas.
 * @param layout - The board layout.
 * @param index - Cell index, row-major.
 */
export function drawJigsawOutline(context: CanvasRenderingContext2D, layout: JigsawLayout, index: number): void {
  const { row, column } = cellOf(layout, index)
  context.clearRect(0, 0, context.canvas.width, context.canvas.height)
  tracePath(context, layout, row, column)
  context.lineJoin = 'round'
  context.lineWidth = Math.max(1.2, layout.tab * 0.08)
  // Keep the empty-slot guide visible on the dark workspace while retaining the classic outline.
  context.strokeStyle = 'rgba(226, 238, 255, 0.52)'
  context.stroke()
}

/**
 * Draws one piece: the picture clipped to the piece's jigsaw shape, then its dark edge. The canvas must be sized with {@link jigsawPieceSize}.
 * @param context - 2D context of the piece canvas.
 * @param layout - The board layout.
 * @param index - Cell index, row-major.
 */
export function drawJigsawPiece(context: CanvasRenderingContext2D, layout: JigsawLayout, index: number): void {
  const { row, column } = cellOf(layout, index)
  context.clearRect(0, 0, context.canvas.width, context.canvas.height)
  context.save()
  tracePath(context, layout, row, column)
  context.clip()
  context.drawImage(
    layout.image,
    layout.tab - column * layout.cellWidth,
    layout.tab - row * layout.cellHeight,
    layout.boardWidth,
    layout.boardHeight,
  )
  context.restore()
  tracePath(context, layout, row, column)
  context.lineJoin = 'round'
  context.lineWidth = Math.max(1.25, layout.tab * 0.09)
  context.strokeStyle = 'rgba(18, 22, 30, 0.78)'
  context.shadowColor = 'rgba(0, 0, 0, 0.4)'
  context.shadowBlur = 3
  context.stroke()
}

/**
 * Returns the point at fraction `t` along an edge, pushed `outward` pixels along the edge normal.
 * @returns The `[x, y]` point.
 */
function pointOnEdge(
  startX: number,
  startY: number,
  unitX: number,
  unitY: number,
  normalX: number,
  normalY: number,
  length: number,
  t: number,
  outward: number,
): [number, number] {
  return [
    startX + unitX * length * t + normalX * outward,
    startY + unitY * length * t + normalY * outward,
  ]
}

/**
 * Traces one cell edge. A polarity of 0 is a straight seam; otherwise the seam bulges as a tab in the direction of `polarity`.
 * @param context - Canvas context with the path in progress.
 * @param start - Edge start point.
 * @param end - Edge end point.
 * @param normal - Unit normal pointing outward from the cell.
 * @param polarity - -1, 1 or 0.
 * @param tab - Tab size in pixels.
 */
function traceEdge(
  context: CanvasRenderingContext2D,
  start: [number, number],
  end: [number, number],
  normal: [number, number],
  polarity: number,
  tab: number,
): void {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const length = Math.hypot(dx, dy)
  const unitX = dx / length
  const unitY = dy / length
  const [nx, ny] = normal
  const p = (t: number, amount: number) =>
    pointOnEdge(start[0], start[1], unitX, unitY, nx, ny, length, t, amount * polarity * tab)
  if (!polarity) {
    context.lineTo(end[0], end[1])
    return
  }
  // Classic jigsaw profile: a narrow neck opens into a smooth, rounded circular knob.
  context.lineTo(...p(0.34, 0))
  context.bezierCurveTo(...p(0.38, 0), ...p(0.39, 0.08), ...p(0.4, 0.08))
  context.bezierCurveTo(...p(0.42, 0.08), ...p(0.41, 0.55), ...p(0.43, 0.55))
  context.bezierCurveTo(...p(0.43, 1.45), ...p(0.57, 1.45), ...p(0.57, 0.55))
  context.bezierCurveTo(...p(0.57, 0.08), ...p(0.59, 0.08), ...p(0.6, 0.08))
  context.bezierCurveTo(...p(0.61, 0.08), ...p(0.62, 0), ...p(0.66, 0))
  context.lineTo(end[0], end[1])
}

/**
 * Builds the closed jigsaw outline of one cell. Each side takes its polarity from the neighbouring cell so the two pieces interlock.
 * @param context - Canvas context.
 * @param layout - The board layout.
 * @param row - Cell row.
 * @param column - Cell column.
 */
function tracePath(context: CanvasRenderingContext2D, layout: JigsawLayout, row: number, column: number): void {
  const { rows, columns, horizontalEdges, verticalEdges, cellWidth, cellHeight, tab } = layout
  const topPolarity = row === 0 ? 0 : -edgeAt(horizontalEdges, row - 1, column)
  const rightPolarity = column === columns - 1 ? 0 : edgeAt(verticalEdges, row, column)
  const bottomPolarity = row === rows - 1 ? 0 : edgeAt(horizontalEdges, row, column)
  const leftPolarity = column === 0 ? 0 : -edgeAt(verticalEdges, row, column - 1)
  const left = tab
  const top = tab
  const right = tab + cellWidth
  const bottom = tab + cellHeight
  context.beginPath()
  context.moveTo(left, top)
  traceEdge(context, [left, top], [right, top], [0, -1], topPolarity, tab)
  traceEdge(context, [right, top], [right, bottom], [1, 0], rightPolarity, tab)
  traceEdge(context, [right, bottom], [left, bottom], [0, 1], bottomPolarity, tab)
  traceEdge(context, [left, bottom], [left, top], [-1, 0], leftPolarity, tab)
  context.closePath()
}

/**
 * Reads one seam value, treating a missing entry as a straight edge.
 * @param edges - Seam table.
 * @param row - Row index.
 * @param column - Column index.
 * @returns The polarity, or 0 when out of range.
 */
function edgeAt(edges: readonly number[][], row: number, column: number): number {
  return edges[row]?.[column] ?? 0
}

/**
 * Converts a row-major cell index into its row and column.
 * @param layout - The board layout.
 * @param index - Cell index.
 * @returns The cell's row and column.
 */
function cellOf(layout: JigsawLayout, index: number): { row: number; column: number } {
  return { row: Math.floor(index / layout.columns), column: index % layout.columns }
}
