import type { RouteRecordRaw } from 'vue-router'

/** Routes owned by the wordle module. Spread into the app router in `src/router.ts`. */
export const routes: RouteRecordRaw[] = [
  { path: '/wordle', name: 'wordle', component: () => import('./WordleView.vue'), meta: { title: 'Wordle' } },
]
