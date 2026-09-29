import { buildServer } from './app'

if (!process.env.DATABASE_URL) {
    throw new Error(
        'DATABASE_URL is not set: see apps/backend/.env and put the value in .env.local',
    )
}

// Entry point. In development vite-plugin-node serves the instance exported as
// `viteNodeApp`; the production build (`node main.js`) has to listen itself.
export const viteNodeApp = buildServer().then(async (server) => {
    if (import.meta.env.PROD) {
        const port = Number(process.env.PORT ?? 8080)
        await server.listen({ port, host: '0.0.0.0' })
    }
    return server
})

viteNodeApp.catch((error: unknown) => {
    // A boot failure must stop the process, so the orchestrator restarts it.
    console.error('Backend failed to start', error)
    process.exit(1)
})
