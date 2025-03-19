<script lang="ts" setup>
    import { useRegisterSW } from 'virtual:pwa-register/vue'
    import { useAlert } from '@volverjs/ui-vue/composables'
    import { useSettingsStore, useDialog } from 'composables'

    const appName = import.meta.env.VITE_APP_NAME
    const { t, locale } = useI18n()
    const route = useRoute()

    // session
    const auth = useAuth()
    const session = auth.useSession()

    // alert
    const { alerts, removeAlert } = useAlert()

    // dialog
    const { PjGlobalDialog } = useDialog()

    // head
    useHead({
        title: import.meta.env.VITE_APP_NAME,
        htmlAttrs: { lang: locale },
    })

    // pwa
    const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW()
    const onPwaCancel = () => {
        offlineReady.value = false
        needRefresh.value = false
    }

    // theme
    const settingsStore = useSettingsStore()
    const { hasThemes } = useFeatures()
    const themeClass = computed(() => {
        if (!hasThemes) {
            return 'theme--light'
        }
        return settingsStore.hasDarkTheme ? 'theme--dark' : 'theme--light'
    })
</script>

<template>
    <div class="h-full theme" :class="themeClass">
        <Transition mode="out-in">
            <div
                v-if="session.isPending"
                class="h-full flex items-center justify-center">
                <PkLoader />
            </div>
            <div
                v-else-if="!session.data?.user"
                class="h-full flex items-center justify-center">
                <!-- #region main -->
                <main class="main">
                    <RouterView v-slot="scope">
                        <Transition mode="out-in">
                            <Component
                                :is="scope.Component"
                                v-if="scope"
                                :key="route.path" />
                        </Transition>
                    </RouterView>
                </main>
                <!-- #endregion -->
            </div>
            <div v-else class="parent">
                <!-- #region sidebar -->
                <div v-if="session.data?.user" class="sidebar">
                    <VvAction
                        class="my-md"
                        :to="{ name: '/frontoffice/' }"
                        :title="$t('action.backToHome')">
                        <div class="flex gap-md mb-xs">
                            <VvIcon
                                name="volverjs"
                                prefix="custom"
                                class="w-auto h-44 text-white" />
                            <strong class="flex-1 font-bold leading-normal">
                                {{ appName }}
                            </strong>
                        </div>
                    </VvAction>
                    <!-- #region nav -->
                    <RouterView v-slot="scope" name="nav">
                        <Transition mode="out-in">
                            <Component :is="scope.Component" v-if="scope" />
                        </Transition>
                    </RouterView>
                    <!-- #endregion -->
                    <div class="flex items-center mt-auto gap-md">
                        <VvAvatar modifiers="rounded word">
                            {{
                                session.data.user.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                            }}
                        </VvAvatar>
                        <span class="text-smaller">
                            {{ session.data.user.name }}
                        </span>
                        <VvButton
                            modifiers="action-quiet"
                            icon="logout"
                            :title="$t('action.signOut')"
                            @click="auth.signOut" />
                    </div>
                </div>
                <!-- #endregion -->

                <!-- #region main -->
                <main class="main">
                    <RouterView v-slot="scope">
                        <Transition mode="out-in">
                            <Component :is="scope.Component" v-if="scope" />
                        </Transition>
                    </RouterView>
                </main>
                <!-- #endregion -->
            </div>
        </Transition>

        <!-- #region PWA -->
        <VvAlertGroup inline="end" block="bottom" position="fixed" name="pwa">
            <VvAlert
                v-if="offlineReady || needRefresh"
                role="alertdialog"
                modifiers="notification">
                {{ t('pwaText') }}
                <small class="block text-smaller mt-4">
                    {{ t('pwaInfo') }}
                </small>
                <template #footer>
                    <VvButtonGroup class="ml-auto">
                        <VvButton
                            modifiers="action"
                            :label="$t('action.update')"
                            @click="updateServiceWorker" />
                        <VvButton
                            modifiers="action-quiet"
                            :label="$t('action.cancel')"
                            @click="onPwaCancel" />
                    </VvButtonGroup>
                </template>
            </VvAlert>
        </VvAlertGroup>
        <!-- #endregion -->

        <!-- #region global alerts -->
        <VvAlertGroup
            :items="alerts"
            inline="middle"
            block="bottom"
            stack
            reverse
            position="fixed"
            name="default"
            @close="removeAlert" />
        <!-- #endregion -->

        <!-- #region global dialogs -->
        <PjGlobalDialog />
        <!-- #endregion -->
    </div>
</template>

<style lang="scss">
    .parent {
        display: grid;
        height: 100%;
        grid-template: auto / var(--spacing-240) 1fr;
    }

    .sidebar {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: auto;
        padding: var(--spacing-sm);
        border-right: var(--spacing-1) solid var(--color-surface-3);
    }

    .main {
        background-color: var(--color-surface);
        overflow: hidden;
        overflow: auto;
        height: 100%;
    }
</style>

<i18n lang="json">
{
    "it": {
        "pwaText": "È disponibile un nuovo aggiornamento. Vuoi procedere con l'installazione?",
        "pwaInfo": "Il browser verrà ricaricato automaticamente."
    },
    "en": {
        "pwaText": "A new update is available. Do you want to proceed with the installation?",
        "pwaInfo": "The browser will be reloaded automatically."
    }
}
</i18n>
