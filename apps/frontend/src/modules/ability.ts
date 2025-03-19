import type { AppModule } from '~/types'
import { abilitiesPlugin } from '@casl/vue'
import { ability, updateAbilityByUserRole } from 'ability'

export const install: AppModule = ({ app }) => {
    app.use(abilitiesPlugin, ability)

    const session = useAuth().useSession()
    watch(
        session,
        (session) => {
            updateAbilityByUserRole(session.data?.user?.role)
        },
        {
            immediate: true,
        },
    )
}
