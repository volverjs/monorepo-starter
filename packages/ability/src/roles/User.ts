import type { Role } from '../types'
import { Subject, Audience } from '../types'

const User: Role = (user) => [
    {
        audience: Audience.Frontoffice,
        subject: Subject.Todo,
        action: 'create',
    },
    // Only the todos the user created: anyone else's is a 404 on read and is
    // missing from every list.
    {
        audience: Audience.Frontoffice,
        subject: Subject.Todo,
        action: 'modify',
        condition: { createdBy: user.id },
    },
]
export default User
