import type { UserWithRole } from 'better-auth/plugins'

export type BetterAuthQuery = {
    searchFieald?: 'email' | 'name'
    searchOperator?: 'contains' | 'starts_with' | 'ends_with'
    searchValue?: string
    limit?: number
    offset?: number
    sortBy?: string
    sortDirection?: 'asc' | 'desc'
    filterField?: string
    filterOperator?: 'eq'
    filterValue?: string
}

export type Query = {
    page?: number | string
    limit?: number | string
    sort?: string
    order?: 'asc' | 'desc'
}

export const useUsers = () => {
    const auth = useAuth()

    const read = (
        query: Query | Ref<Query>,
        options: {
            immdeiate?: boolean
        },
    ) => {
        const data = ref<UserWithRole[]>()
        const total = ref<number>()
        const error = ref<Error>()
        const isLoading = ref(false)
        const isError = computed(() => !!error.value)
        const item = computed(() => data.value?.[0])
        const metadata = computed(() => ({
            total: total.value || data.value?.length,
        }))

        const execute = async (customQuery?: Query) => {
            isLoading.value = true
            error.value = undefined
            const currentQuery = customQuery ?? unref(query)
            const betterAuthQuery: BetterAuthQuery = {
                limit: Number(currentQuery.limit),
                offset: Number(currentQuery.page) - 1,
                sortBy: customQuery?.sort,
                sortDirection: customQuery?.order,
            }
            const result = await auth.admin.listUsers({
                query: betterAuthQuery,
            })
            isLoading.value = false
            data.value = result.data?.users
            total.value = result.data?.total
        }

        watch(
            query,
            async () => {
                await execute()
            },
            {
                immediate: options?.immdeiate,
            },
        )

        return {
            data,
            error,
            metadata,
            isLoading,
            isError,
            item,
            execute,
        }
    }

    return {
        read,
    }
}
