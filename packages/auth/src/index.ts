import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization, admin, openAPI } from 'better-auth/plugins'
import { database } from 'database'

export const auth = betterAuth({
    database: drizzleAdapter(database, {
        provider: 'pg',
    }),
    user: {
        additionalFields: {
            role: {
                type: 'string',
            },
        },
    },
    plugins: [admin(), organization(), openAPI()],
    basePath: '/auth',
    trustedOrigins: ['http://localhost:8080'],
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        microsoft:
            process.env.VITE_MICROSOFT_TENANT_ID &&
            process.env.VITE_MICROSOFT_CLIENT_ID &&
            process.env.VITE_MICROSOFT_CLIENT_SECRET
                ? {
                      tenantId: process.env.VITE_MICROSOFT_TENANT_ID,
                      clientId: process.env.VITE_MICROSOFT_CLIENT_ID,
                      clientSecret: process.env.VITE_MICROSOFT_CLIENT_SECRET,
                  }
                : undefined,
    },
    advanced: {
        generateId: false,
    },
})

export type Session = typeof auth.$Infer.Session
