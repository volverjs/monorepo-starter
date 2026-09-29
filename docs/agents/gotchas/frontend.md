# Frontend gotchas

Part of the [gotchas index](../gotchas.md): routing, env, the build. Each entry: what breaks,
why, what to do.

## vue-router 5 absorbed unplugin-vue-router

The file-based routing plugin now ships inside vue-router: `vue-router/vite` (plugin),
`vue-router/unplugin` (`VueRouterAutoImports`), `createRouter` from `vue-router` itself (not
`vue-router/auto`), routes still from `vue-router/auto-routes`. Two leftovers surfaced on
2026-09-29 after the imports compiled:

- a guard written with `next()` logs `[VUE_ROUTER_R0025] The next() callback in navigation
  guards is deprecated` on every navigation: return the redirect instead
  (`modules/auth.ts`);
- `vue-tsc` warns `[vue-router] No rootDir specified` and types `useRoute()` loosely: the Volar
  plugins read `compilerOptions.rootDir`, set in `apps/frontend/tsconfig.json`.

## A missing `VITE_` variable is `undefined`, not an error

`vite/client` types `import.meta.env` with an index signature, so a misspelled or never defined
variable compiles. `modules/httpClient.ts` read `VITE_API_BASE_URL`, defined nowhere, and every
API call went to the frontend's own origin. A production build with an empty
`VITE_BACKEND_URL` produced an app that answered 404 to its own sign-in (caught by the UI tour
on 2026-09-29).

**Do:** the backend URL is `VITE_BACKEND_URL`, set per mode in `apps/frontend/.env.<mode>`; the
build warns when it is empty. Declare every variable in `src/vite-env.d.ts` and check a new
one on the running app, not only in the typecheck.

## ESLint `ignores` are globs, and a catch-all page is not a plain path

`eslint.config.js` leaves `.vue` files without a `<script>` out of `consistent-type-imports`
(the rule crashes on them). The list is built from file paths, and `[...all].vue` read as a
glob is a character class: the page was not ignored and ESLint aborted with
`You have used a rule which requires type information`.

**Do:** escape glob characters in any path turned into an ignore pattern, as the config does.
