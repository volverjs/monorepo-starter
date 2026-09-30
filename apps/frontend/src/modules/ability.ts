import type { AppModule } from '~/types'
import { abilitiesPlugin } from '@casl/vue'
import { ability, updateAbility } from 'ability'

export const install: AppModule = ({ app }) => {
    app.use(abilitiesPlugin, ability)

    const session = useAuth().useSession()
    watch(
        session,
        (session) => {
            updateAbility(session.data?.user)
        },
        {
            immediate: true,
        },
    )
}
