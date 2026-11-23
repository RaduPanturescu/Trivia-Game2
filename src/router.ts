import { createRouter, createWebHashHistory } from 'vue-router'
import WelcomeView from './modules/hub/WelcomeView.vue'
import ComingSoonView from './modules/hub/ComingSoonView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** Screen title. Shown by ComingSoonView for ports that are not done yet. */
    title?: string
    /** Wider desktop layout, which legacy toggles with `#app.wide` (Minesweeper, Sudoku, puzzles). */
    wide?: boolean
    /** Background track that plays on this route. Defaults to `'main'`. */
    music?: 'main' | 'workout'
  }
}

/**
 * Hash-based router. One route per legacy screen. Routes not yet ported
 * render ComingSoonView with their title from `meta`.
 */
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'welcome', component: WelcomeView },
    { path: '/hub', name: 'hub', component: () => import('./modules/hub/GameHubView.vue') },
    { path: '/settings', name: 'settings', component: () => import('./modules/hub/SettingsView.vue') },
    { path: '/profile', name: 'profile', component: () => import('./modules/hub/ProfileView.vue') },
    { path: '/trivia', name: 'trivia', component: ComingSoonView, meta: { title: 'Category Trivia' } },
    { path: '/millionaire', name: 'millionaire', component: ComingSoonView, meta: { title: 'Who Wants to Be a Millionaire' } },
    { path: '/qotd', name: 'qotd', component: ComingSoonView, meta: { title: 'Question of the Day' } },
    { path: '/minesweeper', name: 'minesweeper', component: ComingSoonView, meta: { title: 'Minesweeper', wide: true } },
    { path: '/sudoku', name: 'sudoku', component: ComingSoonView, meta: { title: 'Sudoku', wide: true } },
    { path: '/puzzles', name: 'puzzles', component: ComingSoonView, meta: { title: 'Picture Puzzles', wide: true } },
    { path: '/wordle', name: 'wordle', component: ComingSoonView, meta: { title: 'Wordle' } },
    { path: '/workout', name: 'workout', component: ComingSoonView, meta: { title: 'Workout Program', music: 'workout' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
