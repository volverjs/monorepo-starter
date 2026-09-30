<script setup lang="ts">
    /*
     * The reference detail page: one record from the store, edited with the
     * schema the API validates with, read-only when the ability says so, and
     * deleted after a confirmation. A todo the user may not read answers 404,
     * the same as one that does not exist.
     */
    import type { Action } from 'ability'
    import type { TodoDto } from 'models'
    import { useAbility } from '@casl/vue'
    import { defaultObjectBySchema, useForm } from '@volverjs/form-vue'
    import { useAlert } from '@volverjs/ui-vue/composables'
    import { Subject, subject } from 'ability'
    import { useDialogConfirm } from 'composables'
    import { TodoDtoSchema } from 'models'
    import { useTodoStore } from '~/stores/useTodoStore'

    const { t } = useI18n()
    const { t: $t } = useI18n({ useScope: 'global' })
    const route = useRoute('/frontoffice/todos/[id]')
    const router = useRouter()
    const { addAlert } = useAlert()
    const { openDialogConfirm } = useDialogConfirm()

    const id = computed(() => route.params.id)

    const { read, submit, remove } = useTodoStore()
    const {
        item: todo,
        isLoading,
        isError,
    } = read(
        computed(() => ({ id: id.value })),
        { autoExecute: true },
    )

    const { can } = useAbility()
    const canOnTodo = (action: Action) =>
        !!todo.value && can(action, subject(Subject.Todo, todo.value))

    // #region form
    // The stored row reduced to the DTO fields, passed as the form's
    // `:model-value`. Not written into `formData`: VvForm resets its data from
    // its model value when it mounts, which here is after the row has loaded
    // (the form waits behind the skeleton). After a save the store updates
    // the item in place, so the form shows what the server kept.
    const { VvForm, VvFormField } = useForm(TodoDtoSchema, { lazyLoad: true })
    const initialValue = computed(() =>
        todo.value ? defaultObjectBySchema(TodoDtoSchema, todo.value) : {},
    )

    const { execute: executeSubmit, isLoading: isSubmitting } = submit(
        undefined,
        undefined,
        { immediate: false },
    )
    const onSubmit = async (value: TodoDto) => {
        // The id makes it an update: PUT api/v1/todos/:id
        const { isSuccess } = await executeSubmit({ ...value, id: id.value })
        if (isSuccess) {
            addAlert({
                modifiers: 'success',
                title: $t('message.success'),
                content: $t('message.submitSuccess'),
            })
        }
    }
    // #endregion

    // #region delete
    const { execute: executeRemove, isLoading: isRemoving } = remove(
        undefined,
        { immediate: false },
    )
    const onRemove = async () => {
        if (!(await openDialogConfirm())) {
            return
        }
        const { isSuccess } = await executeRemove({ id: id.value })
        if (isSuccess) {
            addAlert({
                modifiers: 'success',
                title: $t('message.success'),
                content: t('removed'),
            })
            await router.push({ name: '/frontoffice/todos/' })
        }
    }
    // #endregion
</script>

<template>
    <PjMain :title="todo?.title ?? t('title')">
        <template #actions>
            <VvButton
                :to="{ name: '/frontoffice/todos/' }"
                icon="arrow-left"
                :label="$t('action.back')"
                modifiers="secondary" />
        </template>

        <p v-if="isError" class="text-word-2">
            {{ t('notFound') }}
        </p>
        <PkSkeleton
            v-else
            :loading="isLoading && !todo"
            rows="4"
            class="h-40 mb-sm">
            <VvForm
                :model-value="initialValue"
                class="flex flex-col gap-md max-w-screen-md"
                :readonly="!canOnTodo('update')"
                @submit="onSubmit">
                <VvFormField
                    type="text"
                    name="title"
                    :label="$t('label.title')" />
                <VvFormField
                    type="checkbox"
                    name="done"
                    :label="$t('label.done')"
                    switch
                    :value="true"
                    :unchecked-value="false" />
                <!-- A custom component in a form: the slot hands over the
                     value, the setter and the validation state. -->
                <VvFormField
                    v-slot="{ modelValue, onUpdate, invalid, invalidLabel }"
                    name="notes">
                    <PkEditorWyswyg
                        :model-value="modelValue"
                        :label="$t('label.notes')"
                        :readonly="!canOnTodo('update')"
                        :invalid
                        :invalid-label="invalidLabel"
                        @update:model-value="onUpdate" />
                </VvFormField>
                <p v-if="todo" class="text-12 text-word-3">
                    {{
                        t('updated', { date: $d(todo.updatedAt, 'date-time') })
                    }}
                </p>
                <div class="flex justify-end gap-sm">
                    <VvButton
                        v-if="canOnTodo('delete')"
                        :label="$t('action.delete')"
                        icon="trash"
                        modifiers="danger"
                        :loading="isRemoving"
                        :disabled="isRemoving"
                        @click="onRemove" />
                    <VvButton
                        v-if="canOnTodo('update')"
                        :label="$t('action.submit')"
                        type="submit"
                        :loading="isSubmitting"
                        :disabled="isSubmitting" />
                </div>
            </VvForm>
        </PkSkeleton>
    </PjMain>
</template>

<i18n lang="yaml">
en:
    title: Todo
    notFound: This todo does not exist, or it is not yours.
    updated: 'Last updated {date}'
    removed: Todo deleted
it:
    title: Todo
    notFound: Questo todo non esiste, oppure non è tuo.
    updated: 'Ultima modifica {date}'
    removed: Todo eliminato
</i18n>
