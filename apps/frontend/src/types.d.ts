import type { App } from 'vue'
import type { Router } from 'vue-router'
import type { HeadClient } from '@unhead/vue/client'
import type { Pinia } from 'pinia'
import type { Action, Subject } from 'ability'

interface AppContext<HasRouter extends boolean = true> {
    app: App<Element>
    router: HasRouter extends true ? Router : undefined
    head: HeadClient | undefined
    store: Pinia
}

export type AppModule = (ctx: AppContext) => void

export type ProblemJson<TAdditionalData = unknown> = {
    type: string
    title: string
    status: number
    detail: string
    additionalData: TAdditionalData
}

declare module 'vue-router' {
    interface RouteMeta {
        /** Reachable signed out */
        isPublic?: boolean
        /** Rendered with the `sidebar` named view */
        hasSidebar?: boolean
        /**
         * The ability a signed-in user needs, checked by the guard in
         * `modules/auth.ts` (a miss goes to the frontoffice). Children inherit
         * it. The API refuses on its own: this only keeps the page away.
         */
        can?: [Action, Subject]
    }
}
