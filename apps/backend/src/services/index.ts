import type { User } from 'better-auth'
import type { Querystring } from 'models'
import type { PagedResponse } from '~/plugins/fastifyPagination'

export interface CrudService<
    InputType = Record<string, unknown>,
    OutputType = Record<string, unknown>,
> {
    create(item: InputType, currentUser: User): Promise<OutputType>

    read(queryOrKey: unknown): Promise<OutputType>
    read(queryOrKey: Querystring): Promise<PagedResponse<OutputType>>
    read(
        queryOrKey: Querystring | unknown,
    ): Promise<OutputType | PagedResponse<OutputType>>

    update(
        itemKey: unknown,
        item: InputType,
        currentUser: User,
    ): Promise<OutputType>

    delete(itemKey: string, currentUser: User): Promise<boolean>
}
