<script setup lang="ts">
    defineProps<{
        name?: string
    }>()
    const getInitials = (name?: string) => {
        if (!name) {
            return ''
        }
        return name
            .split(' ')
            .map((n) => n.charAt(0).toUpperCase())
            .join('')
    }
</script>

<template>
    <VvAvatar>
        {{ getInitials(name) }}
    </VvAvatar>
</template>
