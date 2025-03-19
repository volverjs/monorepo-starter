<script lang="ts" setup>
    const { t: $t } = useI18n({
        useScope: 'global',
    })
    const items = computed(() => [
        {
            to: { name: '/backoffice/' },
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
    <VvNav modifiers="sidebar">
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
</template>
