import { createRouter, createWebHashHistory } from 'vue-router'
import WelcomeView from './modules/hub/WelcomeView.vue'
import { routes as triviaRoutes } from './modules/trivia/routes'
import { routes as millionaireRoutes } from './modules/millionaire/routes'
import { routes as qotdRoutes } from './modules/qotd/routes'
import { routes as minesweeperRoutes } from './modules/minesweeper/routes'
import { routes as sudokuRoutes } from './modules/sudoku/routes'
import { routes as puzzlesRoutes } from './modules/puzzles/routes'
import { routes as wordleRoutes } from './modules/wordle/routes'
import { routes as workoutRoutes } from './modules/workout/routes'

declare module 'vue-router' {
  interface RouteMeta {
    /** Screen title. */
    title?: string
    /** Wider desktop layout, which legacy toggles with `#app.wide` (Minesweeper, Sudoku, puzzles). */
    wide?: boolean
    /** Background track that plays on this route. Defaults to `'main'`. */
    music?: 'main' | 'workout'
  }
}

/** Hash-based router. Each module contributes its own routes. */
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'welcome', component: WelcomeView },
    { path: '/hub', name: 'hub', component: () => import('./modules/hub/GameHubView.vue') },
    { path: '/settings', name: 'settings', component: () => import('./modules/hub/SettingsView.vue') },
    { path: '/profile', name: 'profile', component: () => import('./modules/hub/ProfileView.vue') },
    // Each module owns its routes file.
    ...triviaRoutes,
    ...millionaireRoutes,
    ...qotdRoutes,
    ...minesweeperRoutes,
    ...sudokuRoutes,
    ...puzzlesRoutes,
    ...wordleRoutes,
    ...workoutRoutes,
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
