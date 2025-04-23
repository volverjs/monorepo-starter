import handlebars from 'handlebars'
import layoutPartial from './templates/partials/layout.hbs?raw'
import resetPassword from './templates/resetPassword.hbs?raw'

handlebars.registerPartial('layout', layoutPartial)

export const resetPasswordTemplate = handlebars.compile(resetPassword)
