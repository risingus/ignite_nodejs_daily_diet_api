import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { calculateStreak, returnValidString } from '../utils/functions'

interface TokenProps {
  userId: string
}
const dietsIdSchema = z.object({
  id: z.string().uuid(),
})

export async function dietsRoutes(app: FastifyInstance) {
  // * New Diet
  app.post('/new', async (request, reply) => {
    try {
      const dietSchema = z.object({
        name: z.string().trim(),
        description: z.string().trim(),
        date: z.string().trim(),
        isDiet: z.boolean(),
      })

      const { name, description, date, isDiet } = dietSchema.parse(request.body)
      const token = request.cookies.token as string
      const tokenDecoded = jwt.decode(token) as TokenProps

      const newDiet = {
        id: randomUUID(),
        name,
        description,
        date_hour: date,
        is_diet: isDiet,
        user_id: tokenDecoded.userId,
      }

      await knex('diets').insert(newDiet)

      return reply.status(201).send()
    } catch {
      return reply.status(500).send({ message: 'Internal server error' })
    }
  })

  // * Delete Diet
  app.delete('/:id', async (request, reply) => {
    try {
      const { id } = dietsIdSchema.parse(request.params)
      const token = request.cookies.token as string
      const tokenDecoded = jwt.decode(token) as TokenProps

      await knex('diets')
        .where({
          id,
          user_id: tokenDecoded.userId,
        })
        .delete()

      return reply.status(204).send()
    } catch (error) {
      return reply.status(500).send({ message: 'Internal Server error' })
    }
  })

  // * List Diets
  app.get('/', async (request) => {
    const token = request.cookies.token as string
    const tokenDecoded = jwt.decode(token) as TokenProps

    const diets = await knex('diets')
      .where({
        user_id: tokenDecoded.userId,
      })
      .select('id', 'name', 'description', 'date_hour', 'is_diet')

    return diets
  })

  // * Get Diet
  app.get('/:id', async (request, reply) => {
    try {
      const { id } = dietsIdSchema.parse(request.params)
      const token = request.cookies.token as string
      const tokenDecoded = jwt.decode(token) as TokenProps

      const diet = await knex('diets')
        .where({
          id,
          user_id: tokenDecoded.userId,
        })
        .select('id', 'name', 'description', 'date_hour', 'is_diet')
        .first()

      if (!diet) return reply.status(404).send()

      return diet
    } catch (error) {
      return reply.status(500).send({ message: 'Internal server error' })
    }
  })

  // * Edit diet
  app.patch('/:id', async (request, reply) => {
    try {
      const editDietSchema = z.object({
        name: z.string().trim().optional(),
        description: z.string().trim().optional(),
        date: z.string().trim().optional(),
        isDiet: z.boolean().optional(),
      })
      const { id } = dietsIdSchema.parse(request.params)
      const { name, description, date, isDiet } = editDietSchema.parse(
        request.body,
      )
      const token = request.cookies.token as string
      const tokenDecoded = jwt.decode(token) as TokenProps

      if (
        !returnValidString(name) &&
        !returnValidString(date) &&
        !returnValidString(description) &&
        typeof isDiet !== 'boolean'
      ) {
        return reply
          .status(400)
          .send({ message: 'No request body information provided.' })
      }

      await knex('diets')
        .where({
          id,
          user_id: tokenDecoded.userId,
        })
        .update({
          ...(returnValidString(name) && { name }),
          ...(returnValidString(date) && { date_hour: date }),
          ...(returnValidString(description) && { description }),
          ...(typeof isDiet === 'boolean' && { is_diet: isDiet }),
        })

      return reply.status(204).send()
    } catch (error) {
      return reply.status(500).send({ message: 'Internal server error' })
    }
  })

  // * Summary
  app.get('/summary', async (request) => {
    const token = request.cookies.token as string
    const tokenDecoded = jwt.decode(token) as TokenProps

    const diets = await knex('diets')
      .where({
        user_id: tokenDecoded.userId,
      })
      .select('id', 'name', 'description', 'date_hour', 'is_diet')

    const withoutDiet = diets.filter((diet) => !diet.is_diet)
    const withDiet = diets.filter((diet) => diet.is_diet)

    return {
      total: diets.length,
      inDiet: withDiet.length,
      outDiet: withoutDiet.length,
      streak: calculateStreak(diets),
    }
  })
}
