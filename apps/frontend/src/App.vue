<script lang="ts" setup>
    import { useRegisterSW } from 'virtual:pwa-register/vue'
    import { useAlert } from '@volverjs/ui-vue/composables'
    import { useSettingsStore, useDialog } from 'composables'

    const appName = import.meta.env.VITE_APP_NAME
    const { t, locale: lang } = useI18n()

    // settings
    const settingsStore = useSettingsStore()

    // session
    const auth = useAuth()
    const session = auth.useSession()

    // alert
    const { alerts, removeAlert } = useAlert()

    // dialog
    const { PjGlobalDialog } = useDialog()

    // head
    useHead({
        title: appName,
        htmlAttrs: {
            lang,
        },
    })

    // pwa
    const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW()
    const onPwaCancel = () => {
        offlineReady.value = false
        needRefresh.value = false
    }
</script>

<template>
    <div class="h-full">
        <Transition mode="out-in">
            <div
                v-if="session.isPending"
                class="h-full flex items-center justify-center">
                <PkLoader />
            </div>
            <div
                v-else
                class="parent"
                :class="{
                    'parent--sidebar': settingsStore.hasSidebar,
                    'parent--sidebar-open': settingsStore.isSidebarOpen,
                }">
                <!-- #region sidebar -->
                <RouterView v-slot="scope" name="sidebar">
                    <Transition mode="out-in">
                        <Component :is="scope.Component" v-if="scope" />
                    </Transition>
                </RouterView>
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
    .main {
        background-color: var(--color-surface);
    }

    .parent {
        display: grid;
        height: 100%;
        grid-template: 1fr / 100dvw 1fr;

        &--sidebar {
            @include media-breakpoint-up('md', $breakpoints) {
                grid-template: auto / var(--spacing-240) 1fr;
            }

            .main {
                overflow: auto;
                margin-left: -100%;
                width: 100dvw;

                @include media-breakpoint-up('md', $breakpoints) {
                    margin-left: 0;
                    width: auto;
                }
            }
        }
    }

    .sidebar {
        opacity: 0;
        transform: translateX(-100%);
        transition: var(--transition-all);
        z-index: var(--z-fixed);

        .parent--sidebar-open & {
            transform: none;
            opacity: 1;
        }

        @include media-breakpoint-up('md', $breakpoints) {
            transform: none;
            opacity: 1;
        }
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
