import * as z from 'zod'
import { Controller, GET } from './index'

@Controller({
    route: '/health',
    tags: [
        {
            name: 'Health',
        },
    ],
})
export default class HealthController {
    @GET({
        url: '/ping',
        options: {
            schema: {
                response: {
                    200: z.string(),
                },
            },
        },
    })
    async getPing() {
        return 'pong'
    }
}
