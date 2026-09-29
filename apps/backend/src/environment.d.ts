declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV?: 'development' | 'production' | 'test'
            PORT?: string
            DATABASE_URL: string
            BETTER_AUTH_SECRET?: string
            BETTER_AUTH_URL?: string
            FRONTEND_URL?: string
            MICROSOFT_TENANT_ID?: string
            MICROSOFT_CLIENT_ID?: string
            MICROSOFT_CLIENT_SECRET?: string
            GOOGLE_CLIENT_ID?: string
            GOOGLE_CLIENT_SECRET?: string
            GITHUB_CLIENT_ID?: string
            GITHUB_CLIENT_SECRET?: string
            FACEBOOK_CLIENT_ID?: string
            FACEBOOK_CLIENT_SECRET?: string
            SMTP_HOST?: string
            SMTP_PORT?: string
            SMTP_SECURE?: string
            SMTP_AUTH_USERNAME?: string
            SMTP_AUTH_PASSWORD?: string
            EMAIL_FROM?: string
            EMAIL_REPLY_TO?: string
        }
    }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
