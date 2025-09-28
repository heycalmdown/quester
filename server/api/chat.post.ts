import OpenAI from 'openai'
import type { LLMRequest, LLMResponse } from '~/types'

const openai = new OpenAI({
  apiKey: useRuntimeConfig().openaiApiKey
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<LLMRequest>(event)

    if (!body.messages || body.messages.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Messages are required'
      })
    }

    // Convert our message format to OpenAI format
    const openaiMessages = body.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // Add system prompt for Quester behavior
    const systemPrompt = buildSystemPrompt(body.context)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...openaiMessages
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw createError({
        statusCode: 500,
        statusMessage: 'No response from OpenAI'
      })
    }

    // Parse response and extract structured information
    const structuredResponse = parseQuesterResponse(response, body.context)

    return structuredResponse
  } catch (error) {
    console.error('Chat API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process chat request'
    })
  }
})

function buildSystemPrompt(context?: LLMRequest['context']): string {
  const basePrompt = `You are Quester, a conversational writing agent that acts like a seasoned interviewer. Your goal is to guide users through questions to clarify, confirm, and structure their thoughts into finished writing.

Key behaviors:
- Ask ONE question at a time to avoid overwhelming the user
- Summarize their answers and confirm understanding before proceeding
- Preserve important terms they use, avoid terms they dislike
- Track context and detect topic shifts
- Maintain a topic backlog for side-topics to revisit later
- Use divergence-convergence flow: broaden ideas, then narrow to key themes
- Provide framing: occasionally summarize direction and confirm with user`

  if (context?.preferences) {
    const { preferredTerms, avoidedTerms } = context.preferences
    return `${basePrompt}

User preferences:
- Preferred terms to preserve: ${preferredTerms.join(', ')}
- Terms to avoid: ${avoidedTerms.join(', ')}`
  }

  return basePrompt
}

function parseQuesterResponse(response: string, context?: LLMRequest['context']): LLMResponse {
  // Basic parsing - in a real implementation, this would be more sophisticated
  // Could use structured output from OpenAI or regex parsing

  return {
    message: response,
    needsConfirmation: response.includes('Is that correct?') || response.includes('Does that sound right?')
  }
}