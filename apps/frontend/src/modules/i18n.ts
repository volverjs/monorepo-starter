import z from 'zod/v4'
import { makeZodI18nMap } from '@volverjs/zod-vue-i18n/v4'
import type { AppModule } from '~/types'
import { i18n } from 'i18n'

const locale = useStorage('locale', import.meta.env.VITE_I18N_DEFAULT_LOCALE)
i18n.global.locale.value = locale.value

watch(i18n.global.locale, (newValue) => {
    locale.value = newValue
})

z.config({
    // @ts-expect-error ignore
    localeError: makeZodI18nMap(i18n),
})

export const install: AppModule = ({ app }) => {
    app.use(i18n)
}
