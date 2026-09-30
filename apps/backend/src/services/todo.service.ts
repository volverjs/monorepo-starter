import type { Action } from 'ability'
import type { Database, Transaction } from 'database'
import type { Todo, TodoDto, TodoQuerystring } from 'models'
import type { SnapshotService } from '~/services/snapshot.service'
import type { Actor, CrudService } from '.'
import { and, eq } from 'drizzle-orm'
import { injected } from 'brandi'
import { todo } from 'database/schema'
import {
    getFilters,
    getFullText,
    getIdsFilter,
    getOffsetAndLimit,
    getOrderBy,
} from 'database/helpers'
import { Subject } from 'ability'
import { TOKENS } from '~/container/tokens'
import { EntityNotFoundError } from '~/plugins/fastifyProblemJson'
import { PagedResponse } from '~/plugins/fastifyPagination'
import { accessibleBy, assertCan } from '~/utils/permissions'

type Row = typeof todo.$inferSelect

/**
 * The reference resource service: a new resource copies it
 * (docs/agents/new-resource.md). Every query goes through `_visible`, so a
 * soft deleted row, or one the actor may not read, never leaves this class.
 */
export class TodoService implements CrudService<
    TodoDto,
    Todo,
    TodoQuerystring
> {
    private _table = todo

    constructor(
        private _db: Database,
        private _snapshotService: SnapshotService,
    ) {}

    /** The rows the actor may `action`, soft deleted ones excluded. */
    private _visible({ ability }: Actor, action: Action = 'read') {
        return and(
            eq(this._table.deleted, false),
            accessibleBy(ability, action, Subject.Todo, this._table),
        )
    }

    /**
     * Records the write in the same transaction: a snapshot that fails rolls
     * the write back, so no change is ever stored without its copy.
     */
    private _snapshot(
        tx: Transaction,
        row: Row,
        scope: 'create' | 'update' | 'delete',
        { user }: Actor,
    ) {
        return this._snapshotService.create(
            row.id,
            Subject.Todo,
            JSON.stringify(row),
            scope,
            user,
            tx,
        )
    }

    async list(query: TodoQuerystring, actor: Actor) {
        const where = and(
            this._visible(actor),
            ...getFilters(query, this._table),
            getIdsFilter(query, this._table),
            getFullText(query, [this._table.title]),
        )
        const [items, total] = await Promise.all([
            this._db.query.todo.findMany({
                ...getOffsetAndLimit(query),
                orderBy: getOrderBy(query, this._table),
                where,
            }),
            this._db.$count(this._table, where),
        ])
        return new PagedResponse(items, total)
    }

    async get(id: string, actor: Actor) {
        const item = await this._db.query.todo.findFirst({
            where: and(eq(this._table.id, id), this._visible(actor)),
        })
        if (!item) {
            throw new EntityNotFoundError(id)
        }
        return item
    }

    async create(item: TodoDto, actor: Actor) {
        const value = {
            ...item,
            createdBy: actor.user.id,
            updatedBy: actor.user.id,
        }
        // The row as it will be stored, not the body: see `assertCan`.
        assertCan(actor.ability, 'create', Subject.Todo, value)
        return this._db.transaction(async (tx) => {
            const [created] = await tx
                .insert(this._table)
                .values(value)
                .returning()
            await this._snapshot(tx, created, 'create', actor)
            return created
        })
    }

    async update(id: string, item: TodoDto, actor: Actor) {
        // A 404 when the actor may not even see the row, a 403 when they may
        // see it but not change it.
        const current = await this.get(id, actor)
        assertCan(actor.ability, 'update', Subject.Todo, current)
        return this._db.transaction(async (tx) => {
            const [updated] = await tx
                .update(this._table)
                .set({
                    ...item,
                    updatedBy: actor.user.id,
                    updatedAt: new Date(),
                })
                // Checked again in SQL: the row may have been deleted meanwhile.
                .where(
                    and(
                        eq(this._table.id, current.id),
                        this._visible(actor, 'update'),
                    ),
                )
                .returning()
            if (!updated) {
                throw new EntityNotFoundError(id)
            }
            await this._snapshot(tx, updated, 'update', actor)
            return updated
        })
    }

    async delete(id: string, actor: Actor) {
        const current = await this.get(id, actor)
        assertCan(actor.ability, 'delete', Subject.Todo, current)
        return this._db.transaction(async (tx) => {
            const [deleted] = await tx
                .update(this._table)
                .set({
                    deleted: true,
                    deletedBy: actor.user.id,
                    deletedAt: new Date(),
                })
                .where(
                    and(
                        eq(this._table.id, current.id),
                        this._visible(actor, 'delete'),
                    ),
                )
                .returning()
            if (!deleted) {
                throw new EntityNotFoundError(id)
            }
            await this._snapshot(tx, deleted, 'delete', actor)
            return true
        })
    }
}

injected(TodoService, TOKENS.database, TOKENS.snapshotService)
