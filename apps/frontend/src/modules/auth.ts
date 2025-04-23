import { createAuthClient } from 'better-auth/vue'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { adminClient } from 'better-auth/client/plugins'
import type { AppModule } from '~/types'
import type { auth } from 'auth'

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    basePath: 'auth',
    plugins: [inferAdditionalFields<typeof auth>(), adminClient()],
})

export const install: AppModule = async ({ router }) => {
    const session = authClient.useSession()

    watch(session, (newSession) => {
        if (newSession.isPending) {
            return
        }
        if (!router.currentRoute.value.name) {
            return
        }
        if (newSession.data?.user) {
            if (router.currentRoute.value.name.includes('/auth/')) {
                router.replace({ name: '/frontoffice/' })
            }
            return
        }
        if (!router.currentRoute.value.meta.isPublic) {
            router.replace({ name: '/' })
        }
    })

    router.beforeEach(async (to, _from, next) => {
        if (session.value.isPending) {
            await until(() => !session.value.isPending).toBe(true)
        }
        if (
            !session.value.data?.user &&
            !to.meta?.isPublic &&
            !to.name.includes('/auth/')
        ) {
            next({ name: '/auth/' })
            return
        }
        if (session.value.data?.user && to.name.includes('/auth/')) {
            next({ name: '/frontoffice/' })
            return
        }
        next()
    })
}
