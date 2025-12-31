<script setup lang="ts">
    import { useSettingsStore } from 'composables'
    import { authClient } from '../modules/auth'

    // settings
    const settingsStore = useSettingsStore()

    // session
    const auth = useAuth()
    const session = auth.useSession()

    const isImpersonating = computed(() => {
        return !!session.value.data?.session.impersonatedBy
    })

    const stopImpersonating = async () => {
        await authClient.admin.stopImpersonating()
        window.location.reload()
    }

    const onClickSignOut = async () => {
        await auth.signOut()
    }
</script>

<template>
    <div class="sidebar">
        <VvButton
            class="md:none absolute top-sm right-sm"
            icon="close"
            modifiers="action-quiet"
            @click="settingsStore.toggleSidebarOpen()" />
        <slot />
        <div v-if="session.data?.user" class="flex items-center mt-auto gap-md">
            <PjAvatar modifiers="rounded word" :name="session.data.user.name" />
            <span class="text-smaller">
                {{ session.data.user.name }}
                <span v-if="isImpersonating" class="text-smaller">
                    ({{ $t('label.impersonated') }})
                </span>
            </span>
            <VvButton
                v-if="isImpersonating"
                modifiers="action-quiet"
                class="ml-auto"
                icon="hugeicons:user-switch"
                :title="$t('action.stopImpersonation')"
                @click="stopImpersonating" />
            <VvButton
                v-else
                modifiers="action-quiet"
                class="ml-auto"
                icon="logout"
                :title="$t('action.signOut')"
                @click="onClickSignOut" />
        </div>
    </div>
</template>

<style lang="scss">
    .sidebar {
        display: flex;
        flex-direction: column;
        overflow: auto;
        padding: var(--spacing-sm);
        border-right: var(--spacing-1) solid var(--color-surface-3);
        background-color: var(--color-surface-1);
    }
</style>
