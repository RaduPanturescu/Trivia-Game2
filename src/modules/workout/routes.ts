import type { RouteRecordRaw } from 'vue-router'

/** Routes owned by the workout module. Spread into the app router in `src/router.ts`. */
export const routes: RouteRecordRaw[] = [
  {
    path: '/workout',
    name: 'workout',
    component: () => import('./views/WorkoutMenuView.vue'),
    meta: { title: 'Workout Program', music: 'workout' },
  },
  {
    path: '/workout/now',
    name: 'workout-now',
    component: () => import('./views/WorkoutNowView.vue'),
    meta: { title: 'Workout Now', music: 'workout' },
  },
  {
    path: '/workout/dashboard',
    name: 'workout-dashboard',
    component: () => import('./views/WorkoutDashboardView.vue'),
    meta: { title: 'Workout Dashboard', music: 'workout' },
  },
  {
    path: '/workout/health',
    name: 'workout-health',
    component: () => import('./views/HealthStatsView.vue'),
    meta: { title: 'Health Stats', wide: true, music: 'workout' },
  },
  {
    path: '/workout/stats',
    name: 'workout-stats',
    component: () => import('./views/ExerciseStatsView.vue'),
    meta: { title: 'Exercise Stats', wide: true, music: 'workout' },
  },
]
