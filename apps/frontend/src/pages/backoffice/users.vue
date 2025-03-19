<script setup lang="ts">
    import { useAbility } from '@casl/vue'
    import { Subject } from 'ability'
    import type { UserWithRole } from 'better-auth/plugins'
    import type { TableColumn } from 'components'
    import { useRoutePagination } from 'composables'
    import { useUsers } from '~/composables/useUsers'

    const { t: $t } = useI18n({
        useScope: 'global',
    })

    const { can } = useAbility()
    const auth = useAuth()
    const session = auth.useSession()

    const columns: ComputedRef<TableColumn<UserWithRole>[]> = computed(() => [
        {
            label: $t('label.completeName'),
            name: 'name',
            sortable: true,
        },
        {
            label: $t('label.role'),
            name: 'role',
            class: 'text-center',
        },
        {
            label: $t('label.email'),
            name: 'email',
        },
        {
            label: $t('label.emailVerified'),
            name: 'emailVerified',
            class: 'text-center',
        },
        {
            label: $t('label.createdAt'),
            name: 'createdAt',
            sortable: true,
        },
        {
            name: 'actions',
            class: 'w-64',
            checkable: true,
        },
    ])

    const { page, limit, sort, order } = useRoutePagination({
        defaultSort: 'lastName',
        defaultOrder: 'asc',
    })
    const filters = reactive({
        fullText: '',
    })

    const { read: readUsers } = useUsers()
    const { data, isLoading, isError, metadata } = readUsers(
        computed(() => ({
            page: page.value,
            limit: limit.value,
            sort: sort.value,
            order: order.value,
        })),
        {
            immdeiate: true,
        },
    )
</script>

<template>
    <PjMain :title="$t('route.users')">
        <template #header>
            <div class="flex-1">
                <PjSearchFullText v-model="filters.fullText" />
            </div>
        </template>

        <template #create>
            <VvButton
                v-if="can('create', Subject.User)"
                :label="$t('action.create')"
                icon="add"
                icon-position="right"
                :to="{ name: '/backoffice/users/edit/[[id]]' }" />
        </template>

        <!-- #region table -->
        <PkTableSortable
            v-bind="{
                columns,
                data,
                isError,
                isLoading,
                total: metadata?.total,
                classTable: 'vv-table--inline-spacing',
            }"
            v-model:page="page"
            v-model:limit="limit"
            v-model:sort="sort"
            v-model:order="order">
            <template #col::name="{ row }">
                <div class="flex items-center gap-xs">
                    <VvAvatar modifiers="rounded ring surface">
                        {{
                            row.name
                                .split(' ')
                                .map((name) => name.charAt(0).toUpperCase())
                                .join('')
                        }}
                    </VvAvatar>
                    {{ row.name }}
                </div>
            </template>
            <template #col::role="{ row }">
                <VvBadge modifiers="outline gray">{{ row.role }}</VvBadge>
            </template>

            <template #col::emailVerified="{ row }">
                <VvCheckbox
                    :id="'checkbox_' + row.id"
                    switch
                    name="emailVerified"
                    modifiers="no-label"
                    :value="true"
                    :unchecked-value="false"
                    :model-value="row.emailVerified"
                    :disabled="session.data?.user.id === row.id"
                    readonly />
            </template>

            <template #col::createdAt="{ row }">
                {{ $d(row.createdAt, 'date-time') }}
            </template>

            <template #col::actions>
                <VvDropdown
                    v-bind="{
                        modifiers: 'full-bleed',
                        placement: 'bottom-end',

                        flip: true,
                        offset: 5,
                        arrow: true,
                    }">
                    <VvButton
                        v-bind="{
                            modifiers: 'action-quiet',
                            icon: {
                                name: 'akar-icons:more-vertical',
                            },
                        }" />
                </VvDropdown>
            </template>

            <template #error>
                <PkTableError />
            </template>

            <template #empty>
                <PkTableEmpty />
            </template>
        </PkTableSortable>
        <!-- #endregion -->
    </PjMain>
</template>
