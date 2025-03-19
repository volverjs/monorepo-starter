import type { Capability } from '../types'
import { Subject, Audience } from '../types'

const Admin: Capability[] = [
    {
        audience: Audience.Backoffice,
        subject: Subject.All,
        action: 'manage',
    },
    {
        audience: Audience.Backoffice,
        subject: Subject.User,
        action: 'manage',
    },
    {
        audience: Audience.Backoffice,
        subject: Subject.Todo,
        action: 'manage',
    },
]
export default Admin
