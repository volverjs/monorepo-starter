<script lang="ts">
    export default {
        inheritAttrs: false,
    }
</script>

<script lang="ts" setup>
    withDefaults(
        defineProps<{
            loading?: boolean
            rows?: number | string
        }>(),
        {
            loading: true,
            rows: 1,
        },
    )
</script>

<template>
    <Transition mode="out-in">
        <div v-if="loading" class="vv-skeleton">
            <slot name="skeleton">
                <div
                    v-for="i in typeof rows === 'string'
                        ? parseInt(rows)
                        : rows"
                    :key="i"
                    class="vv-skeleton__item"
                    :class="$attrs.class"></div>
            </slot>
        </div>
        <slot v-else />
    </Transition>
</template>
