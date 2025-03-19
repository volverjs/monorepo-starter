import type { AppModule } from '../types'
import { VolverPlugin } from '@volverjs/ui-vue'
import { normal } from '@volverjs/ui-vue/icons'
import custom from 'icons'

/*
 * Setup Volver
 * https://volver.github.io/ui-vue/
 */
export const install: AppModule = ({ app }) => {
    app.use(VolverPlugin, {
        iconsCollections: [normal, custom],
    })
}
