import type { RouteRecordRaw } from 'vue-router'

/** Routes owned by the Question of the Day module. Spread into the app router in `src/router.ts`. */
export const routes: RouteRecordRaw[] = [
  {
    path: '/qotd',
    name: 'qotd',
    component: () => import('./QotdView.vue'),
    meta: { title: 'Question of the Day' },
  },
]
