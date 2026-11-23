import type { RouteRecordRaw } from 'vue-router'
import { parseSudokuPlayQuery } from './difficulties'

/** Routes owned by the Sudoku module. Spread into the app router in `src/router.ts`. */
export const routes: RouteRecordRaw[] = [
  {
    path: '/sudoku',
    name: 'sudoku',
    component: () => import('./SudokuSizeView.vue'),
    meta: { title: 'Sudoku', wide: true },
  },
  {
    path: '/sudoku/play',
    name: 'sudoku-play',
    component: () => import('./SudokuGameView.vue'),
    meta: { title: 'Sudoku', wide: true },
    // An unknown difficulty, or a custom game without a valid clue count, goes back to the picker.
    beforeEnter: (to) => (parseSudokuPlayQuery(to.query) ? undefined : { name: 'sudoku' }),
  },
]
