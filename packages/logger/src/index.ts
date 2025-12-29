const isLocal =
    typeof window === 'undefined'
        ? process?.env?.VITE_LOCAL === 'true'
        : import.meta.env?.VITE_LOCAL

export const log = (...params: unknown[]) => {
    if (isLocal) {
        // eslint-disable-next-line no-console
        console.log(...params)
    }
}

export const error = (...params: unknown[]) => {
    if (isLocal) {
        // eslint-disable-next-line no-console
        console.error(...params)
    }
}
export const info = (...params: unknown[]) => {
    if (isLocal) {
        // eslint-disable-next-line no-console
        console.info(...params)
    }
}
export const debug = (...params: unknown[]) => {
    if (isLocal) {
        // eslint-disable-next-line no-console
        console.debug(...params)
    }
}
export const warn = (...params: unknown[]) => {
    if (isLocal) {
        // eslint-disable-next-line no-console
        console.warn(...params)
    }
}
export const assert = (condition: boolean, message: string) => {
    if (isLocal) {
        // eslint-disable-next-line no-console
        console.assert(condition, message)
    }
}
export const clear = () => {
    if (isLocal) {
        // eslint-disable-next-line no-console
        console.clear()
    }
}
export const table = (table: unknown) => {
    if (isLocal) {
        // eslint-disable-next-line no-console
        console.table(table)
    }
}
export const group = (name: string) => {
    if (isLocal) {
        // eslint-disable-next-line no-console
        console.group(name)
    }
}
export const groupEnd = () => {
    if (isLocal) {
        // eslint-disable-next-line no-console
        console.groupEnd()
    }
}
export const time = (name: string) => {
    if (isLocal) {
        // eslint-disable-next-line no-console
        console.time(name)
    }
}
export const timeEnd = (name: string) => {
    if (isLocal) {
        // eslint-disable-next-line no-console
        console.timeEnd(name)
    }
}
export const timeLog = (name: string, ...params: unknown[]) => {
    if (isLocal) {
        // eslint-disable-next-line no-console
        console.timeLog(name, ...params)
    }
}

export const logger = {
    log,
    error,
    info,
    debug,
    warn,
    assert,
    clear,
    table,
    group,
    groupEnd,
    time,
    timeEnd,
    timeLog,
}
