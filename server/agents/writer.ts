import OpenAI from 'openai'
import type { WriterInput, WriterOutput } from './types'

export async function runWriter(
  input: WriterInput,
  openai: OpenAI,
  model: string
): Promise<WriterOutput> {
  const instructions = buildWriterPrompt(input)

  const conversationHistory = input.topicMessages
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n\n')

  const responseSchema = {
    type: 'object',
    properties: {
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Section title'
            },
            content: {
              type: 'string',
              description: 'Section content in Markdown format'
            }
          },
          required: ['title', 'content'],
          additionalProperties: false
        },
        description: 'Array of document sections with titles and content'
      },
      completeness: {
        type: 'number',
        description: 'Draft completeness percentage (0-100)'
      },
      missingAspects: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'List of aspects that are still missing or need more detail'
      }
    },
    required: ['sections', 'completeness', 'missingAspects'],
    additionalProperties: false
  }

  const completion = await openai.responses.create({
    model,
    instructions,
    input: conversationHistory,
    max_output_tokens: 2000,
    store: false,
    text: {
      format: {
        type: 'json_schema',
        name: 'writer_output',
        schema: responseSchema,
        strict: true
      }
    }
  })

  const response = completion.output_text

  if (!response) {
    throw new Error('No response from Writer')
  }

  const parsed = JSON.parse(response) as WriterOutput

  // Validate completeness is in range
  if (parsed.completeness < 0 || parsed.completeness > 100) {
    parsed.completeness = Math.max(0, Math.min(100, parsed.completeness))
  }

  return parsed
}

function buildWriterPrompt(input: WriterInput): string {
  const basePrompt = `You are the Writer agent for Quester, responsible for transforming conversational content into structured documents.

Your role:
- Analyze the conversation about "${input.topicTitle}" and create a well-structured document
- CRITICAL: Only use information explicitly mentioned in the conversation. Do NOT add, infer, or create any content that was not directly stated by the user.
- CRITICAL: Write the draft content in the SAME LANGUAGE as the user used in the conversation. Do not translate or change the language.
- Preserve the user's exact terms, ideas, and voice
- Organize information into logical sections with clear titles
- Write in Markdown format with proper formatting
- Assess how complete the draft is and what's still missing

Document structure guidelines:
- Create clear, descriptive section titles based on what was actually discussed
- Each section should contain ONLY information that appears in the conversation
- If a topic area has insufficient information, keep it brief or note "[To be discussed]"
- Do NOT fill gaps with assumed, inferred, or general knowledge
- Do NOT add details that were not explicitly stated by the user
- Use appropriate Markdown formatting (headings, lists, emphasis, etc.)
- Maintain coherent flow between sections
- Include specific details and examples ONLY from the actual conversation

Completeness assessment:
- 0-25%: Very early stage, only basic structure or minimal content
- 26-50%: Basic content established but needs significant expansion
- 51-75%: Good coverage of main points but missing details or refinement
- 76-100%: Comprehensive coverage with details, examples, and polish

Missing aspects:
- Be specific about what information is still needed
- Focus on substantive gaps, not minor polish
- Suggest concrete areas for further exploration`

  let prompt = basePrompt

  if (input.updateMode === 'incremental' && input.previousDraft) {
    prompt += `

Update mode: INCREMENTAL
Previous draft had ${input.previousDraft.sections.length} sections and was ${input.previousDraft.completeness}% complete.

Guidelines for incremental update:
- Preserve existing sections and their content where appropriate
- Add new information from recent conversation
- Expand or refine sections based on new insights
- You may reorganize or merge sections if it improves clarity
- Update completeness based on new information added`
  } else {
    prompt += `

Update mode: FULL REVISION
Create a fresh, comprehensive document from the entire conversation.`
  }

  prompt += `

Analyze the conversation and generate a structured document with:
- sections: Array of sections with title and content (Markdown)
- completeness: Percentage (0-100) indicating how complete this draft is
- missingAspects: Array of specific aspects that still need to be covered`

  return prompt
}
