import { createApp } from 'vue'
import { createHead } from '@vueuse/head'
import type { Router } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router/auto'
import { routes } from 'vue-router/auto-routes'
import type { AppModule } from '~/types'
import App from '~/App.vue'
import { logger } from '~/utils/Logger'

const app = createApp(App)

// setup router
const router = createRouter({
    history: createWebHistory(),
    linkActiveClass: 'selected',
    linkExactActiveClass: 'current',
    scrollBehavior() {
        document.getElementById('main')?.scroll({
            top: 0,
            behavior: 'smooth',
        })
    },
    routes,
})
app.use(router)

// setup head
const head = createHead()
app.use(head)

// setup store
const store = createPinia()
app.use(store)

// install all modules under `modules/`
Promise.all(
    Object.values(
        import.meta.glob<{ install: AppModule }>('./modules/*.ts', {
            eager: true,
        }),
    ).map((i) =>
        Promise.resolve(
            i.install?.({ app, router: router as Router, head, store }),
        ),
    ),
)
    .then(() => {
        logger.log('All modules installed')
    })
    .catch((e) => {
        logger.error(e)
    })

app.mount('#app')
