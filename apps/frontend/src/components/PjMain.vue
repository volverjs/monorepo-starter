<script setup lang="ts">
    defineProps<{
        title?: string
    }>()
</script>

<template>
    <div class="flex flex-col min-h-full">
        <PjHeader>
            <slot name="header" />
        </PjHeader>
        <div class="flex flex-col flex-1 p-lg">
            <div class="flex items-center justify-between mb-lg">
                <slot name="title">
                    <h1 v-if="title" class="font-bold text-lg">
                        {{ title }}
                    </h1>
                </slot>
                <slot name="actions" />
            </div>
            <slot />
        </div>
    </div>
</template>
