# Adding an API resource

The `todo` resource is the reference implementation of every step below: read its files next
to this list. Replace `Item` / `item` / `items` with the new name.

## 1. Table

- `packages/database/src/schema/Item.ts`: `pgTable('item', { ...entityDefaultColumns, ... })`.
  The spread gives the uuid id, the audit columns and the soft delete columns every service
  relies on.
- Export it from `packages/database/src/schema/index.ts`.
- `pnpm db:generate`, then check that a file appeared in `packages/database/drizzle/` (the
  command can fail and still report success, see
  [the database gotchas](gotchas/database.md)), read the SQL, `pnpm db:migrate`.

## 2. Model

`packages/models/src/schema/Item.ts`, exported from `schema/index.ts`:

- `ItemDtoSchema` from `createInsertSchema(item, ...)` with the metadata columns optional and
  readonly, exactly as `Todo.ts` does. `.readonly()` only types them: the schema still accepts
  them from a client, and it is the service that drops them (step 4);
- `ItemSchema` from `createSelectSchema(item)`;
- `ItemQuerystringSchema` from `zodQs`: `pagination()`, `sort([...])` with the sortable columns,
  `filters([...])`, `fullText()`, `ids()`;
- the three inferred types.

## 3. Permissions

- `Subject.Item` in `packages/ability/src/types.ts`.
- Capabilities in `packages/ability/src/roles/Admin.ts` and `User.ts`. What a role may not do
  is simply absent: the default is deny.
- A case per role in `apps/backend/tests/unit/ability.test.ts`.

## 4. Service

`apps/backend/src/services/item.service.ts`, implementing `CrudService`:

- the list builds its `where` from the helpers of `database/helpers` (`getFilters`,
  `getIdsFilter`, `getFullText`) plus `eq(table.deleted, false)`, and returns a
  `PagedResponse(items, total)`: the pagination plugin turns it into the body and the
  `X-Total-Count` header;
- a missing row throws `EntityNotFoundError(id)`, on update too (`returning()` gives an empty
  array, not an error);
- writes strip the metadata from the DTO, set `createdBy` / `updatedBy` from the current user and
  record a snapshot; delete is soft (`deleted`, `deletedAt`, `deletedBy`);
- `injected(ItemService, TOKENS.database, TOKENS.snapshotService)` at the bottom, the token in
  `container/tokens.ts`, the binding in `container/index.ts`.

## 5. Controller

`apps/backend/src/controllers/items.controller.ts`, registered automatically (restart the dev
server once):

- `@Controller({ route: '/v1/items', tags: [{ name: Subject.Item }] })`;
- route decorators imported from `./index`, and a `permissions` map on every route: without it
  the route is public ([the backend gotchas](gotchas/backend.md));
- `querystring`, `body` and `response` schemas from `packages/models`: they validate the
  request, shape the response and document the route in `/swagger`;
- the service from `container.get(TOKENS.itemService)` in the constructor.

## 6. Tests

In `apps/backend/tests/unit/`: the ability cases above, and in `server.test.ts` that an
anonymous request to the new routes gets a 401 and that `/swagger/json` lists them. How a
signed-in role is refused (403) is covered once, for every route, by `permissions.test.ts`.

## 7. Frontend

- Data access through a `@volverjs/data` repository wrapped by `@volverjs/query-vue`
  (`defineStoreRepository`): invoke the `volverjs-data` and `volverjs-query-vue` skills.
- Forms from the Zod DTO with `@volverjs/form-vue` (`volverjs-form-vue` skill), pages in
  `apps/frontend/src/pages/`, UI gated with `useAbility().can(...)`.
- Every label in both `packages/i18n/src/en.json` and `it.json`.

## 8. Done

`pnpm verify`, then the running app (`pnpm nx run frontend:ui-tour`) for the pages you added.
