<div align="center">

[![volverjs](packages/icons/src/volverjs.svg)](https://volverjs.github.io/style)

## @volverjs/monorepo-starter

`vue` `volverjs` `ui` `vue3` `vite` `template` `starter` `nx` <br /> `fastify` `pwa` `drizzle` `orm` `postgres` `docker`

<br>

maintained with ❤️ by

<br>

[![8 Wave](packages/icons/src/8wave.svg)](https://8wave.it)

<br>

</div>

## Features

-   ⚡️ [Vue 3](https://github.com/vuejs/core), [Vite](https://github.com/vitejs/vite), [💾](https://pnpm.io/), [esbuild](https://github.com/evanw/esbuild) - born with fastness
-   🎉 [Monorepo with Nx](https://nx.dev/)
-   😺 [Fastify](https://fastify.dev/)
-   🔑 [Better Auth](https://better-auth.vercel.app/) - the authentication framework
-   🗂 [File based routing](./apps/frontend/src/pages)
-   📦 [Components auto importing](./apps/frontend/src/components)
-   🍍 [State Management via Pinia](https://pinia.vuejs.org/)
-   📲 [PWA](https://github.com/antfu/vite-plugin-pwa)
-   🎨 [@volverjs/ui-vue](https://github.com/volverjs/ui-vue)
-   🌍 [I18n ready](./packages/i18n)
-   📥 [Auto importing](https://github.com/antfu/unplugin-auto-import) - use Composition API and others directly
-   💾 [Drizzle ORM](https://orm.drizzle.team/)
-   🦾 TypeScript, of course

## Pre-packed

### [Volverjs](https://github.com/volverjs)

-   [@volverjs/style](https://volverjs.github.io/style/) - The easy way to style
-   [@volverjs/ui-vue](https://github.com/volverjs/ui-vue) - The lightweight Vue 3 component library
-   [@volvejs/form-vue](https://github.com/volverjs/form-vue) - Form validation and submission
-   [@volverjs/auth-vue](https://github.com/volverjs/auth-vue) -
    Simple OAuth 2 / OpenID Connect plugin
-   [@volverjs/zod-vue-i18n](https://github.com/volverjs/zod-vue-i18n) - Zod validation with Vue 3 and i18n
-   [@volverjs/query-vue](https://github.com/volverjs/query-vue) - Query state management
-   [@volverjs/data](https://github.com/volverjs/data) - Tiny HttpClient based on Fetch API

### Plugins

-   [Vue Router](https://github.com/vuejs/router)
    -   [`unplugin-vue-router`](https://github.com/posva/unplugin-vue-router) - File system based routing
-   [Pinia](https://pinia.vuejs.org) - Intuitive, type safe, light and flexible Store for Vue using the composition api
-   [`unplugin-vue-components`](https://github.com/antfu/unplugin-vue-components) - Components auto import
-   [`unplugin-auto-import`](https://github.com/antfu/unplugin-auto-import) - Directly use Vue Composition API and others without importing
-   [`vite-plugin-pwa`](https://github.com/antfu/vite-plugin-pwa) - PWA
-   [Vue I18n](https://github.com/intlify/vue-i18n-next) - Internationalization
    -   [`unplugin-vue-i18n`](https://github.com/intlify/bundle-tools/tree/main/packages/unplugin-vue-i18n) - Unplugin for Vue I18n
-   [VueUse](https://github.com/antfu/vueuse) - Collection of useful composition APIs
-   [`@vueuse/head`](https://github.com/vueuse/head) - Manipulate document head reactively

### Coding Style

-   Use Composition API with [`<script setup>` SFC syntax](https://github.com/vuejs/rfcs/pull/227)
-   [ESLint](https://eslint.org/) with typescript and vue3 recommended
-   [Stylelint](https://stylelint.io/) with recommended rules
-   [Prettier](https://prettier.io/) with single quotes, no semi, trailing comma and four spaces of tab width

### Dev tools

-   [TypeScript](https://www.typescriptlang.org/)
-   [pnpm](https://pnpm.js.org/) - Fast, disk space efficient package manager
-   [VS Code Extensions](./.vscode/extensions.json)
    -   [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) - Vue 3 `<script setup>` IDE support
    -   [Iconify IntelliSense](https://marketplace.visualstudio.com/items?itemName=antfu.iconify) - Icon inline display and autocomplete
    -   [i18n Ally](https://marketplace.visualstudio.com/items?itemName=lokalise.i18n-ally) - All in one i18n support
    -   [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
    -   [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
    -   [Stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint)

## Requirements

-   [Node.js](https://nodejs.org/)
-   [pnpm](https://pnpm.io/)
-   [docker](https://www.docker.com/)

## Quick Start

```bash
docker compose up -d
pnpm install
pnpm db:migrate
pnpm dev
```

The frontend will be available at [http://localhost:8080](http://localhost:8080) and the backend  at [http://localhost:3000](http://localhost:3000).

You can read the APIs documentation with Swagger at [http://localhost:3000/swagger](http://localhost:3000/swagger) or Scalar at [http://localhost:3000/scalar](http://localhost:3000/scalar).

### Access to postgres:

-   `localhost:5432`
-   **Username:** postgres (as a default)
-   **Password:** Volverjs! (as a default)
-   **Database:** postgres (as a default)

### Access to PgAdmin:

-   **URL:** `http://localhost:5050`
-   **Username:** pgadmin4@dpage.com (as a default)
-   **Password:** Volverjs! (as a default)

### Add a new server in PgAdmin:

-   **Host name/address** `postgres`
-   **Port** `5432`
-   **Database** `postgres`
-   **Username** as `POSTGRES_USER`, by default: `postgres`
-   **Password** as `POSTGRES_PASSWORD`, by default `Volverjs!`

## Try it now!
### GitHub Template

[Create a repo from this template on GitHub](https://github.com/volverjs/monorepo-starter/generate).

### Clone to local

If you prefer to do it manually with the cleaner git history

```bash
npx degit volverjs/monorepo-starter my-app
cd my-app
pnpm i # If you don't have pnpm installed, run: npm install -g pnpm
```

## Checklist

When you use this template, try follow the checklist to update your info properly

-   [ ] Change the author name in `LICENSE`
-   [ ] Update `package.json` with your info
-   [ ] Change `.env` settings in `apps/backend/.env` (expecially generate the [`VITE_BETTER_AUTH_SECRET`](https://better-auth.vercel.app/docs/installation#set-environment-variables))
-   [ ] CHange `.env` settings in `apps/frontend/.env`
-   [ ] Change the favicon in `apps/frontend/public`
-   [ ] Clean up the README

And, enjoy :)

## Usage

### Development

Just run and visit http://localhost:8080

```bash
pnpm dev
```

### Build

To build the App, run

```bash
pnpm build
```

And you will see the generated file in `dist` that ready to be served.

## Acknoledgements

This repo is inspired by 🏕 [antfu/vitesse](https://github.com/antfu/vitesse)

## License

[MIT](http://opensource.org/licenses/MIT)
