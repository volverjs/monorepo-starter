import type { User } from 'better-auth'
import type { TodoDto, Todo, TodoQuerystring } from 'models'
import type { Database } from 'database'
import type { SnapshotService } from '~/services/snapshot.service'
import { and, eq, sql } from 'drizzle-orm'
import { injected } from 'brandi'
import { todo } from 'database/schema'
import { Subject } from 'ability'
import { TOKENS } from '~/container/tokens'
import { EntityNotFoundError } from '~/plugins/fastifyProblemJson'
import {
    getFilters,
    getIdsFilter,
    getFullText,
    getOrderBy,
    getOffsetAndLimit,
} from 'database/helpers'
import { PagedResponse } from '~/plugins/fastifyPagination'
import { CrudService } from '.'

export class TodoService implements CrudService {
    private _table = todo

    constructor(
        private _db: Database,
        private _snapshotsService: SnapshotService,
    ) {}

    private _removeMetadata(item: TodoDto) {
        const {
            createdBy,
            updatedBy,
            createdAt,
            updatedAt,
            deleted,
            deletedAt,
            deletedBy,
            ...rest
        } = item
        return rest
    }

    async create(item: TodoDto, currentUser: User) {
        const value = {
            ...this._removeMetadata(item),
            createdBy: currentUser.id,
            updatedBy: currentUser.id,
        }

        const toReturn = (
            await this._db.insert(this._table).values(value).returning()
        )[0]

        await this._snapshotsService.create(
            toReturn.id,
            Subject.Todo,
            JSON.stringify(toReturn),
            'create',
            currentUser,
        )

        return toReturn
    }

    async read(queryOrKey: string): Promise<Todo>
    async read(queryOrKey: TodoQuerystring): Promise<PagedResponse<Todo>>
    async read(
        queryOrKey: TodoQuerystring | string,
    ): Promise<Todo | PagedResponse<Todo>> {
        if (typeof queryOrKey === 'string') {
            const item = await this._db.query.todo.findFirst({
                where: (table, { eq }) => eq(table.id, queryOrKey),
            })
            if (!item) {
                throw new EntityNotFoundError()
            }
            return item
        }

        const where = and(
            ...getFilters(queryOrKey, this._table),
            getIdsFilter(queryOrKey, this._table),
            getFullText(queryOrKey, [this._table.title]),
            eq(this._table.deleted, false),
        )

        const total = await this._db
            .select({ count: sql<number>`count(*)` })
            .from(this._table)
            .where(where)

        const items = await this._db.query.todo.findMany({
            ...getOffsetAndLimit(queryOrKey),
            orderBy: getOrderBy(queryOrKey, this._table),
            where,
        })
        const toReturn = new PagedResponse(items, total[0].count)
        return toReturn
    }

    async update(itemKey: string, item: TodoDto, currentUser: User) {
        const value = {
            ...this._removeMetadata(item),
            updatedBy: currentUser.id,
            updatedAt: new Date(),
        }

        const toReturn = (
            await this._db
                .update(this._table)
                .set(value)
                .where(eq(this._table.id, itemKey))
                .returning()
        )[0]

        await this._snapshotsService.create(
            itemKey,
            Subject.Todo,
            JSON.stringify(toReturn),
            'update',
            currentUser,
        )
        return toReturn
    }

    async delete(itemKey: string, currentUser: User): Promise<boolean> {
        const item = await this.read(itemKey)
        if (item.deleted) {
            return true
        }
        const toReturn = (
            await this._db
                .update(this._table)
                .set({
                    deleted: true,
                    deletedBy: currentUser.id,
                    deletedAt: new Date(),
                })
                .where(eq(this._table.id, itemKey))
                .returning()
        )[0]

        await this._snapshotsService.create(
            itemKey,
            Subject.Todo,
            JSON.stringify(toReturn),
            'delete',
            currentUser,
        )
        return toReturn.deleted
    }
}

injected(TodoService, TOKENS.database, TOKENS.snapshotService)
