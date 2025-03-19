import { type Ref } from 'vue'

export type TableColumnRecord<T = Record<string, unknown>> = {
    name: string
    field?: string
    label?: string
    sortable?: boolean
    class?: string
    classTh?: string
    classTd?: string
    wrapperClass?: string
    render?: (row: T, index?: number) => unknown
    hidden?: boolean | Ref<boolean | undefined>
}

export type TableColumn<T = Record<string, unknown>> =
    | TableColumnRecord<T>
    | string
