# Adding a resource

`todo` is the reference resource, from the table to the pages. Every file below exists for it:
copy the file, rename `Todo` / `todo` / `todos` to the new name, then change what differs. Do
not start from a blank file, and do not copy another resource that grew its own habits: this
one is covered by the integration suite and the UI tour, so it is the one known to be right.

| Step | Reference file |
| --- | --- |
| Table | `packages/database/src/schema/Todo.ts` |
| Models | `packages/models/src/schema/Todo.ts` |
| Permissions | `packages/ability/src/types.ts`, `packages/ability/src/roles/*.ts` |
| Service | `apps/backend/src/services/todo.service.ts` |
| Controller | `apps/backend/src/controllers/todos.controller.ts` |
| Tests | `apps/backend/tests/integration/todos.test.ts`, `tests/unit/ability.test.ts` |
| Store | `apps/frontend/src/stores/useTodoStore.ts` |
| Pages | `apps/frontend/src/pages/frontoffice/todos/index.vue`, `[id].vue` |

## 1. Table

- `pgTable('item', { ...entityDefaultColumns, ... })`: the spread gives the uuid id, the audit
  columns and the soft delete columns every service relies on. Export it from
  `packages/database/src/schema/index.ts`.
- `pnpm db:generate -- --name <what_changed>`, then check that a file appeared in
  `packages/database/drizzle/` (the command can fail and still report success, see
  [the database gotchas](gotchas/database.md)), read the SQL, `pnpm db:migrate`.

## 2. Models

`packages/models/src/schema/Item.ts`, exported from `schema/index.ts`:

- `ItemDtoSchema`: `createInsertSchema(item, { ...refinements }).omit(serverManagedColumns)`.
  What a client sends. The omitted columns are the ones the server writes, and the route
  validation strips unknown keys, so a body cannot set `createdBy` or `deleted`. The frontend
  form validates with this same schema: put the rules (`.trim().min(1)`) here, once.
- `ItemSchema`: `createSelectSchema(item, { dates: z.coerce.date() }).omit(softDeleteColumns)`.
  What the API returns. The coerced dates let the browser parse the JSON back into `Date`s.
- `ItemQuerystringSchema` from `zodQs`: `pagination()`, `sort([...], '-updatedAt')`,
  `filter('name', schema)` per filterable column, `fullText()`, `ids()`. A non-text filter needs
  its schema (`z.stringbool()`, `z.coerce.number()`): a querystring value is a string, and a
  string compared to a boolean column matches the wrong rows ([the backend gotchas](gotchas/backend.md)).

## 3. Permissions

- `Subject.Item` in `packages/ability/src/types.ts`.
- Capabilities in the role files. A role is a function of the user, so ownership is a condition
  on the user's id: `{ action: 'modify', subject: Subject.Item, condition: { createdBy: user.id } }`.
  `modify` is read, update and delete. What a role may not do is simply absent: the default is
  deny.
- The same rules run in the browser, where they only hide what the API would refuse.
- A case per role in `apps/backend/tests/unit/ability.test.ts`.

## 4. Service

Copy `todo.service.ts`. What it does, so that the copy keeps doing it:

- every query goes through `_visible(actor, action)`: not soft deleted, and
  `accessibleBy(ability, action, subject, table)`, which turns the role conditions into SQL. A
  list therefore returns only the rows the actor may read, and its total counts only those;
- `get` answers 404 for a row that is missing, deleted or not readable by the actor, the same
  for all three;
- `update` and `delete` read the row first (404), then `assertCan(ability, action, subject, row)`
  on the stored row (403), then write with `_visible` in the WHERE again, and a 404 when the
  write touched nothing;
- `create` sets `createdBy` / `updatedBy` from the actor and checks the row it is about to
  insert: never judge a condition on the request body, the client wrote it;
