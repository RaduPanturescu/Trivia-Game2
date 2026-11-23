import { describe, expect, it } from 'vitest'
import { fitJigsawBoard, randomEdges, snapTarget } from './board'

describe('fitJigsawBoard', () => {
  it('fits the picture to the workspace width while keeping its ratio', () => {
    const board = fitJigsawBoard({ imageWidth: 1000, imageHeight: 500, rows: 5, columns: 5, workspaceWidth: 800, zoom: 1 })
    expect(board.boardWidth).toBe(740)
    expect(board.boardHeight).toBe(370)
    expect(board.cellWidth).toBe(148)
    expect(board.cellHeight).toBe(74)
    expect(board.tab).toBeCloseTo(14.8)
  })

  it('scales by zoom', () => {
    const board = fitJigsawBoard({ imageWidth: 1000, imageHeight: 500, rows: 5, columns: 5, workspaceWidth: 800, zoom: 2 })
    expect(board.boardWidth).toBe(1480)
    expect(board.boardHeight).toBe(740)
  })
})

describe('snapTarget', () => {
  const board = { left: 0, top: 0, right: 300, bottom: 300, width: 300, height: 300 }

  it('snaps to the cell under the piece centre when it is near the cell centre', () => {
    expect(snapTarget({ x: 150, y: 150 }, board, 3, 3)).toEqual({ target: 4, nearCenter: true })
  })

  it('finds the cell but does not snap when the piece is far from the cell centre', () => {
    expect(snapTarget({ x: 190, y: 150 }, board, 3, 3)).toEqual({ target: 4, nearCenter: false })
  })

  it('returns no target when the piece is well outside the board', () => {
    expect(snapTarget({ x: 400, y: 150 }, board, 3, 3)).toEqual({ target: -1, nearCenter: false })
  })
})

describe('randomEdges', () => {
  it('has rows-1 horizontal seams and columns-1 vertical seams per row', () => {
    const edges = randomEdges(3, 4, () => 0)
    expect(edges.horizontalEdges).toHaveLength(2)
    expect(edges.horizontalEdges[0]).toHaveLength(4)
    expect(edges.verticalEdges).toHaveLength(3)
    expect(edges.verticalEdges[0]).toHaveLength(3)
    expect(edges.verticalEdges[0]?.[0]).toBe(-1)
    expect(randomEdges(3, 4, () => 0.9).verticalEdges[0]?.[0]).toBe(1)
  })
})
