<script
    setup
    lang="ts"
    generic="TableRow extends Record<string | number | symbol, any>">
    import {
        type PropType,
        useSlots,
        computed,
        watch,
        onMounted,
        unref,
    } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useVModel } from '@vueuse/core'
    import { get as dotGet } from 'ts-dot-prop'
    import {
        VvButtonGroup,
        VvButton,
        VvIcon,
    } from '@volverjs/ui-vue/components'
    import type { TableColumn, TableColumnRecord } from '../types'
    import PkTableEmpty from './PkTableEmpty.vue'
    import PkTableError from './PkTableError.vue'

    const { t: $t } = useI18n({
        useScope: 'global',
    })

    const slots = useSlots()

    const props = defineProps({
        columns: {
            type: Array as PropType<TableColumn<TableRow>[]>,
            required: true,
        },
        data: {
            type: Array as PropType<TableRow[] | undefined>,
            default: () => [],
        },
        sort: {
            type: String,
            default: undefined,
        },
        order: {
            type: String as PropType<'asc' | 'desc'>,
            default: 'asc',
            validation: (order: string) => ['asc', 'desc'].includes(order),
        },
        page: {
            type: [String, Number],
            default: undefined,
        },
        total: {
            type: [String, Number],
            default: undefined,
        },
        limit: {
            type: [String, Number],
            default: undefined,
        },
        limitSteps: {
            type: Array as PropType<number[]>,
            default: () => [10, 15, 25, 50, 100],
        },
        nextDisabled: {
            type: Boolean,
            default: false,
        },
        hideNavigation: {
            type: Boolean,
            default: false,
        },
        isLoading: {
            type: Boolean,
            default: false,
        },
        isError: {
            type: Boolean,
            default: false,
        },
        transitionName: {
            type: String,
            default: 'fade-in',
        },
        classTable: {
            type: String,
            default: undefined,
        },
    })

    const emit = defineEmits([
        'update:sort',
        'update:order',
        'update:page',
        'update:limit',
    ])

    const hasTotal = computed(() =>
        props.total ? Number(props.total) : undefined,
    )

    const hasLimit = computed({
        get: () => (props.limit !== undefined ? Number(props.limit) : 10),
        set: (newValue) => {
            emit('update:limit', newValue)
        },
    })

    const hasPage = computed({
        get: () => (props.page !== undefined ? Number(props.page) : 1),
        set: (newValue) => {
            emit('update:page', newValue)
        },
    })

    const hasSort = useVModel(props, 'sort', emit)

    const hasOrder = useVModel(props, 'order', emit)

    const hasPageCount = computed(() => {
        if (hasTotal.value !== undefined && hasLimit.value) {
            return Math.ceil(hasTotal.value / hasLimit.value)
        }
        return 0
    })

    const hasColumns = computed(() => {
        return props.columns.reduce<TableColumnRecord<TableRow>[]>(
            (acc, item) => {
                if (typeof item === 'string') {
                    acc.push({
                        name: item,
                        label: item,
                    })
                    return acc
                }
                if (unref(item.hidden)) {
                    return acc
                }
                acc.push(item)
                return acc
            },
            [],
        )
    })

    const hasNavAndLimitDisabled = computed(() => {
        return props.isLoading || hasPageCount.value === 0
    })

    const hasNextDisabled = computed(() => {
        return (
            hasNavAndLimitDisabled.value ||
            props.nextDisabled ||
            hasPage.value === hasPageCount.value
        )
    })

    const hasPrevDisabled = computed(() => {
        return hasNavAndLimitDisabled.value || hasPage.value === 1
    })

    watch([hasSort, hasOrder, hasLimit], (newValue, oldValue) => {
        if (oldValue && JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
            hasPage.value = 1
        }
    })

    watch(hasPageCount, (newValue) => {
        if (newValue && hasPage.value > newValue) {
            hasPage.value = 1
        }
    })

    const onClickSort = (columnName: string) => {
        if (hasSort.value === columnName) {
            hasOrder.value = hasOrder.value === 'asc' ? 'desc' : 'asc'
            return
        }
        hasSort.value = columnName
    }

    const onClickNext = () => {
        hasPage.value++
    }

    const onClickPrev = () => {
        hasPage.value--
    }

    const onClickPage = (page: number) => {
        hasPage.value = page
    }

    // send default values to parent
    onMounted(() => {
        if (!props.page) {
            emit('update:page', hasPage.value)
        }
        if (!props.limit) {
            emit('update:limit', hasLimit.value)
        }
    })
</script>

