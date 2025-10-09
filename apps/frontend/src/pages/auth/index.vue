<script setup lang="ts">
    import { useForm } from '@volverjs/form-vue'
    import { useAlert } from '@volverjs/ui-vue/composables'
    import z from 'zod/v4'

    definePage({
        meta: {
            isPublic: true,
        },
    })

    const { t } = useI18n()
    const { t: $t } = useI18n({ useScope: 'global' })
    const auth = useAuth()

    const signInSchema = z.object({
        email: z.email(),
        password: z.string().min(8),
        rememberMe: z.boolean().default(false),
    })

    const { VvForm, VvFormField, formData } = useForm(signInSchema, {
        lazyLoad: true,
    })
    const isLoading = ref(false)
    const { addAlert } = useAlert()
    const signInWithEmail = async () => {
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

    const ENABLED_SOCIAL_PROVIDERS = import.meta.env.VITE_AUTH_SOCIAL_PROVIDERS
        ? import.meta.env.VITE_AUTH_SOCIAL_PROVIDERS.split(',')
        : []
    const signInWithSocialProvider = async (
        provider: 'google' | 'microsoft' | 'facebook' | 'github',
    ) => {
        isLoading.value = true
        const { error } = await auth.signIn.social({
            provider,
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
    <div>
        <div class="text-center mb-lg leading-normal">
            <p class="text-word-3">
                {{ t('title') }}
            </p>
        </div>
        <VvForm
            class="flex flex-col"
            :readonly="isLoading"
            @submit="signInWithEmail">
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
                <VvButton
                    class="inline-flex items-center mr-auto mb-md text-smaller"
                    modifiers="link"
                    :label="$t('action.forgetPassword')"
                    :to="{
                        name: '/auth/forget-password',
                    }" />
                <VvFormField
                    name="rememberMe"
                    type="checkbox"
                    :label="$t('label.rememberMe')"
                    switch />
            </div>
            <VvButtonGroup modifiers="vertical" class="gap-xs mb-md">
                <VvButton
                    :disabled="isLoading"
                    :loading="isLoading"
                    type="submit"
                    :label="$t('action.signIn')"
                    modifiers="primary" />
                <VvButton
                    v-if="ENABLED_SOCIAL_PROVIDERS.includes('google')"
                    :disabled="isLoading"
                    :loading="isLoading"
                    modifiers="secondary"
                    :label="
                        $t('action.signInWithSocialProvider', {
                            provider: 'Google',
                        })
                    "
                    icon="logos:google-icon"
                    @click.stop="signInWithSocialProvider('google')" />
                <VvButton
                    v-if="ENABLED_SOCIAL_PROVIDERS.includes('microsoft')"
                    :disabled="isLoading"
                    :loading="isLoading"
                    modifiers="secondary"
                    :label="
                        $t('action.signInWithSocialProvider', {
                            provider: 'Microsoft',
                        })
                    "
                    icon="logos:microsoft-icon"
                    @click.stop="signInWithSocialProvider('microsoft')" />
                <VvButton
                    v-if="ENABLED_SOCIAL_PROVIDERS.includes('facebook')"
                    :disabled="isLoading"
                    :loading="isLoading"
                    modifiers="secondary"
                    :label="
                        $t('action.signInWithSocialProvider', {
                            provider: 'facebook',
                        })
                    "
                    icon="logos:facebook"
                    @click.stop="signInWithSocialProvider('facebook')" />
                <VvButton
                    v-if="ENABLED_SOCIAL_PROVIDERS.includes('github')"
                    :disabled="isLoading"
                    :loading="isLoading"
                    modifiers="secondary"
                    :label="
                        $t('action.signInWithSocialProvider', {
                            provider: 'GitHub',
                        })
                    "
                    icon="logos:github-icon"
                    @click.stop="signInWithSocialProvider('github')" />
            </VvButtonGroup>
            <VvButton
                class="inline-flex items-center mr-auto"
                modifiers="link"
                :label="$t('action.createAccount')"
                :to="{
                    name: '/auth/sign-up',
                }" />
        </VvForm>
    </div>
</template>

<i18n lang="json">
{
    "en": {
        "title": "Sign in to your account"
    },
    "it": {
        "title": "Accedi al tuo account"
    }
}
</i18n>
