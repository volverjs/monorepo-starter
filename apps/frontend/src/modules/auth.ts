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
        if (newSession.data?.user) {
            if (router.currentRoute.value.name === '/') {
                router.replace({ name: '/frontoffice/' })
            }
            return
        }
        if (router.currentRoute.value.name !== '/') {
            router.replace({ name: '/' })
        }
    })

    router.beforeEach(async (to, _from, next) => {
        if (session.value.isPending) {
            await until(() => !session.value.isPending).toBe(true)
        }
        if (!session.value.data?.user && to.name !== '/') {
            next({ name: '/' })
            return
        }
        if (session.value.data?.user && to.name === '/') {
            next({ name: '/frontoffice/' })
            return
        }
        next()
    })
}
