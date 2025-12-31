<script setup lang="ts">
    import { useSettingsStore } from 'composables'

    const settingsStore = useSettingsStore()
    const { hasThemes } = useFeatures()

    const { locale, availableLocales } = useI18n()
    const setLocale = (newLocale: string) => {
        locale.value = newLocale
    }
</script>

<template>
    <div class="header">
        <VvButton
            v-if="settingsStore.hasSidebar"
            :icon="{
                name: settingsStore.isSidebarOpen
                    ? 'akar-icons:x-small'
                    : 'akar-icons:three-line-horizontal',
            }"
            modifiers="action-quiet"
            class="md:none"
            @click="settingsStore.toggleSidebarOpen()" />
        <VvAction
            :to="{ name: '/' }"
            :title="$t('action.backToHome')"
            class="md:none flex gap-md items-center justify-center">
            <VvIcon
                name="volverjs"
                prefix="custom"
                class="w-auto h-32 text-white rounded-full" />
            <strong class="font-bold">Volver.js</strong>
        </VvAction>
        <div class="flex-1">
            <slot />
        </div>
        <VvButton
            v-if="hasThemes"
            :icon="
                settingsStore.isDarkTheme ? 'akar-icons:sun' : 'akar-icons:moon'
            "
            modifiers="action-quiet"
            :title="$t('action.toggleTheme')"
            class="ml-auto"
            @click.stop="settingsStore.toggleDarkTheme()" />
        <VvDropdown arrow offset="6">
            <VvButton
                :title="$t('label.locale')"
                icon="carbon:language"
                modifiers="action-quiet" />
            <template #items>
                <vv-dropdown-action
                    v-for="item in availableLocales"
                    :key="item"
                    :disabled="item === locale"
                    @click="setLocale(item)">
                    {{ $t(`label.${item}`) }}
                </vv-dropdown-action>
            </template>
        </VvDropdown>
    </div>
</template>

<style lang="scss">
    .header {
        padding-inline: var(--spacing-lg);
        padding-block: var(--spacing-sm);
        display: flex;
        gap: var(--spacing-sm);
        align-items: center;
        border-bottom: var(--spacing-px) solid var(--color-surface-3);
    }
</style>
