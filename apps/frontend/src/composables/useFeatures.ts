export const useFeatures = () => {
    return {
        hasThemes: import.meta.env.VITE_FEATURE_THEMES === 'true',
    }
}
