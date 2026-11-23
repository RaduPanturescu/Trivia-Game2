import type { RouteRecordRaw } from 'vue-router'
import { isCategoryId, parseRound } from './categories'

/** Routes owned by the Category Trivia module. Spread into the app router in `src/router.ts`. */
export const routes: RouteRecordRaw[] = [
  {
    path: '/trivia',
    name: 'trivia',
    component: () => import('./TriviaMenuView.vue'),
    meta: { title: 'Category Trivia' },
  },
  {
    path: '/trivia/:category',
    name: 'trivia-difficulty',
    component: () => import('./TriviaDifficultyView.vue'),
    meta: { title: 'Category Trivia' },
    // An unknown category goes back to the menu. Personal has no difficulty, so it starts its round directly.
    beforeEnter: (to) => {
      if (!isCategoryId(to.params.category)) return { name: 'trivia' }
      if (to.params.category === 'personal') return { name: 'trivia-play', params: { category: 'personal' } }
      return undefined
    },
  },
  {
    path: '/trivia/:category/play',
    name: 'trivia-play',
    component: () => import('./TriviaGameView.vue'),
    meta: { title: 'Category Trivia' },
    // A category without a valid difficulty (or personal with one) goes back to the menu.
    beforeEnter: (to) => (parseRound(to.params.category, to.query.diff) ? undefined : { name: 'trivia' }),
  },
]
