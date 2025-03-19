import { createI18n } from 'vue-i18n'
import it from './it.json'
import en from './en.json'

/*
 * Setup i18n
 * https://vue-i18n.intlify.dev/
 */
export const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    fallbackWarn: false,
    messages: {
        it,
        en,
    },
    numberFormats: {
        it: {
            currency: {
                style: 'currency',
                currency: 'EUR',
                notation: 'standard',
            },
            decimal: {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            },
        },
        en: {
            currency: {
                style: 'currency',
                currency: 'EUR',
                notation: 'standard',
            },
            decimal: {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            },
        },
    },
    datetimeFormats: {
        it: {
            short: {
                dateStyle: 'short',
            },
            'date-time': {
                dateStyle: 'short',
                timeStyle: 'short',
            },
            time: {
                timeStyle: 'short',
            },
        },
        en: {
            short: {
                dateStyle: 'short',
            },
            'date-time': {
                dateStyle: 'short',
                timeStyle: 'short',
            },
            time: {
                timeStyle: 'short',
            },
        },
    },
})
