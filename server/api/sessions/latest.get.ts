import { createError, defineEventHandler } from 'h3'
import { getLatestSession } from '~/server/utils/sessionPersistence'

export default defineEventHandler(async () => {
  try {
    const session = await getLatestSession()
    return session ?? null
  } catch (error) {
    console.error('Failed to fetch latest session:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch latest session'
    })
  }
})
