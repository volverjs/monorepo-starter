import { defineConfig, loadEnv } from 'vite'
import { VitePluginNode } from 'vite-plugin-node'
import AutoImport from 'unplugin-auto-import/vite'
import ESLint from 'vite-plugin-eslint'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default ({ mode }: { mode: string }) => {
    process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }

    return defineConfig({
        cacheDir: '../../node_modules/.vite/api',
        build: {
            target: 'esnext',
        },
        define: {
            __PUBLIC_PATH__: JSON.stringify(
                mode === 'production'
                    ? ''
                    : `${path.resolve(`${__dirname}/public`)}/`,
            ),
        },
        resolve: {
            alias: {
                '~/': `${path.resolve(`${__dirname}/src`)}/`,
            },
        },
        server: {
            // vite server configs, for details see [vite doc](https://vitejs.dev/config/#server-host)
            port:
                (typeof process.env.PORT === 'string'
                    ? parseInt(process.env.PORT)
                    : process.env.PORT) ?? 3000,
            strictPort: true,
        },
        plugins: [
            // https://github.com/vuejs/eslint-plugin-vue
            ESLint(),

            // https://github.com/antfu/unplugin-auto-import
            AutoImport({
                imports: [
                    { brandi: ['Container', 'injected', 'token'] },
                    { 'drizzle-orm': ['drizzle', 'eq'] },
                ],
                dts: 'src/auto-imports.d.ts',
                dirs: ['src/db', 'src/models', 'src/common', 'src/helpers'],
                eslintrc: {
                    filepath: `${path.resolve(
                        `${__dirname}`,
                    )}/.eslintrc-auto-import.json`,
                    enabled: true,
                },
            }),

            // https://github.com/axe-me/vite-plugin-node
            ...VitePluginNode({
                // Nodejs native Request adapter
                // currently this plugin support 'express', 'nest', 'koa' and 'fastify' out of box,
                // you can also pass a function if you are using other frameworks, see Custom Adapter section
                adapter: 'fastify',

                // tell the plugin where is your project entry
                appPath: './src/app.ts',

                // output format, default is 'cjs'
                outputFormat: 'es',
            }),
        ],
    })
}
