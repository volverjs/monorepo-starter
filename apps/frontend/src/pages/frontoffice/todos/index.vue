<script setup lang="ts">
    /*
     * The reference list page: a table on a store, with its state in the
     * route query, a create dialog on the shared schema and a confirmed
     * delete. A new resource copies it (docs/agents/new-resource.md).
     */
    import type { TableColumn } from 'components'
    import type { Todo, TodoDto } from 'models'
    import type { Action } from 'ability'
    import { useAbility } from '@casl/vue'
    import { useForm } from '@volverjs/form-vue'
    import { useAlert } from '@volverjs/ui-vue/composables'
    import { useRouteQuery } from '@vueuse/router'
    import { Subject, subject } from 'ability'
    import { useDialogConfirm, useRoutePagination } from 'composables'
    import { TodoDtoSchema } from 'models'
    import { useTodoStore } from '~/stores/useTodoStore'

    const { t } = useI18n()
    const { t: $t } = useI18n({ useScope: 'global' })
    const router = useRouter()
    const { addAlert } = useAlert()
    const { openDialogConfirm } = useDialogConfirm()

    // The browser ability mirrors the backend one (packages/ability): it only
    // hides what the API would refuse, the API still decides.
    const { can } = useAbility()
    const canOn = (action: Action, todo: Todo) =>
        can(action, subject(Subject.Todo, todo))

    // #region list
    // Page, sort and filters live in the route query: a reload or a shared
    // link opens the same view.
    const { page, limit, sort, order } = useRoutePagination({
        defaultSort: 'updatedAt',
        defaultOrder: 'desc',
    })
    const search = useRouteQuery<string>('search', '')
    const status = useRouteQuery<'all' | 'open' | 'done'>('status', 'all')

    // The querystring of the API, see TodoQuerystringSchema (packages/models)
    const params = computed(() => ({
        'page[number]': page.value,
        'page[size]': limit.value,
        sort: `${order.value === 'desc' ? '-' : ''}${sort.value}`,
        'filter[fullText]': search.value || undefined,
        'filter[done]':
            status.value === 'all' ? undefined : status.value === 'done',
    }))

    const { read, submit, remove } = useTodoStore()
    const {
        data,
        metadata,
        isLoading,
        isError,
        execute: executeRead,
    } = read(params, { autoExecute: true })

    const columns = computed<TableColumn<Todo>[]>(() => [
        { name: 'done', label: t('column.done'), class: 'w-80 text-center' },
        { name: 'title', label: $t('label.title'), sortable: true },
        {
            name: 'updatedAt',
            label: $t('label.updatedAt'),
            sortable: true,
            class: 'w-160',
        },
        { name: 'actions', class: 'w-64' },
    ])
    // #endregion

    // #region write
    // One submit and one remove, executed on demand with the row they target.
    // Every write reloads the list: a toggled todo may leave the filter.
    const { execute: executeSubmit, isLoading: isSubmitting } = submit(
        undefined,
        undefined,
        { immediate: false },
    )
    const { execute: executeRemove } = remove(undefined, { immediate: false })

    const onToggleDone = async (todo: Todo, done: boolean) => {
        const { isSuccess } = await executeSubmit({
            id: todo.id,
            title: todo.title,
            notes: todo.notes,
            done,
        })
        if (isSuccess) {
            await executeRead(true)
        }
    }

    const onRemove = async (todo: Todo) => {
        if (!(await openDialogConfirm())) {
            return
        }
        const { isSuccess } = await executeRemove({ id: todo.id })
        if (isSuccess) {
            addAlert({
                modifiers: 'success',
                title: $t('message.success'),
                content: t('removed', { title: todo.title }),
            })
            await executeRead(true)
        }
    }
    // #endregion

    // #region create
    // The dialog asks for the title only, the detail page does the rest. A
    // failed request keeps the dialog open: the HttpClient already shows the
    // problem+json alert.
    const {
        VvForm: FormCreate,
        VvFormField: FormFieldCreate,
        reset: resetCreate,
    } = useForm(TodoDtoSchema.pick({ title: true }), { lazyLoad: true })
    const isCreateDialogOpen = ref(false)

    const onCreate = () => {
        resetCreate()
        isCreateDialogOpen.value = true
    }

    const onSubmitCreate = async (todo: TodoDto) => {
        const { isSuccess, item } = await executeSubmit(todo)
        if (isSuccess && item) {
            isCreateDialogOpen.value = false
            await router.push({
                name: '/frontoffice/todos/[id]',
                params: { id: item.id },
            })
        }
    }
    // #endregion
