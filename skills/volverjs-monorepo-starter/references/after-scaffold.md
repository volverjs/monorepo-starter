# After scaffolding

The first customizations of a project scaffolded from @volverjs/monorepo-starter, in the order
they usually come up. Paths are relative to the new project.

## Brand

| What | Where |
| --- | --- |
| Names shown in the UI, page title, PWA manifest | `VITE_APP_*` in `apps/frontend/.env` (set by the scaffold) |
| Logo in header, sidebar and sign-in page | `packages/icons/src/logo.svg`: any SVG, `pnpm nx run icons:build` compiles it |
| Favicon and PWA icons | `apps/frontend/public/favicon.svg`, `pwa-192x192.png`, `pwa-512x512.png` |
| Images of the transactional emails | `apps/frontend/public/email/logo.png`, `banner.png` |
| Brand color, font | `$color-brand`, `$font-family-sans` in `packages/style/settings/_index.scss` (invoke the `volverjs-style` skill) |
| Web font | the Google Fonts URL of `webfontDownload` in `apps/frontend/vite.config.ts` |

## Social sign-in

Each provider listed in `VITE_AUTH_SOCIAL_PROVIDERS` shows a button; it works once its
credentials are in `apps/backend/.env.local` (the names are declared in `apps/backend/.env`):

| Provider | Variables | Callback URL to register |
| --- | --- | --- |
| Microsoft | `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | `<BETTER_AUTH_URL>/auth/callback/microsoft` |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `<BETTER_AUTH_URL>/auth/callback/google` |
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | `<BETTER_AUTH_URL>/auth/callback/github` |
| Facebook | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` | `<BETTER_AUTH_URL>/auth/callback/facebook` |

Locally `BETTER_AUTH_URL` is `https://localhost:3000`.

## Email

Password reset mails go through SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`,
`SMTP_AUTH_USERNAME`, `SMTP_AUTH_PASSWORD`, `EMAIL_FROM`, `EMAIL_REPLY_TO` in
`apps/backend/.env.local`. Templates are Handlebars files in `packages/email/src/templates/`.

## Deploy

- **Backend**: `pnpm backend:build` writes `apps/backend/dist/` with `main.js` and a
  `package.json` holding only the npm dependencies. Deploy that folder, run
  `npm install --omit=dev` and `npm start`; it listens on `PORT` (default 8080). Set
  `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `FRONTEND_URL` and whatever sign-in
  and SMTP settings are used in the environment, not in files.
- **Database**: `DATABASE_URL=<target> pnpm db:migrate` before each backend release.
- **Frontend**: `pnpm frontend:build-production` (or `build-staging`) writes static files to
  `apps/frontend/dist/`. `VITE_BACKEND_URL` must be set in `apps/frontend/.env.production`
  (`.env.staging`): the build warns when it is empty. `public/staticwebapp.config.json` is the
  SPA fallback for Azure Static Web Apps; another host needs its own rewrite to `index.html`.
- No CI pipeline is included: `pnpm verify` is what a pipeline should run.

## The Todo sample

`todo` is the reference implementation that `docs/agents/new-resource.md` walks through. Keep
it until the first real resource exists, then remove it and point that document at the new
resource:

- `apps/backend/src/controllers/todos.controller.ts`, `apps/backend/src/services/todo.service.ts`,
  and the `todoService` token and binding in `apps/backend/src/container/`;
- `packages/models/src/schema/Todo.ts` and `packages/database/src/schema/Todo.ts`, with their
  exports;
- `Subject.Todo` in `packages/ability/src/types.ts` and its capabilities in `roles/`;
- the Todo cases in `apps/backend/tests/unit/` (`ability`, `server`, and `databaseHelpers`,
  which uses the `todo` table: switch it to the new one);
- then `pnpm db:generate` (a migration dropping `todo`) and `pnpm verify`.
