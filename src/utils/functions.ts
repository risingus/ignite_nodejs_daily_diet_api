export const returnValidString = (value: unknown) => {
  if (typeof value !== 'string') return ''
  if (value.trim().length === 0) return ''
  return value
}

interface MealsProps {
  date_hour: string
  is_diet: boolean
}

export const calculateStreak = (meals: MealsProps[]) => {
  try {
    if (!Array.isArray(meals)) return 0
    if (meals.length === 0) return 0

    meals.sort((a, b) => {
      const dateA = new Date(a.date_hour).getTime()
      const dateB = new Date(b.date_hour).getTime()
      return dateB - dateA
    })

    let maiorQuantidade = 0
    let quantidadeAtual = 0

    meals.forEach((meal) => {
      if (!meal.is_diet) {
        quantidadeAtual = 0
        return
      }

      if (meal.is_diet) {
        quantidadeAtual++
      }

      if (quantidadeAtual >= maiorQuantidade) {
        maiorQuantidade = quantidadeAtual
      }
    })

    return maiorQuantidade
  } catch (error) {
    return 0
  }
}
