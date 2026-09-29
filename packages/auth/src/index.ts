import { type BetterAuthOptions, betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization, admin, openAPI } from 'better-auth/plugins'
import { database } from 'database'
import { sendResetPassword } from 'email'

// `satisfies`, not a type annotation: annotating widens the plugins to the base
// interface and erases their endpoints (admin, organization, openAPI) and the
// additional `role` field from `auth.api` and from the inferred client.
export const config = {
    database: drizzleAdapter(database, {
        provider: 'pg',
    }),
    secret: process.env.BETTER_AUTH_SECRET,
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
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ['microsoft', 'google', 'github', 'facebook'],
        },
    },
    plugins: [admin(), organization(), openAPI()],
    baseURL: process.env.BETTER_AUTH_URL,
    basePath: '/auth',
    trustedOrigins: process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL]
        : undefined,
    emailAndPassword: {
        enabled: true,
        sendResetPassword,
    },
    socialProviders: {
        microsoft:
            process.env.MICROSOFT_TENANT_ID &&
            process.env.MICROSOFT_CLIENT_ID &&
            process.env.MICROSOFT_CLIENT_SECRET
                ? {
                      tenantId: process.env.MICROSOFT_TENANT_ID,
                      clientId: process.env.MICROSOFT_CLIENT_ID,
                      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
                  }
                : undefined,
        google:
            process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
                ? {
                      clientId: process.env.GOOGLE_CLIENT_ID,
                      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                  }
                : undefined,
        github:
            process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
                ? {
                      clientId: process.env.GITHUB_CLIENT_ID,
                      clientSecret: process.env.GITHUB_CLIENT_SECRET,
                  }
                : undefined,
        facebook:
            process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
                ? {
                      clientId: process.env.FACEBOOK_CLIENT_ID,
                      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
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
} satisfies BetterAuthOptions

export const auth = betterAuth(config)
export type Session = typeof auth.$Infer.Session
export type User = Session['user']
