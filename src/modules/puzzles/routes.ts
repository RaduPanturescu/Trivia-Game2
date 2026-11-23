import type { RouteRecordRaw } from 'vue-router'

/** Routes owned by the puzzles module. Spread into the app router in `src/router.ts`. */
export const routes: RouteRecordRaw[] = [
  { path: '/puzzles', name: 'puzzles', component: () => import('./PuzzlesView.vue'), meta: { title: 'Picture Puzzles', wide: true } },
]
