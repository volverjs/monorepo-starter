import * as z from 'zod'
import { makeZodI18nMap } from '@volverjs/zod-vue-i18n/v4'
import type { AppModule } from '~/types'
import { i18n } from 'i18n'

type Locale = typeof i18n.global.locale.value

const isAvailableLocale = (value: string): value is Locale =>
    (i18n.global.availableLocales as string[]).includes(value)

// The stored value can be anything a previous version (or the user) wrote.
const locale = useStorage(
    'locale',
    import.meta.env.VITE_I18N_DEFAULT_LOCALE || i18n.global.locale.value,
)
if (isAvailableLocale(locale.value)) {
    i18n.global.locale.value = locale.value
}

watch(i18n.global.locale, (newValue) => {
    locale.value = newValue
})

z.config({
    localeError: makeZodI18nMap(i18n),
})

export const install: AppModule = ({ app }) => {
    app.use(i18n)
}
