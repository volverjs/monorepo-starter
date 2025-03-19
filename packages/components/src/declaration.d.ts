declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        fontSize: {
            /**
             * Set the font size
             */
            setFontSize: (size: number) => ReturnType
            /**
             * Unset the font size
             */
            unsetFontSize: () => ReturnType
        }
    }
}
