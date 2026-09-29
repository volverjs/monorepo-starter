import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import VueRouter from 'vue-router/vite'
import ESLint from '@nabla/vite-plugin-eslint'
import Stylelint from 'vite-plugin-stylelint'
import Components from 'unplugin-vue-components/vite'
import { VolverResolver } from '@volverjs/ui-vue/resolvers/unplugin'
import AutoImport from 'unplugin-auto-import/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { VueRouterAutoImports } from 'vue-router/unplugin'
import packageJson from '../../package.json' with { type: 'json' }
import type { PackageJson } from 'type-fest'
import webfontDownload from 'vite-plugin-webfont-dl'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '')

    // Without it the auth client and the HttpClient call the frontend's own
    // origin: the build succeeds and the app cannot sign anyone in.
    if (command === 'build' && !env.VITE_BACKEND_URL) {
        console.warn(
            `\n[frontend] VITE_BACKEND_URL is empty for mode "${mode}": set it in apps/frontend/.env.${mode}\n`,
        )
    }

    return {
        define: {
            'import.meta.env.VITE_APP_VERSION': JSON.stringify(
                (packageJson as PackageJson).version,
            ),
        },
        resolve: {
            alias: {
                '~/': `${path.resolve(import.meta.dirname, 'src')}/`,
                'style/settings': `${path.resolve(import.meta.dirname, '../../packages/style/settings')}`,
            },
        },
        plugins: [
            // https://github.com/liuweiGL/vite-plugin-mkcert
            mkcert(),

            // https://router.vuejs.org/file-based-routing/
            VueRouter({
                importMode: 'async',
                exclude: ['**/_*.vue', '**/_components/**'],
                dts: 'src/typed-router.d.ts',
            }),

            // https://github.com/vitejs/vite-plugin-vue
            Vue(),

            // https://github.com/intlify/bundle-tools/tree/main/packages/unplugin-vue-i18n
            VueI18n({
                defaultSFCLang: 'json',
                runtimeOnly: false,
            }),

            // https://github.com/nabla/vite-plugin-eslint
            ESLint(),

            // https://github.com/ModyQyW/vite-plugin-stylelint
            Stylelint(),

            // https://github.com/antfu/unplugin-vue-components
            Components({
                extensions: ['vue'],
                // allow auto import and register components
                include: [/\.vue$/, /\.vue\?vue/],
                dts: 'src/components.d.ts',
                exclude: [
                    /[\\/]ui-vue[\\/]/,
                    /[\\/]\.git[\\/]/,
                    /[\\/]\.nuxt[\\/]/,
                ],
                resolvers: [
                    VolverResolver({
                        importStyle: false,
                        directives: true,
                    }),
                    // monorepo components packages resolver
                    (name) => {
                        if (name.startsWith('Pk')) {
                            return {
                                name,
                                from: 'components',
                            }
                        }
                    },
                ],
            }),

            // https://github.com/antfu/unplugin-auto-import
            AutoImport({
                imports: [
                    'vue',
                    'vue-i18n',
                    '@vueuse/core',
                    'pinia',
                    VueRouterAutoImports,
                ],
                dts: 'src/auto-imports.d.ts',
                dirs: [
                    'src/composables',
                    'src/stores',
                    'src/common',
                    'src/models',
                    'src/repositories',
                    'src/constants',
                ],
                vueTemplate: true,
                eslintrc: {
                    enabled: true,
                },
            }),

            // https://github.com/antfu/vite-plugin-pwa
            VitePWA({
                registerType: 'prompt',
                includeAssets: ['favicon.svg'],
                manifest: {
                    name: env.VITE_APP_NAME,
                    short_name: env.VITE_APP_SHORT_NAME,
                    description: env.VITE_APP_DESCRIPTION,
                    theme_color: '#ffffff',
                    icons: [
                        {
                            src: '/pwa-192x192.png',
                            sizes: '192x192',
                            type: 'image/png',
                        },
                        {
                            src: '/pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'any',
                        },
                        {
                            src: '/pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'maskable',
                        },
                    ],
                },
            }),

            // https://github.com/feat-agency/vite-plugin-webfont-dl
            webfontDownload([
                'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap',
            ]),
        ],

        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: `@use "style/settings" as *;`,
                    api: 'modern',
                },
            },
        },

        optimizeDeps: {
            exclude: [
                '@iconify/vue',
                '@volverjs/ui-vue/vv-input-text',
                '@volverjs/ui-vue/vv-checkbox',
                '@volverjs/ui-vue/vv-checkbox-group',
                '@volverjs/ui-vue/vv-combobox',
                '@volverjs/ui-vue/vv-radio',
                '@volverjs/ui-vue/vv-radio-group',
                '@volverjs/ui-vue/vv-select',
                '@volverjs/ui-vue/vv-textarea',
            ],
        },

        server: {
            port: 8080,
        },
    }
})
