import type { Database } from 'database'
import type { SnapshotService } from '~/services/snapshot.service'
import type { TodoService } from '~/services/todo.service'
import { token } from 'brandi'

export const TOKENS = {
    database: token<Database>('database'),
    snapshotService: token<SnapshotService>('snapshotService'),
    todoService: token<TodoService>('todoService'),
} as const
