import type { Capability } from '../types'
import { Subject, Audience } from '../types'

const User: Capability[] = [
    {
        id: `${Audience.Frontooffice}#read:all`,
        audience: Audience.Frontooffice,
        subject: Subject.Todo,
        action: 'read',
    },
]
export default User
