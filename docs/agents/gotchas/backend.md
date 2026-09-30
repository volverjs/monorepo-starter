# Backend gotchas

Part of the [gotchas index](../gotchas.md): Fastify, permissions, better-auth on the server.
Each entry: what breaks, why, what to do.

## Response serialization is parse-based on purpose

fastify-type-provider-zod 7 serializes responses with `z.encode`, which runs a schema backward:
a `.default()` is not applied and a one-way `.transform()` throws `ZodEncodeError`. Handlers
here return raw database rows and rely on the response schema to shape them, as they did on
v6.

**Do:** keep `server.setSerializerCompiler(parseSerializerCompiler)` in `apps/backend/src/app.ts`
(`utils/responseSerializer.ts`, covered by `tests/unit/responseSerializer.test.ts`). A schema
that needs a real output codec (a `Date` encoded some other way) needs the row parsed at the
service boundary first, not a different compiler.

## One ability for the whole process judged each request with someone else's rules

Until 2026-09-29 the backend rewrote a single CASL instance in an `onRequest` hook, from the
role of whichever request was passing, and the route decorators read it later in the
`preHandler`. Between the two the request awaits the session lookup, so a concurrent request
could overwrite the rules first: a `user` could pass an `admin` check and the other way round.

**Do:** read `request.ability`, built per request by `plugins/fastifyAbility.ts` with
`createAbility(request.user)`. ESLint refuses importing the shared `ability` (or
`updateAbility`) anywhere under `apps/backend`: that one belongs to the browser.
`tests/unit/ability.test.ts` covers the factory.

## A route without `permissions` is public

The decorators in `controllers/index.ts` refuse an anonymous request only when the route
declares `permissions`. Until 2026-09-29 only `GET` was wrapped at all, so the `POST`, `PUT` and
`DELETE` routes of the todo sample checked nothing but the presence of a session, while the
roles said a `user` may only read.

**Do:** import `GET`, `POST`, `PUT`, `PATCH`, `DELETE` from `./index` (never from
`fastify-decorators`) and give every non-public route a `permissions` map or function. An
anonymous request gets a 401, a signed-in role without the capability a 403 (the frontend
HttpClient shows an alert for a 403, not for a 401).

## The permission check used to swallow the route's own hooks

Until 2026-09-29 the decorators replaced a route's `preHandler` with a callback that called the
original only when it was a single callback-style function: an array of hooks was dropped
without a word (an ownership check in it never ran), an `async` hook never called `done` and
the request hung, and an `async` permissions function was not awaited, so its rejection came
after the handler had written.

**Do:** leave the composition in `withPermissions` as it is: the check is the first element of
a `preHandler` array and Fastify runs every hook of the route after it.
`tests/unit/permissions.test.ts` covers each shape.

## A permissions map judged ownership on the request body

Until 2026-09-29 the map checked `ability.can(action, subject(Subject.X, request.body))` when
there was a body. For ownership that is wrong both ways: the client writes the body, so
`{ createdBy: user.id }` was satisfied by whatever id it sent, and a body without `createdBy`
(every PUT from the SPA) refused the owner. Without a body the map checked the bare subject
type, where CASL ignores conditions, so a user could reach anyone's row.

**Do:** the map checks the subject type only (does the role have any rule for the action).
The service checks the row: `accessibleBy()` in the WHERE of every query, and `assertCan()` on
the stored row before a write ([apps/backend/src/utils/permissions.ts](../../apps/backend/src/utils/permissions.ts),
[todo.service.ts](../../apps/backend/src/services/todo.service.ts)). A condition on create is
judged on the row the server is about to insert.

## A boolean filter in the querystring matched the false rows

`zodQs.filters(['done'])` declared `filter[done]` as a string, so the service compared the
boolean column with the string `'true'`. postgres-js serializes a boolean parameter as
`value === true ? 't' : 'f'`: any string is `'f'`, and `filter[done]=true` returned the open
todos. No error anywhere; the integration suite caught it.

**Do:** give a non-text filter its schema, `zodQs.filter('done', z.stringbool())` or
`z.coerce.number()`, so the service receives the typed value.

## A package the bundle imports must be a dependency of `apps/backend`

The production build bundles the workspace packages and leaves npm packages as imports, and
`dist/package.json` keeps only the `dependencies` of `apps/backend`. On 2026-09-29
`openapi-types` had been moved to `devDependencies` because it looked type-only, but
`fastifyDocs.ts` reads `OpenAPIV3.HttpMethods` at runtime: every check passed and the deployed
backend would have stopped at startup.

**Do:** nothing by hand: `scripts/afterBuild.js` compares the imports of `dist/main.js` with
the dependencies and fails the build, naming the package. Move it to `dependencies` of
`apps/backend`.

## Annotating the better-auth config erases the plugins from the types

`export const config: BetterAuthOptions = { ... }` widens `plugins` to the base interface:
`auth.api` loses every plugin endpoint (`generateOpenAPISchema` needed a
`@ts-expect-error`) and the frontend client loses the additional `role` field (the users page
needed a cast to read it).

**Do:** `export const config = { ... } satisfies BetterAuthOptions` in
`packages/auth/src/index.ts`. The same holds for any plugin written `plugin() as BetterAuthPlugin`.

## A custom error handler logs nothing, and the shared logger is silent in production

`setErrorHandler` replaces Fastify's own error logging, and `packages/logger` prints only in a
development build. The problem+json handler used that logger, so a 500 in production left no
trace at all.

**Do:** log server errors with `request.log` (pino, request id included), as
`plugins/fastifyProblemJson.ts` does: `error` for 5xx, `info` for 4xx. Keep `packages/logger` for
development diagnostics.
