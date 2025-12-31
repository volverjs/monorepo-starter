<template>
    <PjMain :title="$t('route.backoffice')">
        <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-md flex-1">
            <VvCard v-for="index in 12" :key="index" />
        </div>
    </PjMain>
</template>
