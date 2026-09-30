<script setup lang="ts">
    import { Subject } from 'ability'

    definePage({
        meta: {
            hasSidebar: true,
            can: ['manage', Subject.All],
        },
    })
</script>

<template>
    <RouterView />
</template>
