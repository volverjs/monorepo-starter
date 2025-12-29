<script setup lang="ts">
    import { useAbility } from '@casl/vue'
    import { subject } from 'ability'
    import { VvDialog } from '@volverjs/ui-vue/components'
    import { useAlert } from '@volverjs/ui-vue/composables'
    import { Subject } from 'ability'
    import type { User } from 'auth'
    import type { TableColumn } from 'components'
    import { useDialogConfirm, useRoutePagination } from 'composables'
    import { useUsers } from '~/composables/useUsers'
    import { authClient, UserRoles } from '~/modules/auth'
    import z from 'zod'
    import { useForm } from '@volverjs/form-vue'

    const { t } = useI18n()
    const { t: $t } = useI18n({
        useScope: 'global',
    })

    const auth = useAuth()
    const { can } = useAbility()
    const { addAlert } = useAlert()
    const session = auth.useSession()
    const { openDialogConfirm } = useDialogConfirm()

    const columns: ComputedRef<TableColumn<User>[]> = computed(() => [
        {
            name: 'banned',
            class: 'text-center p-0',
        },
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

    const { read: readUsers } = useUsers()
    const {
        data,
        isLoading,
        isError,
        metadata,
        execute: executeRead,
    } = readUsers(
        computed(() => ({
            page: page.value,
            limit: limit.value,
            sort: sort.value,
            order: order.value,
        })),
        {
            immediate: true,
        },
    )

    const roleOptions = computed(() => {
        return [
            {
                label: $t('label.user'),
                value: UserRoles.User,
            },
            {
                label: $t('label.admin'),
                value: UserRoles.Admin,
            },
        ]
    })

    // helper: handle success
    const handleSuccess = async () => {
        addAlert({
            modifiers: 'success',
            title: $t('message.success'),
            content: $t('message.submitSuccess'),
        })
        await executeRead()
    }

    // action: create user
    const isCreateDialogOpen = ref(false)
    const createUserSchema = z
        .object({
            name: z.string().min(1),
            email: z.email(),
            role: z.enum(UserRoles),
            password: z.string().min(8),
            confirmPassword: z.string().min(8),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: $t('message.passwordsDoNotMatch'),
            path: ['confirmPassword'],
        })
    type CreateUser = z.infer<typeof createUserSchema>
    const {
        VvForm: FormCreateUser,
        VvFormField: FormFieldCreateUser,
        formData: createUserFormData,
        reset: resetCreateUserForm,
    } = useForm(createUserSchema, {
        lazyLoad: true,
    })
    const onCreateUser = () => {
        resetCreateUserForm()
        isCreateDialogOpen.value = true
    }
    const onSubmitCreateUser = async () => {
        const { error } = await authClient.admin.createUser(
            createUserFormData.value as unknown as CreateUser,
        )
        if (!error) {
            await handleSuccess()
        }
        isCreateDialogOpen.value = false
    }

    // action: update user
    const isUpdateDialogOpen = ref(false)
    const updateUserId = ref<string>()
    const onUpdateUser = (user: User) => {
        updateUserId.value = user.id
        updateUserFormData.value = {
            name: user.name,
            email: user.email,
            role:
                ((user as User & { role?: string }).role as UserRoles) ||
                UserRoles.User,
        }
        isUpdateDialogOpen.value = true
    }
    const updateUserSchema = z.object({
        name: z.string().min(1),
        email: z.email(),
        role: z.enum(UserRoles),
    })
    type UpdateUser = z.infer<typeof updateUserSchema>
    const {
        VvForm: FormUpdateUser,
        VvFormField: FormFieldUpdateUser,
        formData: updateUserFormData,
    } = useForm(updateUserSchema, {
        lazyLoad: true,
    })
    const onSubmitUpdateUser = async () => {
        const { error } = await authClient.admin.updateUser({
            userId: updateUserId.value as string,
            data: updateUserFormData.value as unknown as UpdateUser,
        })
        if (!error) {
            await handleSuccess()
        }
        isUpdateDialogOpen.value = false
    }

    // action: remove user
    const onRemoveUser = async (user: User) => {
        const proceed = await openDialogConfirm()
        if (!proceed) {
            return
        }
        const { error } = await authClient.admin.removeUser({
            userId: user.id,
        })
        if (!error) {
            await handleSuccess()
        }
    }

    // action: ban / unban user
    const onBanUser = async (user: User) => {
        const proceed = await openDialogConfirm()
        if (!proceed) {
            return
        }
        const { error } = await authClient.admin.banUser({
            userId: user.id,
        })
        if (!error) {
            await handleSuccess()
        }
    }
    const onUnbanUser = async (user: User) => {
        const proceed = await openDialogConfirm()
        if (!proceed) {
            return
        }
        const { error } = await authClient.admin.unbanUser({
            userId: user.id,
        })
        if (!error) {
            await handleSuccess()
        }
    }

    // action: set user password
    const newPasswordUserId = ref<string>()
    const {
        VvForm: FormNewPassword,
        VvFormField: FormFieldNewPassword,
        formData: newPasswordFormData,
        reset: resetNewPasswordForm,
    } = useForm(
        z
            .object({
                password: z.string().min(8),
                confirmPassword: z.string().min(8),
            })
            .refine((data) => data.password === data.confirmPassword, {
                message: $t('message.passwordsDoNotMatch'),
                path: ['confirmPassword'],
            }),
        {
            lazyLoad: true,
        },
    )
    const isNewPasswordDialogOpen = ref(false)
    const onSetUserPassword = (userId: string) => {
        resetNewPasswordForm()
        newPasswordUserId.value = userId
        isNewPasswordDialogOpen.value = true
    }

    const onSubmitUserPassword = async () => {
        const { error } = await authClient.admin.setUserPassword({
            userId: newPasswordUserId.value as string,
            newPassword: newPasswordFormData.value
                ?.password as unknown as string,
        })
        if (!error) {
            await handleSuccess()
        }
        isNewPasswordDialogOpen.value = false
    }

    // action: impersonate user
    const onImpersonateUser = async (userId: string) => {
        const { error } = await authClient.admin.impersonateUser({
            userId: userId,
        })
        if (!error) {
            window.location.reload()
        }
    }
</script>

<template>
    <PjMain :title="$t('route.users')">
        <template #actions>
            <VvButton
                v-if="can('create', Subject.User)"
                :label="$t('action.create')"
                icon="add"
                @click="onCreateUser" />
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
                    <PjAvatar
                        modifiers="rounded ring surface"
                        :name="row.name" />
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

            <template #col::banned="{ row }">
                <VvBadge
                    v-if="row.banned"
                    modifiers="outline danger"
                    :value="$t('label.banned')" />
            </template>

            <template #col::actions="{ row }">
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
                    <template #items>
                        <VvDropdownAction
                            v-if="can('update', subject(Subject.User, row))"
                            @click="onUpdateUser(row)">
                            <VvIcon name="edit" />
                            {{ $t('action.update') }}
                        </VvDropdownAction>
                        <VvDropdownAction
                            v-if="
                                can('update', subject(Subject.User, row)) &&
                                row.id !== session.data?.user.id
                            "
                            @click="onRemoveUser(row)">
                            <VvIcon name="trash" />
                            {{ $t('action.delete') }}
                        </VvDropdownAction>
                        <VvDropdownAction
                            v-if="
                                can('update', subject(Subject.User, row)) &&
                                !row.banned &&
                                row.id !== session.data?.user.id
                            "
                            @click="onBanUser(row)">
                            <VvIcon name="lock" />
                            {{ $t('action.banUser') }}
                        </VvDropdownAction>
                        <VvDropdownAction
                            v-if="
                                can('update', subject(Subject.User, row)) &&
                                row.banned &&
                                row.id !== session.data?.user.id
                            "
                            @click="onUnbanUser(row)">
                            <VvIcon name="unlock" />
                            {{ $t('action.unbanUser') }}
                        </VvDropdownAction>
                        <VvDropdownAction
                            v-if="can('update', subject(Subject.User, row))"
                            @click="onSetUserPassword(row.id)">
                            <VvIcon name="key" />
                            {{ $t('label.setUserPassword') }}
                        </VvDropdownAction>
                        <VvDropdownAction
                            v-if="
                                can(
                                    'impersonate',
                                    subject(Subject.User, row),
                                ) && row.id !== session.data?.user.id
                            "
                            @click="onImpersonateUser(row.id)">
                            <VvIcon name="hugeicons:user-switch" />
                            {{ $t('action.impersonateUser') }}
                        </VvDropdownAction>
                    </template>
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

        <VvDialog
            v-model="isCreateDialogOpen"
            :title="t('title.createUser')"
            size="small">
            <FormCreateUser
                id="form-create-user"
                class="p-sm"
                @submit="onSubmitCreateUser">
                <FormFieldCreateUser
                    :label="$t('label.role')"
                    :options="roleOptions"
                    :placeholder="$t('placeholder.select')"
                    type="combobox"
                    name="role"
                    strategy="fixed" />
                <FormFieldCreateUser
                    type="text"
                    :label="$t('label.completeName')"
                    name="name" />
                <FormFieldCreateUser
                    type="email"
                    :label="$t('label.email')"
                    name="email" />
                <FormFieldCreateUser
                    type="password"
                    :label="$t('label.password')"
                    name="password"
                    minlength="8" />
                <FormFieldCreateUser
                    type="password"
                    :label="$t('label.confirmPassword')"
                    name="confirmPassword"
                    minlength="8" />
            </FormCreateUser>
            <template #footer>
                <VvButtonGroup>
                    <VvButton
                        :label="$t('action.cancel')"
                        modifiers="secondary"
                        @click="isCreateDialogOpen = false" />
                    <VvButton
                        :label="$t('action.create')"
                        :loading="isLoading"
                        :disabled="isLoading"
                        type="submit"
                        form="form-create-user" />
                </VvButtonGroup>
            </template>
        </VvDialog>

        <VvDialog
            v-model="isUpdateDialogOpen"
            :title="t('title.updateUser')"
            size="small">
            <FormUpdateUser
                id="form-update-user"
                class="p-sm"
                @submit="onSubmitUpdateUser">
                <FormFieldUpdateUser
                    :label="$t('label.role')"
                    :options="roleOptions"
                    :placeholder="$t('placeholder.select')"
                    :readonly="updateUserId === session.data?.user.id"
                    type="combobox"
                    name="role"
                    strategy="fixed" />
                <FormFieldUpdateUser
                    type="text"
                    :label="$t('label.completeName')"
                    name="name" />
                <FormFieldUpdateUser
                    type="email"
                    :label="$t('label.email')"
                    name="email" />
            </FormUpdateUser>
            <template #footer>
                <VvButtonGroup>
                    <VvButton
                        :label="$t('action.cancel')"
                        modifiers="secondary"
                        @click="isUpdateDialogOpen = false" />
                    <VvButton
                        :label="$t('action.update')"
                        :loading="isLoading"
                        :disabled="isLoading"
                        type="submit"
                        form="form-update-user" />
                </VvButtonGroup>
            </template>
        </VvDialog>

        <VvDialog
            v-model="isNewPasswordDialogOpen"
            :title="t('title.resetUserPassword')"
            size="small">
            <div class="p-sm">
                <FormNewPassword
                    id="form-new-password"
                    @submit="onSubmitUserPassword">
                    <FormFieldNewPassword
                        type="password"
                        :label="$t('label.password')"
                        minlength="8"
                        name="password" />
                    <FormFieldNewPassword
                        type="password"
                        :label="$t('label.confirmPassword')"
                        minlength="8"
                        name="confirmPassword" />
                </FormNewPassword>
            </div>
            <template #footer>
                <VvButtonGroup>
                    <VvButton
                        :label="$t('action.cancel')"
                        modifiers="secondary"
                        @click="isNewPasswordDialogOpen = false" />
                    <VvButton
                        :label="$t('action.update')"
                        :loading="isLoading"
                        :disabled="isLoading"
                        type="submit"
                        form="form-new-password" />
                </VvButtonGroup>
            </template>
        </VvDialog>
    </PjMain>
</template>

<i18n lang="yaml">
it:
    title:
        createUser: Crea Utente
        updateUser: Modifica Utente
        resetUserPassword: Reimposta Password
en:
    title:
        createUser: Create User
        updateUser: Update User
        resetUserPassword: Reset Password
</i18n>
