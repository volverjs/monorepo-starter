<script setup lang="ts">
    const { t } = useI18n()
</script>

<template>
    <div class="h-full flex justify-center items-center">
        <div
            class="w-384 max-w-full rounded-lg p-lg mx-md border border-surface-3 my-auto relative">
            <VvIcon
                name="volverjs"
                prefix="custom"
                class="w-64 h-64 absolute top-0 left-1/2 nt-32 nl-32" />
            <RouterView v-slot="scope">
                <div class="text-center mt-md leading-normal">
                    <h1 class="font-bold text-lg">
                        {{ t('title') }}
                    </h1>
                </div>
                <Transition mode="out-in">
                    <Component :is="scope.Component" v-if="scope" />
                </Transition>
            </RouterView>
        </div>
    </div>
</template>

<i18n lang="json">
{
    "en": {
        "title": "Welcome to Volver.js"
    },
    "it": {
        "title": "Benvenuto in Volver.js"
    }
}
</i18n>
