<script lang="ts" setup>
    import { Subject } from 'ability'
    import { useAbility } from '@casl/vue'

    const { t: $t } = useI18n({
        useScope: 'global',
    })
    const { can } = useAbility()

    const items = computed(() => [
        {
            to: { name: '/frontoffice/' },
            label: $t('route.dashboard'),
            icon: 'dashboard',
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
        <template v-if="can('manage', Subject.All)">
            <VvNavSeparator />
            <VvNavItem class="flex gap-md" :to="{ name: '/backoffice/' }">
                <VvIcon name="settings" class="w-16 h-16" />
                {{ $t('route.backoffice') }}
                <VvIcon name="chevron-right" class="w-16 w-16 ml-auto" />
            </VvNavItem>
        </template>
    </VvNav>
</template>
