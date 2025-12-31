<script lang="ts" setup>
    import { Subject } from 'ability'
    import { useAbility } from '@casl/vue'

    const { t: $t } = useI18n({
        useScope: 'global',
    })
    const { can } = useAbility()

    const items = computed(() => [
        {
            to: { name: '/frontoffice/dashboard' },
            label: $t('route.dashboard'),
            icon: 'dashboard',
        },
    ])
</script>

<template>
    <PjSidebar>
        <VvAction
            class="my-md"
            :to="{ name: '/frontoffice/' }"
            :title="$t('action.backToHome')">
            <div class="flex gap-md mb-xs">
                <VvIcon
                    name="volverjs"
                    prefix="custom"
                    class="w-auto h-44 text-white" />
                <div class="flex-1 leading-normal">
                    <strong class="font-bold">Volver.js</strong>
                    <span class="text-smaller text-word-2 block">
                        Startup Template
                    </span>
                </div>
            </div>
        </VvAction>
        <VvNav modifiers="sidebar">
            <li class="vv-nav__item">
                <span id="sidebar-label-1" class="vv-nav__heading-label">
                    {{ $t('route.frontoffice') }}
                </span>
            </li>
            <VvNavItem
                v-for="item in items"
                :key="item.to.name"
                class="flex gap-md"
                :to="item.to">
                <VvIcon :name="item.icon" class="w-16 h-16" />
                {{ item.label }}
            </VvNavItem>
            <template v-if="can('manage', Subject.All)">
                <VvNavSeparator />
                <VvNavItem class="flex gap-md" :to="{ name: '/backoffice/' }">
                    <VvIcon name="settings" class="w-16 h-16" />
                    {{ $t('route.backoffice') }}
                    <VvIcon name="chevron-right" class="w-16 w-16 ml-auto" />
                </VvNavItem>
            </template>
        </VvNav>
    </PjSidebar>
</template>
