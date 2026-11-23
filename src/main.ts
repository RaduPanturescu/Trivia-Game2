import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './shared/styles/tokens.css'
import './shared/styles/base.css'

createApp(App).use(router).mount('#app')
