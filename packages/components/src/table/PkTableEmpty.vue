<script setup lang="ts">
    import { VvIcon } from '@volverjs/ui-vue/components'
</script>

<template>
    <div
        class="flex flex-col items-center justify-center w-full text-md p-md leading-normal">
        <div class="mb-4">
            <VvIcon name="akar-icons:face-sad" class="text-32 text-word-2" />
        </div>
        <strong class="font-bold">
            {{ $t('message.warning') }}
        </strong>
        <div class="text-smaller text-word-3">
            {{ $t('message.empty') }}
        </div>
    </div>
</template>
