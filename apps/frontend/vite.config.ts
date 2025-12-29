import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import VueRouter from 'unplugin-vue-router/vite'
import ESLint from '@nabla/vite-plugin-eslint'
import Stylelint from 'vite-plugin-stylelint'
import Components from 'unplugin-vue-components/vite'
import { VolverResolver } from '@volverjs/ui-vue/resolvers/unplugin'
import AutoImport from 'unplugin-auto-import/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import packageJson from '../../package.json'
import type { PackageJson } from 'type-fest'
import webfontDownload from 'vite-plugin-webfont-dl'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    return {
        define: {
            'import.meta.env.VITE_APP_VERSION': JSON.stringify(
                (packageJson as PackageJson).version,
            ),
        },
        resolve: {
            alias: {
                '~/': `${path.resolve(__dirname, 'src')}/`,
                'style/settings': `${path.resolve(__dirname, '../../packages/style/settings')}`,
            },
        },
        plugins: [
            // https://github.com/liuweiGL/vite-plugin-mkcert
            mkcert(),

            // https://github.com/posva/unplugin-vue-router
            VueRouter({
                importMode: 'async',
                exclude: ['**/_*.vue', '**/_components/**'],
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
                        if (name.startsWith('Pk'))
                            return {
                                name,
                                from: 'components',
                            }
                    },
                ],
            }),

            // https://github.com/antfu/unplugin-auto-import
            AutoImport({
                imports: [
                    'vue',
                    'vue-i18n',
                    '@vueuse/head',
                    '@vueuse/core',
                    'pinia',
                    VueRouterAutoImports,
                ],
                dts: 'src/auto-imports.d.ts',
                dirs: [
                    'src/composables',
                    'src/store',
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

        build: {
            rollupOptions: {
                external: [],
            },
        },
    }
})
