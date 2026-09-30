/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_VERSION?: string
    readonly VITE_APP_NAME?: string
    readonly VITE_APP_SHORT_NAME?: string
    readonly VITE_APP_TAGLINE?: string
    readonly VITE_APP_DESCRIPTION?: string
    readonly VITE_BACKEND_URL?: string
    readonly VITE_I18N_DEFAULT_LOCALE?: string
    readonly VITE_FEATURE_THEMES?: string
    readonly VITE_AUTH_SOCIAL_PROVIDERS?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
