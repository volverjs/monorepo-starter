import type { App } from 'vue'
import type { Router } from 'vue-router'
import type { HeadClient } from '@vueuse/head'
import type { Pinia } from 'pinia'

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
