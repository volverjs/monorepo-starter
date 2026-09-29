<script setup lang="ts">
    // Logo and names come from the VITE_APP_* settings of apps/frontend/.env
    // and packages/icons/src/logo.svg: rename a project there, not here.
    withDefaults(
        defineProps<{
            compact?: boolean
        }>(),
        {
            compact: false,
        },
    )

    const shortName = import.meta.env.VITE_APP_SHORT_NAME
    const tagline = import.meta.env.VITE_APP_TAGLINE
</script>

<template>
    <div v-if="compact" class="flex gap-md items-center">
        <VvIcon
            name="logo"
            prefix="custom"
            class="w-auto h-32 text-white rounded-full" />
        <strong class="font-bold">{{ shortName }}</strong>
    </div>
    <div v-else class="flex gap-md mb-xs">
        <VvIcon name="logo" prefix="custom" class="w-auto h-44 text-white" />
        <div class="flex-1 leading-normal">
            <strong class="font-bold">{{ shortName }}</strong>
            <span v-if="tagline" class="text-smaller text-word-2 block">
                {{ tagline }}
            </span>
        </div>
    </div>
</template>
