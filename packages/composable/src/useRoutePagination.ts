import { type Ref } from 'vue'
import { useRouteQuery } from '@vueuse/router'

export const useRoutePagination = function ({
    defaultPage = 1,
    defaultLimit = 10,
    defaultOrder = 'asc',
    defaultSort,
}: {
    defaultPage?: number
    defaultLimit?: number
    defaultOrder?: 'asc' | 'desc'
    defaultSort?: string
} = {}) {
    const page: Ref<string | number> = useRouteQuery(
        'page',
        defaultPage.toString(),
    )
    const limit: Ref<string | number> = useRouteQuery(
        'limit',
        defaultLimit.toString(),
    )
    const order = useRouteQuery<'asc' | 'desc'>('order', defaultOrder)
    const sort = useRouteQuery('sort', defaultSort)
    return { page, limit, sort, order }
}
