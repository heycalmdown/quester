import { listDrafts } from '~/server/utils/draftPersistence'

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'id')

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID is required'
    })
  }

  try {
    const drafts = await listDrafts(sessionId)

    return {
      drafts
    }
  } catch (error) {
    console.error('Failed to list drafts:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to list drafts'
    })
  }
})
