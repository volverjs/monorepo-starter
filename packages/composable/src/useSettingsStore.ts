import { useDark, useStorage, useToggle } from '@vueuse/core'
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', () => {
    // dark theme
    const isDarkTheme = useDark({
        valueDark: 'theme theme--dark',
        valueLight: 'theme theme--light',
    })
    const toggleDarkTheme = useToggle(isDarkTheme)

    // sidebar
    const isSidebarOpen = useStorage('isSidebarOpen', false)
    const toggleSidebarOpen = useToggle(isSidebarOpen)

    const route = useRoute()
    const hasSidebar = computed(() => route.meta.hasSidebar ?? false)
    watch(route, () => {
        // close sidebar on route change (for mobile devices)
        isSidebarOpen.value = false
    })

    return {
        isDarkTheme,
        toggleDarkTheme,
        hasSidebar,
        isSidebarOpen,
        toggleSidebarOpen,
    }
})
