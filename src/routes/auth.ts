import { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { env } from '../.env/index'
import { knex } from '../database'

const userSchema = z.object({
  username: z.string(),
  password: z.string(),
})

export async function authRoutes(app: FastifyInstance) {
  // * Crete user
  app.post('/register', async (request, reply) => {
    try {
      const { username, password } = userSchema.parse(request.body)
      const users = await knex('users').select('*')

      const userExists = users.some(
        (user) => user.username.toLowerCase() === username.toLowerCase(),
      )

      if (userExists) {
        return reply.status(400).send({ message: 'Username already in use' })
      }

      const passwordHash = await bcrypt.hash(password, 10)

      const newUser = {
        id: randomUUID(),
        username,
        password_hash: passwordHash,
      }

      await knex('users').insert(newUser)

      const token = jwt.sign({ userId: newUser.id }, env.JWT_SECRET, {
        expiresIn: '7d',
      })

      reply.cookie('token', token, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      })

      return reply.status(201).send()
    } catch {
      return reply.status(500).send({ message: 'Internal error' })
    }
  })

  // * login
  app.post('/login', async (request, reply) => {
    try {
      const { username, password } = userSchema.parse(request.body)
      const users = await knex('users').select('*')

      const user = users.find((user) => user.username === username)

      if (!user) {
        return reply.status(401).send({ message: 'Invalid credentials' })
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user?.password_hash,
      )

      if (!isPasswordValid) {
        return reply.status(401).send({ message: 'Invalid credentials' })
      }

      const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
        expiresIn: '7d',
      })

      reply.cookie('token', token, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      })

      return reply.status(200).send()
    } catch (error) {
      console.log(error, 'error')
      return reply.status(400).send({ message: 'Internal server error' })
    }
  })
}
