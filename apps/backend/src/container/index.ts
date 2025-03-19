import { Container } from 'brandi'
import { database } from 'database'
import { TOKENS } from './tokens'
import { SnapshotService } from '~/services/snapshot.service'
import { TodoService } from '~/services/todo.service'

const container = new Container()

container.bind(TOKENS.database).toConstant(database)

// snapshot
container
    .bind(TOKENS.snapshotService)
    .toInstance(SnapshotService)
    .inTransientScope()

// todos
container.bind(TOKENS.todoService).toInstance(TodoService).inTransientScope()

export { container }
