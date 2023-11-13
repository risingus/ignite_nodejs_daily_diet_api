import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { returnValidString } from '../utils/functions'
import { env } from '../.env'
import { z } from 'zod'

export async function checkTokenExists(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const token = request.cookies.token || ''
  if (!returnValidString(token))
    return reply.status(401).send({ message: 'Unauthorized' })
  try {
    jwt.verify(token, env.JWT_SECRET)
    const tokenDecoded = jwt.decode(token)

    const tokenSchema = z.object({
      userId: z.string(),
    })

    const validToken = tokenSchema.safeParse(tokenDecoded)

    if (!validToken.success) {
      return reply.status(401).send({ message: 'Unauthorized' })
    }
  } catch {
    return reply.status(401).send({ message: 'Unauthorized' })
  }
}
