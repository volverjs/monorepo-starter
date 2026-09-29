import pluginJs from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import pluginVueI18n from '@intlify/eslint-plugin-vue-i18n'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import autoImportsFrontend from './apps/frontend/.eslintrc-auto-import.json' with { type: 'json' }
import autoImportsBackend from './apps/backend/.eslintrc-auto-import.json' with { type: 'json' }
import { globSync, readFileSync } from 'fs'
import path from 'path'

const __dirname = import.meta.dirname

// consistent-type-imports reads the TypeScript parser services, which a .vue file
// with no <script> block never gets: the rule crashes on such a file instead of
// skipping it, so those files are left out of it.
const templateOnlyVueFiles = globSync('{apps,packages}/*/src/**/*.vue', {
    cwd: __dirname,
})
    .filter(
        (file) =>
            !readFileSync(path.join(__dirname, file), 'utf8').includes(
                '<script',
            ),
    )
    // ignores are globs: a catch-all page such as `[...all].vue` must be
    // escaped, or its brackets are read as a character class
    .map((file) => file.replace(/[[\]{}()*?!+@]/g, '\\$&'))

export default [
    {
        ignores: [
            '**/dist/**',
            '**/node_modules/**',
            '.agents/**',
            '.claude/**',
            '.nx/**',
            '**/.ui-tour/**',
            '**/@volverjs/**',
            '**/volver/**',
            '**/*.cjs',
            '**/*.mjs',
            '**/*.json',
            // the global messages: no-missing-keys-in-other-locales checks a
            // locale file only when the file itself is linted
            '!packages/i18n/src/*.json',
            '**/*.yaml',
            '**/*.yml',
            '**/*.svg',
            '**/*.hbs',
            '**/*?raw',
        ],
    },
    pluginJs.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    ...vueTsEslintConfig(),
    ...pluginVueI18n.configs['flat/recommended'],
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        // Shared i18n resources: the no-missing-keys rule runs on every .vue
        // file (frontend app and packages/components), so localeDir is global.
        settings: {
            'vue-i18n': {
                localeDir: [
                    path.resolve(
                        __dirname,
                        'packages/i18n/src/*.{json,json5,yaml,yml}',
                    ),
                ],
                messageSyntaxVersion: '^11.0.0',
            },
        },
        rules: {
            'no-console': 'warn',
            'no-debugger': 'warn',
            'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
            'vue/multi-word-component-names': 'off',
            'vue/no-v-html': 'off',
            'no-unused-vars': 'off',
            'sort-imports': 'off',
            // for shims Window interface
            '@typescript-eslint/no-empty-interface': 'off',
            // enable _ for unused vars
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
            '@intlify/vue-i18n/no-raw-text': 'off',
            // every key in every locale, SFC <i18n> blocks included
            '@intlify/vue-i18n/no-missing-keys-in-other-locales': 'error',
        },
    },
    {
        files: ['apps/frontend/**/*'],
        languageOptions: autoImportsFrontend,
    },
    {
        files: ['apps/backend/**/*'],
        rules: {
            'no-console': 'off',
            // The shared `ability` belongs to the browser (one user per tab).
            // On the server it would be one object for every request: read
            // `request.ability`, built per request by plugins/fastifyAbility.ts.
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: 'ability',
                            importNames: ['ability', 'updateAbilityByUserRole'],
                            message:
                                'Use request.ability on the server (see packages/ability/src/index.ts).',
                        },
                    ],
                },
            ],
        },
        languageOptions: autoImportsBackend,
    },
    {
        // Build configs and maintenance scripts print to the console by design:
        // that is their interface, not stray debugging.
        files: ['**/vite.config.ts', '**/vitest.config.ts', '**/scripts/**'],
        rules: {
            'no-console': 'off',
        },
    },
    eslintPluginPrettierRecommended,
    {
        // After the Prettier preset, which turns `curly` off: the `all` option
        // does not conflict with Prettier's formatting.
        rules: {
            curly: ['error', 'all'],
            // Styles are plain BEM, never scoped or CSS modules
            'vue/enforce-style-attribute': ['error', { allow: ['plain'] }],
        },
    },
    {
        files: ['**/*.ts', '**/*.mts', '**/*.vue'],
        ignores: templateOnlyVueFiles,
        rules: {
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { disallowTypeAnnotations: false },
            ],
        },
    },
]
