<script setup lang="ts">
    import { useForm } from '@volverjs/form-vue'
    import { useAlert } from '@volverjs/ui-vue/composables'
    import { z } from 'zod'

    definePage({
        meta: {
            isPublic: true,
        },
    })

    const { t } = useI18n()
    const { t: $t } = useI18n({ useScope: 'global' })
    const auth = useAuth()
    const router = useRouter()
    const route = useRoute()

    const signUpSchema = z
        .object({
            newPassword: z.string().min(8),
            newPasswordConfirmation: z.string().min(8),
        })
        .refine((data) => data.newPassword === data.newPasswordConfirmation, {
            message: $t('errors.passwordsDoNotMatch'),
            path: ['newPasswordConfirmation'],
        })

    const { VvForm, VvFormField, formData } = useForm(signUpSchema, {
        lazyLoad: true,
    })
    const isLoading = ref(false)
    const { addAlert } = useAlert()
    const onSubmit = async () => {
        if (
            !formData.value?.newPassword ||
            typeof route.query.token !== 'string'
        ) {
            return
        }
        isLoading.value = true
        const { error } = await auth.resetPassword({
            newPassword: formData.value.newPassword,
            token: route.query.token,
        })
        if (error) {
            isLoading.value = false
            addAlert({
                modifiers: 'danger',
                title: $t('message.error'),
                content: error.message,
            })
            return
        }
        isLoading.value = false
        addAlert({
            modifiers: 'success',
            title: $t('message.success'),
            content: $t('message.passwordResetSuccess'),
        })
        router.replace({ name: '/auth/' })
    }
</script>

<template>
    <div>
        <div class="text-center mb-lg leading-normal">
            <p class="text-word-3">
                {{ t('title') }}
            </p>
        </div>
        <VvForm class="flex flex-col" :readonly="isLoading" @submit="onSubmit">
            <VvFormField
                name="newPassword"
                type="password"
                :label="$t('label.password')"
                autocomplete="new-password"
                floating />
            <VvFormField
                name="newPasswordConfirmation"
                type="password"
                autocomplete="new-password"
                :label="$t('label.confirmPassword')"
                floating />
            <VvButtonGroup modifiers="vertical" class="gap-xs">
                <VvButton
                    :disabled="isLoading"
                    :loading="isLoading"
                    type="submit"
                    :label="$t('action.submit')"
                    modifiers="primary" />
            </VvButtonGroup>
        </VvForm>
        <VvButton
            class="inline-flex items-center mr-auto mt-md"
            modifiers="link"
            icon="chevron-left"
            :label="$t('action.backToSignIn')"
            :to="{
                name: '/auth/',
            }" />
    </div>
</template>

<i18n lang="json">
{
    "en": {
        "title": "Reset your password"
    },
    "it": {
        "title": "Reimposta la tua password"
    }
}
</i18n>
