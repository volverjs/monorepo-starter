import { type BetterAuthOptions, betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization, admin, openAPI } from 'better-auth/plugins'
import { database } from 'database'
import { sendResetPassword } from 'email'

export const config: BetterAuthOptions = {
    database: drizzleAdapter(database, {
        provider: 'pg',
    }),
    secret: process.env.VITE_BETTER_AUTH_SECRET,
    user: {
        additionalFields: {
            role: {
                type: 'string',
                defaultValue: 'user',
                input: false,
                required: false,
            },
        },
    },
    plugins: [admin(), organization(), openAPI()],
    baseURL: process.env.VITE_BETTER_AUTH_URL,
    basePath: '/auth',
    trustedOrigins: process.env.VITE_FRONTEND_URL
        ? [process.env.VITE_FRONTEND_URL]
        : undefined,
    emailAndPassword: {
        enabled: true,
        sendResetPassword,
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
        google:
            process.env.VITE_GOOGLE_CLIENT_ID &&
            process.env.VITE_GOOGLE_CLIENT_SECRET
                ? {
                      clientId: process.env.VITE_GOOGLE_CLIENT_ID,
                      clientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET,
                  }
                : undefined,
        github:
            process.env.VITE_GITHUB_CLIENT_ID &&
            process.env.VITE_GITHUB_CLIENT_SECRET
                ? {
                      clientId: process.env.VITE_GITHUB_CLIENT_ID,
                      clientSecret: process.env.VITE_GITHUB_CLIENT_SECRET,
                  }
                : undefined,
        facebook:
            process.env.VITE_FACEBOOK_CLIENT_ID &&
            process.env.VITE_FACEBOOK_CLIENT_SECRET
                ? {
                      clientId: process.env.VITE_FACEBOOK_CLIENT_ID,
                      clientSecret: process.env.VITE_FACEBOOK_CLIENT_SECRET,
                  }
                : undefined,
    },
    advanced: {
        database: {
            generateId: 'uuid',
        },
        defaultCookieAttributes: {
            secure: true,
            httpOnly: true,
            sameSite: 'none',
            partitioned: true,
        },
    },
}

export const auth = betterAuth(config)
export type Session = typeof auth.$Infer.Session
