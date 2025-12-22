<script setup lang="ts">
    import { useVModel } from '@vueuse/core'

    const props = withDefaults(
        defineProps<{
            modelValue?: string
            name?: string
            debounce?: number
        }>(),
        {
            modelValue: undefined,
            name: 'fullText',
            debounce: 1000,
        },
    )
    const emit = defineEmits<{
        'update:modelValue': [string]
    }>()

    const { t: $t } = useI18n({ useScope: 'global' })

    const modelValue = useVModel(props, 'modelValue', emit)
</script>

<template>
    <VvInputText
        v-model="modelValue"
        modifiers="compact"
        :name
        :debounce
        :placeholder="$t('placeholder.search')"
        type="search"
        class="pj-search-fulltext mb-0 max-w-384"
        :icon="{ name: 'search', prefix: 'orthofix' }" />
</template>

<style lang="scss">
    .pj-search-fulltext.vv-input-text {
        max-width: var(--spacing-384);
        margin-bottom: var(--spacing-0);

        .vv-input-text__inner {
            input {
                @include media-breakpoint-down('sm', $breakpoints) {
                    max-width: var(--spacing-160);
                }
            }
        }
    }
</style>
