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
    const router = useRouter()

    const signUpSchema = z.object({
        email: z.string().email(),
    })

    const { VvForm, VvFormField, formData } = useForm(signUpSchema, {
        lazyLoad: true,
    })
    const isLoading = ref(false)
    const { addAlert } = useAlert()
    const onSubmit = async () => {
        if (!formData.value?.email) {
            return
        }
        isLoading.value = true
        const { error } = await auth.forgetPassword({
            email: formData.value.email,
            redirectTo: `${window.location.origin}${
                router.resolve({
                    name: '/auth/reset-password',
                }).href
            }`,
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
            content: $t('message.checkYourEmail'),
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
                name="email"
                type="text"
                :label="$t('label.email')"
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
        "title": "Forgot your password?"
    },
    "it": {
        "title": "Hai dimenticato la password?"
    }
}
</i18n>
