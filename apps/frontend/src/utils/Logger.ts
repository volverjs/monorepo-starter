export const logger = {
    log: (message: unknown) => {
        if (!import.meta.env.PROD) {
            // eslint-disable-next-line no-console
            console.log(message)
        }
    },
    error: (error: Error | null | undefined) => {
        if (!import.meta.env.PROD && error) {
            // eslint-disable-next-line no-console
            console.error(error)
        }
    },
    info: (message: string) => {
        if (!import.meta.env.PROD && message) {
            // eslint-disable-next-line no-console
            console.info(message)
        }
    },
}

export const useErrorsLogger = (errors: Ref<Error | null | undefined>[]) => {
    errors.forEach((error) => {
        watch(error, (value) => {
            logger.error(value)
        })
    })
}