</script>

<template>
    <PjMain :title="$t('route.todos')">
        <template #actions>
            <VvButton
                v-if="can('create', Subject.Todo)"
                :label="$t('action.create')"
                icon="add"
                @click="onCreate" />
        </template>

        <div class="flex items-center justify-between gap-sm flex-wrap mb-md">
            <PjSearchFullText v-model="search" />
            <!-- In a toggle group the button is pressed when its `name` equals
                 the group value: `name` is also the value it sets. -->
            <VvButtonGroup
                v-model="status"
                toggle
                :unselectable="false"
                item-modifiers="secondary">
                <VvButton name="all" :label="t('status.all')" />
                <VvButton name="open" :label="t('status.open')" />
                <VvButton name="done" :label="t('status.done')" />
            </VvButtonGroup>
        </div>

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
            <template #col::done="{ row }">
                <VvCheckbox
                    :id="`todo-done-${row.id}`"
                    name="done"
                    switch
                    :value="true"
                    :unchecked-value="false"
                    :model-value="row.done"
                    :disabled="isSubmitting || !canOn('update', row)"
                    :aria-label="t('toggleDone', { title: row.title })"
                    @update:model-value="onToggleDone(row, $event)" />
            </template>
            <template #col::title="{ row }">
                <RouterLink
                    class="text-word underline"
                    :class="{ 'line-through text-word-3': row.done }"
                    :to="{
                        name: '/frontoffice/todos/[id]',
                        params: { id: row.id },
                    }">
                    {{ row.title }}
                </RouterLink>
            </template>
            <template #col::updatedAt="{ row }">
                <time
                    :datetime="row.updatedAt.toISOString()"
                    class="whitespace-nowrap">
                    {{ $d(row.updatedAt, 'date-time') }}
                </time>
            </template>
            <template #col::actions="{ row }">
                <VvButton
                    v-if="canOn('delete', row)"
                    icon="trash"
                    modifiers="action-quiet"
                    :aria-label="$t('action.delete')"
                    @click="onRemove(row)" />
            </template>
            <template #error>
                <PkTableError />
            </template>
            <template #empty>
                <PkTableEmpty />
            </template>
        </PkTableSortable>

        <VvDialog
            v-model="isCreateDialogOpen"
            :title="t('newTodo')"
            modifiers="small">
            <FormCreate
                id="form-create-todo"
                class="p-sm"
                @submit="onSubmitCreate">
                <FormFieldCreate
                    type="text"
                    name="title"
                    :label="$t('label.title')"
                    autofocus />
            </FormCreate>
            <template #footer>
                <VvButtonGroup>
                    <VvButton
                        :label="$t('action.cancel')"
                        modifiers="secondary"
                        @click="isCreateDialogOpen = false" />
                    <VvButton
                        :label="$t('action.create')"
                        :loading="isSubmitting"
                        :disabled="isSubmitting"
                        type="submit"
                        form="form-create-todo" />
                </VvButtonGroup>
            </template>
        </VvDialog>
    </PjMain>
</template>

<i18n lang="yaml">
en:
    column:
        done: Done
    status:
        all: All
        open: Open
        done: Done
    newTodo: New todo
    toggleDone: 'Mark "{title}" as done'
    removed: '"{title}" deleted'
it:
    column:
        done: Fatto
    status:
        all: Tutti
        open: Da fare
        done: Fatti
    newTodo: Nuovo todo
    toggleDone: 'Segna "{title}" come fatto'
    removed: '"{title}" eliminato'
</i18n>
