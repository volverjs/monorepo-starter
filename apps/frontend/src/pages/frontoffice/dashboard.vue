<script setup lang="ts">
    // Two counts from the list endpoint: one row per request, the total comes
    // from the X-Total-Count header (`metadata.total`).
    import { useTodoStore } from '~/stores/useTodoStore'

    const { t } = useI18n()
    const { t: $t } = useI18n({ useScope: 'global' })

    const { read } = useTodoStore()
    const count = (done: boolean) =>
        read({ 'page[size]': 1, 'filter[done]': done })
    const open = count(false)
    const done = count(true)

    const cards = computed(() => [
        { status: 'open', label: t('open'), query: open },
        { status: 'done', label: t('done'), query: done },
    ])
</script>

<template>
    <PjMain :title="$t('route.dashboard')">
        <div class="grid md:grid-cols-2 gap-md">
            <VvCard
                v-for="{ status, label, query } in cards"
                :key="status"
                :title="label">
                <template #content>
                    <PkSkeleton :loading="query.isLoading.value" class="h-40">
                        <p v-if="query.isError.value" class="text-word-2">
                            {{ $t('message.readError') }}
                        </p>
                        <p v-else class="text-28 font-bold leading-none">
                            {{ query.metadata.value?.total ?? 0 }}
                        </p>
                    </PkSkeleton>
                </template>
                <template #footer>
                    <VvButton
                        :to="{ name: '/frontoffice/todos/', query: { status } }"
                        :label="t('show')"
                        modifiers="secondary" />
                </template>
            </VvCard>
        </div>
    </PjMain>
</template>

<i18n lang="yaml">
en:
    open: Open todos
    done: Done todos
    show: Show them
it:
    open: Todo da fare
    done: Todo fatti
    show: Mostrali
</i18n>
