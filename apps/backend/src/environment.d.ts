declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production'
            PORT?: number | string
            VITE_DATABASE_URL: string
            VITE_BLOB_STORAGE_ACCOUNT: string
            VITE_BLOB_STORAGE_KEY: string
            VITE_BLOB_STORAGE_CONTAINER: string
            VITE_MICROSOFT_TENANT_ID: string
            VITE_MICROSOFT_CLIENT_ID: string
            VITE_MICROSOFT_CLIENT_SECRET: string
            VITE_MICROSOFT_SCOPE: string
            VITE_KEYVAULT_URL: string
            VITE_OAUTH_URL: string
            VITE_OAUTH_ISSUER_URL: string
        }
    }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
