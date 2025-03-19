import { eq } from 'drizzle-orm'
import { injected } from 'brandi'
import { snapshot } from 'database/schema'
import type { Database } from 'database'
import type { User } from 'better-auth'
import { TOKENS } from '~/container/tokens'

export class SnapshotService {
    private _table = snapshot

    constructor(private _db: Database) {}

    async get(id: string) {
        return await this._db
            .select()
            .from(this._table)
            .where(eq(this._table.entityId, id))
    }

    async create(
        entityId: string,
        entityName: string,
        content: string,
        scope: string,
        currentUser: User,
    ): Promise<boolean> {
        if (!entityId || !entityName || !content) {
            return false
        }
        const itemToSave = {
            entityId,
            entityName,
            content,
            scope,
            createdBy: currentUser.id,
            updatedBy: currentUser.id,
        }
        const toReturn = await this._db
            .insert(this._table)
            .values(itemToSave)
            .returning()

        if (!toReturn[0]) {
            return false
        }
        return true
    }
}
injected(SnapshotService, TOKENS.database)
