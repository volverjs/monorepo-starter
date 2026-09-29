import type { Capability } from '../types'
import { Subject, Audience } from '../types'

const User: Capability[] = [
    {
        audience: Audience.Frontoffice,
        subject: Subject.Todo,
        action: 'read',
    },
]
export default User
