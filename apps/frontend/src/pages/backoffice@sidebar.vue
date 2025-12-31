<script lang="ts" setup>
    const { t: $t } = useI18n({
        useScope: 'global',
    })
    const items = computed(() => [
        {
            to: { name: '/backoffice/dashboard' },
            label: $t('route.dashboard'),
            icon: 'dashboard',
        },
        {
            to: { name: '/backoffice/users' },
            label: $t('route.users'),
            icon: 'user',
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
                    {{ $t('route.backoffice') }}
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
            <VvNavSeparator />
            <VvNavItem class="flex gap-md" :to="{ name: '/frontoffice/' }">
                <VvIcon name="chevron-left" class="w-16 h-16" />
                {{ $t('route.frontoffice') }}
            </VvNavItem>
        </VvNav>
    </PjSidebar>
</template>
