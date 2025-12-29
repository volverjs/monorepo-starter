import { createHttpClient } from '@volverjs/data/vue'
import { useAlert } from '@volverjs/ui-vue/composables'
import { i18n } from 'i18n'
import type { AppModule, ProblemJson } from '~/types'

export const httpClient = createHttpClient({
    prefixUrl: import.meta.env.VITE_API_BASE_URL,
    retry: 2,
    credentials: 'include',
    hooks: {
        beforeRetry: [
            ({ request, retryCount }) => {
                request.headers.set('x-retry-count', retryCount.toString())
            },
        ],
        afterResponse: [
            async (request, options, response) => {
                if (
                    !response.ok &&
                    (response.status === 403 || response.status >= 500) &&
                    response.headers
                        .get('content-type')
                        ?.includes('application/problem+json')
                ) {
                    const retryCount = parseInt(
                        request.headers.get('x-retry-count') ?? '0',
                    )
                    if (
                        options.retry.statusCodes?.includes(response.status) &&
                        options.retry.methods?.includes(
                            request.method.toLocaleLowerCase(),
                        ) &&
                        options.retry.limit &&
                        retryCount < options.retry.limit - 1
                    ) {
                        return
                    }
                    const body = (await response.json()) as ProblemJson
                    const { addAlert } = useAlert()

                    const problemKey = body.type.split('/').pop()

                    addAlert({
                        id: body.type,
                        title: i18n.global.t('message.error'),
                        content: i18n.global.te(`problems.${problemKey}`)
                            ? i18n.global.t(`problems.${problemKey}`)
                            : body.title,
                        modifiers: 'danger',
                    })
                }
            },
        ],
    },
})

/*
 * Setup @volverjs/data HttpClient
 * https://github.com/volverjs/data
 */
export const install: AppModule = ({ app }) => {
    app.use(httpClient)
}
