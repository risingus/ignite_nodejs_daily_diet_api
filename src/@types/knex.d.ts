// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Knex } from 'kenx'

declare module 'knex/types/tables' {
  export interface Tables {
    diets: {
      id: string
      name: string
      description: string
      created_at: string
      date_hour: string
      is_diet: bolean
      user_id: string
    }
    users: {
      id: string
      username: string
      password_hash: string
      created_at: string
    }
  }
}
