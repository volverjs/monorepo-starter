<script setup lang="ts">
    import { useForm } from '@volverjs/form-vue'
    import { useAlert } from '@volverjs/ui-vue/composables'
    import { z } from 'zod'

    const { t } = useI18n()
    const { t: $t } = useI18n({ useScope: 'global' })
    const auth = useAuth()

    const signInSchema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
        rememberMe: z.boolean().default(false),
    })

    const { VvForm, VvFormField, formData } = useForm(signInSchema, {
        lazyLoad: true,
    })
    const isLoading = ref(false)
    const { addAlert } = useAlert()
    const onSubmit = async () => {
        isLoading.value = true
        const { error } = await auth.signIn.email(
            formData.value as z.infer<typeof signInSchema>,
        )
        if (error) {
            isLoading.value = false
            addAlert({
                modifiers: 'danger',
                title: $t('message.error'),
                content: error.message,
            })
        }
    }
    const signInWithMicrosoft = async () => {
        isLoading.value = true
        const { error } = await auth.signIn.social({
            provider: 'microsoft',
            callbackURL: window.location.origin,
        })
        if (error) {
            isLoading.value = false
            addAlert({
                modifiers: 'danger',
                title: $t('message.error'),
                content: error.message,
            })
        }
    }
</script>

<template>
    <div class="h-full flex justify-center items-center">
        <div
            class="w-384 max-w-full rounded-lg p-lg mx-md border border-surface-3 my-auto relative">
            <VvIcon
                name="volverjs"
                prefix="custom"
                class="w-64 h-64 absolute top-0 left-1/2 nt-32 nl-32" />
            <div class="text-center mt-md mb-lg leading-normal">
                <h1 class="font-bold text-lg">
                    {{ t('title') }}
                </h1>
                <p class="text-word-3">
                    {{ t('subtitle') }}
                </p>
            </div>
            <VvForm
                class="flex flex-col"
                :readonly="isLoading"
                @submit="onSubmit">
                <!-- Autocomplete Honeypot -->
                <div class="none">
                    <input
                        type="text"
                        name="fake-username"
                        autocomplete="username" />
                    <input
                        type="password"
                        name="fake-password"
                        autocomplete="current-password" />
                </div>
                <div class="mb-md">
                    <VvFormField
                        name="email"
                        type="text"
                        :label="$t('label.email')"
                        floating />
                    <VvFormField
                        name="password"
                        type="password"
                        :label="$t('label.password')"
                        floating />
                    <VvFormField
                        name="rememberMe"
                        type="checkbox"
                        :label="$t('label.rememberMe')"
                        switch />
                </div>
                <VvButtonGroup modifiers="vertical" class="gap-xs">
                    <VvButton
                        :disabled="isLoading"
                        :loading="isLoading"
                        type="submit"
                        :label="$t('action.continue')"
                        modifiers="primary" />
                    <VvButton
                        :disabled="isLoading"
                        :loading="isLoading"
                        modifiers="secondary"
                        :label="$t('action.signInWithMicrosoft')"
                        icon="logos:microsoft-icon"
                        @click.stop="signInWithMicrosoft" />
                </VvButtonGroup>
            </VvForm>
        </div>
    </div>
</template>

<i18n lang="json">
{
    "en": {
        "title": "Welcome to Volverjs",
        "subtitle": "Sign in to your account"
    },
    "it": {
        "title": "Benvenuto in Volverjs",
        "subtitle": "Accedi al tuo account"
    }
}
</i18n>
