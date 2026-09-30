import type { Role } from '../types'
import { Subject, Audience } from '../types'

const Admin: Role = () => [
    {
        audience: Audience.Backoffice,
        subject: Subject.All,
        action: 'manage',
    },
]
export default Admin
