import type { RouteRecordRaw } from 'vue-router'
import { contestantName } from './session'

/** Routes owned by the Millionaire module. Spread into the app router in `src/router.ts`. */
export const routes: RouteRecordRaw[] = [
  {
    path: '/millionaire',
    name: 'millionaire',
    component: () => import('./MillionaireTitleView.vue'),
    meta: { title: 'Millionaire' },
  },
  {
    path: '/millionaire/register',
    name: 'millionaire-register',
    component: () => import('./MillionaireRegisterView.vue'),
    meta: { title: 'Millionaire' },
  },
  {
    path: '/millionaire/play',
    name: 'millionaire-play',
    component: () => import('./MillionaireGameView.vue'),
    meta: { title: 'Millionaire' },
    // The game needs a contestant name. Without one, go back to registration.
    beforeEnter: () => (contestantName.value ? undefined : { name: 'millionaire-register' }),
  },
]
