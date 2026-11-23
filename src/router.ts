import { createRouter, createWebHashHistory } from 'vue-router'
import WelcomeView from './modules/hub/WelcomeView.vue'

/**
 * Hash-based router for the app. One route per legacy screen; only the welcome
 * placeholder exists during the scaffold phase.
 */
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/', name: 'welcome', component: WelcomeView }],
})