- every write records a snapshot in the same `this._db.transaction()`, the `tx` passed on to
  `SnapshotService.create`: a snapshot that fails rolls the write back, so no change is stored
  without its copy; delete is soft (`deleted`, `deletedAt`, `deletedBy`);
- `injected(ItemService, TOKENS.database, TOKENS.snapshotService)` at the bottom, the token in
  `container/tokens.ts`, the binding in `container/index.ts`.

## 5. Controller

Copy `todos.controller.ts`, registered automatically (restart the dev server once):

- route decorators from `./index`, and a `permissions` map on every route: without it the
  route is public. The map only says which action a route needs on the subject type (401
  anonymous, 403 for a role with no rule at all); which rows is the service's job;
- `params: z.object({ id: z.uuid() })` on the `/:id` routes, or a malformed id reaches Postgres
  and answers 500;
- `querystring`, `body` and `response` schemas from `packages/models`: they validate the
  request, shape the response and document the route in `/swagger`;
- handlers pass `getActor(request)` to the service and hold no logic of their own.

## 6. Tests

Copy `tests/integration/todos.test.ts`. It runs on the Postgres of `docker-compose.yml`, on a
database the suite recreates and migrates once per run (`<database>_test` next to the one of
`DATABASE_URL`), with real sessions from `signUp()` in `tests/integration/helpers.ts`. Keep its cases: the owner set by
the server whatever the body says, a 400 for an invalid body, a list limited to the caller with
`X-Total-Count`, filters and sort, 404 for someone else's row on read, update and delete, the
admin path, soft delete, snapshots and their rollback, a 400 for a malformed id. Test files run in parallel on
the same database: sign up fresh users and assert on their rows only.

In `tests/unit/server.test.ts`, add the new routes to the `/swagger/json` list.

## 7. Store

Copy `useTodoStore.ts`: a `RepositoryHttp` on the `httpClient` of `modules/httpClient.ts`
(imported, not looked up), a `responseAdapter` that parses with `ItemSchema`, and
`defineStoreRepository(repository, 'items', { defaultPersistence: 0 })`. Invoke the
`volverjs-data` and `volverjs-query-vue` skills before changing its options.

## 8. Pages

Invoke `volverjs-style`, `volverjs-ui-vue` and `volverjs-form-vue` first. Copy the two pages:

- `index.vue`: `PkTableSortable` on `read(params, { autoExecute: true })`, with page, sort and
  filters in the route query (`useRoutePagination`, `useRouteQuery`) so a link reopens the same
  view; the total from `metadata.total`; a create dialog on `ItemDtoSchema.pick(...)`; a
  delete behind `useDialogConfirm`; every write followed by `execute(true)` on the list;
- `[id].vue`: `read({ id })`, the form seeded through `:model-value` (not by writing
  `formData`, see [the frontend gotchas](gotchas/frontend.md)), read-only when
  `can('update', subject(...))` is false, a custom component (`PkEditorWyswyg`) through the
  `VvFormField` slot;
- `submit()` and `remove()` created once with `{ immediate: false }` and called with
  `await execute(...)`: `remove()` itself returns reactive state, not a promise;
- a sidebar entry in `pages/frontoffice@sidebar.vue`;
- every label in both locales: global ones in `packages/i18n/src/*.json`, page ones in the
  `<i18n>` block.

## 9. Done

`pnpm verify` with Postgres up, then the running app: `pnpm nx run frontend:ui-tour -- /frontoffice/items /frontoffice/items/<id>`,
and look at both themes. The tour visits pages and clicks nothing: try the writes yourself.

## Removing the example

A project that no longer wants `todo` removes the files of the table above, `Subject.Todo`
and its rules, the token and binding in `apps/backend/src/container/`, the sidebar entry, the
dashboard counts (`pages/frontoffice/dashboard.vue`), the `route.todos` label, and the swagger
paths in `server.test.ts`; then `pnpm db:generate` for the `DROP TABLE`. Do it after the first
real resource exists, which should be a copy of it.
