# UI tour

`apps/frontend/scripts/ui-tour.mjs` opens the running frontend in headless Chrome, signs in
through the real form, visits a list of pages in the light and in the dark theme, saves a
screenshot of each and exits with code 1 when any page logged a console error, a warning, a
failed request or an uncaught exception. It has no dependency: it drives Chrome through the
DevTools protocol with Node's built-in WebSocket.

No test suite covers the frontend, so this is how a UI change gets looked at before it is
reported done.

## Run it

With the dev servers up (`pnpm dev`) and the local database migrated:

```bash
# public pages only (sign-in, sign-up, password reset, 404)
pnpm nx run frontend:ui-tour

# signed in: dashboard, todos, users, 404
UI_TOUR_EMAIL=you@example.com UI_TOUR_PASSWORD=... pnpm nx run frontend:ui-tour

# chosen pages, a detail page by its id
UI_TOUR_EMAIL=... UI_TOUR_PASSWORD=... pnpm nx run frontend:ui-tour -- /frontoffice/todos/<id>
```

Screenshots land in `apps/frontend/.ui-tour/` (git ignored) as `<theme>-<page>.png`: open the
ones of the pages you changed and look at them. The console summary is the other half: a
change that renders fine but warns is not done.

| Variable | Default |
| --- | --- |
| `UI_TOUR_BASE_URL` | `https://localhost:8080` (a `vite preview` of a build works too) |
| `UI_TOUR_EMAIL`, `UI_TOUR_PASSWORD` | unset: public pages only |
| `CHROME_PATH` | Google Chrome or Chromium in the usual macOS and Linux locations |
| `UI_TOUR_SETTLE_MS` | `2500`, the wait after each navigation |

The backoffice pages need an `admin`: promote a local user with
`update "user" set role = 'admin' where email = '...'`.

It visits pages and clicks nothing: a form, a toggle or a delete still needs trying by hand.

## What it caught

On 2026-09-29 it found a production build that answered 404 to its own sign-in, because
`VITE_BACKEND_URL` was empty for the `production` mode ([the frontend gotchas](gotchas/frontend.md)),
and the `next()` deprecation warning of vue-router 5 on every navigation. On the same day it
showed the todo detail form empty and a pressed filter button unreadable in the dark theme
([the frontend gotchas](gotchas/frontend.md)).
