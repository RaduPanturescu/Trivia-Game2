import type { RouteRecordRaw } from 'vue-router'

/** Routes owned by the minesweeper module. Spread into the app router in `src/router.ts`. */
export const routes: RouteRecordRaw[] = [
  {
    path: '/minesweeper',
    name: 'minesweeper',
    component: () => import('./MinesweeperSizeView.vue'),
    meta: { title: 'Minesweeper', wide: true },
  },
  {
    path: '/minesweeper/play',
    name: 'minesweeper-play',
    component: () => import('./MinesweeperGameView.vue'),
    meta: { title: 'Minesweeper', wide: true },
  },
]
