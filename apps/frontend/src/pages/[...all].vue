<template>
    <PjMain>
        <div class="flex flex-col flex-1 items-center justify-center">
            <VvIcon name="warning" class="text-72 text-word-3" />
            <h1 class="vv-text vv-text--headline vv-text--size-1">
                {{ $t('message.pageNotFound') }}
            </h1>
            <VvButton
                :label="$t('action.backToHome')"
                :to="{ name: '/frontoffice/' }"
                modifiers="ghost" />
        </div>
    </PjMain>
</template>