<template>
    <div class="pj-table-sortable">
        <div class="pj-table-sortable__wrapper">
            <table class="vv-table" :class="classTable">
                <thead>
                    <tr>
                        <th
                            v-for="column in hasColumns"
                            :key="column.name"
                            v-bind="{
                                class: [
                                    column.class,
                                    column.classTh,
                                    {
                                        selected: hasSort === column.name,
                                    },
                                ],
                            }">
                            <div v-if="!column.sortable" class="truncate">
                                <slot :name="`col::header::${column.name}`">
                                    {{ column.label }}
                                </slot>
                            </div>
                            <button
                                v-else
                                type="button"
                                @click="onClickSort(column.name)">
                                <slot :name="`col::header::${column.name}`">
                                    {{ column.label }}
                                </slot>
                                <VvIcon
                                    v-bind="
                                        hasSort === column.name
                                            ? {
                                                  name:
                                                      hasOrder === 'asc'
                                                          ? 'arrow-up'
                                                          : 'arrow-down',
                                              }
                                            : {
                                                  prefix: 'siv',
                                                  name: 'filter',
                                              }
                                    " />
                            </button>
                        </th>
                    </tr>
                </thead>
                <TransitionGroup tag="tbody" :name="transitionName">
                    <slot
                        name="tbody"
                        v-bind="{ columns: hasColumns, data, isLoading }">
                        <slot v-if="isLoading" name="loading">
                            <tr v-for="index in hasLimit" :key="index">
                                <td
                                    v-for="{ name, wrapperClass } in hasColumns"
                                    :key="name">
                                    <slot
                                        v-bind="{
                                            index,
                                            wrapperClass,
                                        }"
                                        :name="`skeleton::${name}`">
                                        <div
                                            class="vv-skeleton"
                                            :class="wrapperClass">
                                            <div
                                                class="vv-skeleton__item"></div>
                                        </div>
                                    </slot>
                                </td>
                            </tr>
                        </slot>
                        <template v-else-if="!isError">
                            <template v-if="data?.length">
                                <tr v-for="(row, index) in data" :key="index">
                                    <td
                                        v-for="{
                                            name,
                                            field,
                                            wrapperClass,
                                            render,
                                            ...column
                                        } in hasColumns"
                                        :key="name"
                                        :class="[column.class, column.classTd]">
                                        <template v-if="render">
                                            <component
                                                :is="render(row, index)" />
                                        </template>
                                        <slot
                                            v-else-if="slots[`col::${name}`]"
                                            v-bind="{
                                                row,
                                                field,
                                                wrapperClass,
                                                index,
                                                value: row[name],
                                            }"
                                            :name="`col::${name}`" />
                                        <slot
                                            v-else
                                            v-bind="{
                                                name,
                                                row,
                                                field,
                                                wrapperClass,
                                                index,
                                                value: row[name],
                                            }"
                                            name="col">
                                            <div
                                                class="truncate"
                                                :class="wrapperClass">
                                                {{ dotGet(row, field ?? name) }}
                                            </div>
                                        </slot>
                                    </td>
                                </tr>
                            </template>
                            <tr v-else>
                                <td :colspan="columns.length">
                                    <slot name="empty">
                                        <PkTableEmpty />
                                    </slot>
                                </td>
                            </tr>
                        </template>
                        <tr v-else-if="isError">
                            <td :colspan="columns.length">
                                <slot name="error">
                                    <PkTableError />
                                </slot>
                            </td>
                        </tr>
                    </slot>
                </TransitionGroup>
                <tfoot v-if="slots.tfoot">
                    <slot name="tfoot" />
                </tfoot>
                <caption v-if="slots.caption">
                    <slot name="caption" />
                </caption>
            </table>
        </div>
        <slot
            name="navigation"
            v-bind="{
                hide: hideNavigation,
                prevDisabled: hasPrevDisabled,
                prev: onClickPrev,
                nextDisabled: hasNextDisabled,
                next: onClickNext,
                total: hasPageCount,
                page: hasPage,
            }">
            <div
                v-if="!hideNavigation"
                class="mt-auto grid grid-cols-12 gap-xs pt-24">
                <div class="flex items-center col-span-3">
                    <label class="text-12"
                        >{{ $t('label.itemsPerPage') }}:</label
                    >
                    <select
                        v-model="hasLimit"
                        :disabled="hasNavAndLimitDisabled"
                        class="pj-table-sortable__limit">
                        <option
                            v-for="step in limitSteps"
                            :key="step"
                            :value="step">
                            {{ step }}
                        </option>
                    </select>
                </div>
                <div class="flex justify-center items-center col-span-6">
                    <VvButtonGroup class="flex-nowrap">
                        <VvButton
                            :title="$t('action.prev')"
                            :disabled="hasPrevDisabled"
                            icon="chevron-left"
                            modifiers="action-quiet"
                            @click.stop="onClickPrev()" />
                        <button
                            class="rounded border border-surface-3 px-14 py-4 text-center text-12 font-bold"
                            type="button"
                            @click.stop="onClickPage(hasPage)">
                            {{ hasPage }}
                        </button>
                        <VvButton
                            :title="$t('action.next')"
                            :disabled="hasNextDisabled"
                            icon="chevron-right"
                            modifiers="action-quiet"
                            @click.stop="onClickNext()" />
                    </VvButtonGroup>
                    <small
                        v-if="hasPageCount"
                        class="ml-6 text-12 whitespace-nowrap">
                        {{ $t('label.totalPages', { total: hasPageCount }) }}
                    </small>
                </div>
                <div class="flex text-12 justify-end items-center col-span-3">
                    {{ $t('label.totalItemsCount', { total: hasTotal }) }}
                </div>
            </div>
        </slot>
    </div>
</template>

<style lang="scss">
    .pj-table-sortable {
        display: flex;
        flex-grow: 1;
        flex-direction: column;
        min-width: 0;

        &__wrapper {
            width: 100%;
            flex: 1;
            overflow: auto hidden;
        }

        th {
            &.selected {
                font-weight: var(--font-bold);
            }

            & > button {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                border: none;
                background: none;
                font-size: inherit;
                font-weight: inherit;
                color: inherit;
                cursor: pointer;
                gap: var(--spacing-8);
            }
        }

        &__limit {
            font-size: var(--text-12);
            padding: 0 var(--spacing-12) 0 var(--spacing-8);
            background-image: var(--bg-chevron);
            background-repeat: no-repeat;
            background-position: right center;
            background-size: 1em;
            cursor: pointer;
            min-width: var(--spacing-40);

            &:disabled {
                cursor: not-allowed;
                opacity: var(--opacity-50);
            }
        }
    }
</style>
