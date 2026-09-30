import type { AppAbility } from 'ability'
import type { User } from 'auth'
import type { Querystring } from 'models'
import type { PagedResponse } from '~/plugins/fastifyPagination'

/**
 * Who is calling a service: the user writes the audit columns, the ability
 * decides which rows they see and change. Controllers build it with
 * `getActor(request)`.
 */
export type Actor = {
    user: User
    ability: AppAbility
}

/**
 * The shape of a resource service, see `todo.service.ts`. `get`, `update` and
 * `delete` answer 404 for a row the actor may not read, as if it did not
 * exist, and 403 for a row they may read but not change.
 */
export interface CrudService<Dto, Item, Query extends Querystring> {
    list(query: Query, actor: Actor): Promise<PagedResponse<Item>>
    get(id: string, actor: Actor): Promise<Item>
    create(item: Dto, actor: Actor): Promise<Item>
    update(id: string, item: Dto, actor: Actor): Promise<Item>
    delete(id: string, actor: Actor): Promise<boolean>
}
