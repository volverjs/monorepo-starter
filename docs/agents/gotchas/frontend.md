# Frontend gotchas

Part of the [gotchas index](../gotchas.md): routing, env, the build, the Volver components.
Each entry: what breaks, why, what to do.

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

## A form seeded before it mounts starts empty

The setup of `VvForm` (`@volverjs/form-vue`) sets `formData` from its own `modelValue`, which
defaults to `{}`. The todo detail page wrote the loaded row into `formData` from a watcher, and
the form, mounted later behind the loading skeleton, replaced it: the page rendered an empty
title and empty notes for a todo that had both (UI tour, 2026-09-29).

**Do:** pass the record as `:model-value` on `VvForm`: it is read when the form mounts and
watched afterwards ([`[id].vue`](../../apps/frontend/src/pages/frontoffice/todos/[id].vue)).
Write `formData` only while the form is mounted.

## A toggle button is pressed by its `name`, not its `value`

In a `VvButtonGroup` with `toggle`, a click sets the group value to the button's `value`, but
the button shows itself pressed when its `name` equals the group value (`@volverjs/ui-vue`
0.0.24). The status filter of the todo list, written with `value="done"`, filtered correctly
and never showed which button was on.

**Do:** give toggle buttons `name` only (`<VvButton name="done" ...>`): it is also the value
they set.

## The dark theme leaves a pressed secondary button unreadable

`@volverjs/style` 0.1.28 restyles the hover and active states of `vv-button--secondary` in the
dark theme, not the pressed one, which keeps the light background under light text. Seen on
the todo status filter.

**Do:** nothing, `packages/style/custom/_index.scss` sets the token for both dark selectors.
Remove the override when the library themes the state; check a toggle group in both themes
with the UI tour.
