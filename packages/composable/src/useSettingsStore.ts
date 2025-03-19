import { useDark, useStorage, useToggle } from '@vueuse/core'
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', () => {
    // dark theme
    const isDark = useDark()
    const hasDarkTheme = useStorage('hasDarkTheme', isDark.value)
    const toggleDarkTheme = useToggle(hasDarkTheme)

    return {
        hasDarkTheme,
        toggleDarkTheme,
    }
})
