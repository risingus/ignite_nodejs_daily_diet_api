import cookie from '@fastify/cookie'
import fastify from 'fastify'
import { dietsRoutes } from './routes/diets'
import { authRoutes } from './routes/auth'
import { checkTokenExists } from './middlewares/check_token'

export const app = fastify()

app.register(cookie)
app.register(authRoutes)
app.addHook('preHandler', checkTokenExists).register(dietsRoutes, {
  prefix: 'diets',
})
