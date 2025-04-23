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

    const signUpSchema = z
        .object({
            name: z.string().min(1),
            email: z.string().email(),
            password: z.string().min(8),
            passwordConfirmation: z.string().min(8),
            callbackURL: z.string().optional(),
        })
        .refine((data) => data.password !== data.passwordConfirmation, {
            message: $t('errors.passwordsDoNotMatch'),
            path: ['passwordConfirmation'],
        })

    const { VvForm, VvFormField, formData } = useForm(signUpSchema, {
        lazyLoad: true,
    })
    const isLoading = ref(false)
    const { addAlert } = useAlert()
    const onSubmit = async () => {
        isLoading.value = true
        const { error, data } = await auth.signUp.email(
            formData.value as z.infer<typeof signUpSchema>,
        )
        if (error) {
            isLoading.value = false
            addAlert({
                modifiers: 'danger',
                title: $t('message.error'),
                content: error.message,
            })
        }
        if (data) {
            router.replace({ name: '/frontoffice' })
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
        <VvForm class="flex flex-col" :readonly="isLoading" @submit="onSubmit">
            <VvFormField
                name="name"
                type="text"
                :label="$t('label.completeName')"
                floating />
            <VvFormField
                name="email"
                type="text"
                :label="$t('label.email')"
                floating />
            <VvFormField
                name="password"
                type="password"
                :label="$t('label.password')"
                autocomplete="new-password"
                floating />
            <VvFormField
                name="passwordConfirmation"
                type="password"
                autocomplete="new-password"
                :label="$t('label.confirmPassword')"
                floating />
            <VvButtonGroup modifiers="vertical" class="gap-xs">
                <VvButton
                    :disabled="isLoading"
                    :loading="isLoading"
                    type="submit"
                    :label="$t('action.signUp')"
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
        "title": "Create your account"
    },
    "it": {
        "title": "Crea il tuo account"
    }
}
</i18n>
