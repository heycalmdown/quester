import { loadDraft } from '~/server/utils/draftPersistence'

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'id')
  const topicId = getRouterParam(event, 'topicId')

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID is required'
    })
  }

  if (!topicId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Topic ID is required'
    })
  }

  try {
    const draft = await loadDraft(sessionId, topicId)

    if (!draft) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Draft not found'
      })
    }

    return draft
  } catch (error: any) {
    // If draft doesn't exist, return 404
    if (error.statusCode === 404) {
      throw error
    }

    console.error('Failed to load draft:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load draft'
    })
  }
})
