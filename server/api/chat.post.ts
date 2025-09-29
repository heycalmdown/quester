import OpenAI from "openai";
import type { LLMRequest, LLMResponse } from "~/types";

export default defineEventHandler(async (event) => {
  // Initialize OpenAI client inside the handler to access runtime config
  const config = useRuntimeConfig();

  const openai = new OpenAI({
    apiKey: config.openaiApiKey,
    timeout: 15000, // 15 seconds timeout
    maxRetries: 0, // Disable retries to avoid cumulative delays
  });
  try {
    const body = await readBody<LLMRequest>(event);

    if (!body.messages || body.messages.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Messages are required",
      });
    }

    // Build system prompt with context
    const instructions = buildSystemPrompt(body.context);

    // Create input string from messages
    const conversationHistory = body.messages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n\n");

    const input = conversationHistory;

    const model: string = config.openaiModel || "gpt-4o";

    // Define JSON schema for structured output
    const responseSchema = {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "Your conversational response to the user",
        },
        topicUpdates: {
          type: "object",
          properties: {
            currentTopic: {
              type: "string",
              description:
                "The topic currently being discussed - always required and never empty",
            },
            newTopics: {
              type: "array",
              items: {
                type: "string",
              },
              description:
                "Array of new topics discovered but not part of current discussion (empty array if none)",
            },
          },
          required: ["currentTopic", "newTopics"],
          additionalProperties: false,
        },
      },
      required: ["message", "topicUpdates"],
      additionalProperties: false,
    };

    // Use the new Responses API with structured outputs
    const completion = await openai.responses.create({
      model,
      instructions,
      input,
      max_output_tokens: 1500,
      store: false, // Don't store for privacy
      text: {
        format: {
          type: "json_schema",
          name: "quester_response",
          schema: responseSchema,
          strict: true,
        },
      },
    });

    const response = completion.output_text;

    if (!response) {
      throw createError({
        statusCode: 500,
        statusMessage: "No response from OpenAI",
      });
    }

    // Parse structured JSON response
    console.log("response", response);
    const structuredResponse = parseStructuredResponse(response);

    return structuredResponse;
  } catch (error: any) {
    console.error("Chat API error:", error?.message || error);

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to process chat request",
    });
  }
});

function buildSystemPrompt(context?: LLMRequest["context"]): string {
  const basePrompt = `You are Quester, a conversational writing agent that acts like a seasoned interviewer. Your goal is to guide users through questions to clarify, confirm, and structure their thoughts into finished writing.

Key behaviors:
- Ask ONE question at a time to avoid overwhelming the user
- Summarize their answers and confirm understanding before proceeding
- Preserve important terms they use, avoid terms they dislike
- Track context and detect topic shifts
- Maintain a topic backlog for side-topics to revisit later
- Use divergence-convergence flow: broaden ideas, then narrow to key themes
- Provide framing: occasionally summarize direction and confirm with user
- IMPORTANT: Always respond in the same language that the user uses. Match their language exactly.

Your response will be structured JSON with these fields:
- message: Your conversational response to the user (in the same language as the user)
- topicUpdates: Object containing topic detection results (always present)
  - currentTopic: The topic currently being discussed (always required, never empty)
  - newTopics: Array of new topics discovered but not part of current discussion (empty array if none)

Guidelines for topic detection:
- currentTopic must always be provided and represent what you're actively discussing with the user
- If this is the very first message and user mentions a topic, set that as currentTopic
- If user shifts focus to a new topic, update currentTopic accordingly
- newTopics should contain any other topics mentioned that aren't the main focus of discussion
- Be proactive in identifying the main conversational thread vs. tangential topics
- Always provide a clear, descriptive currentTopic even for general conversations`;

  let prompt = basePrompt;

  if (context?.currentTopic) {
    prompt += `

Current active topic: "${context.currentTopic.title}"`;
  }

  if (context?.backlog && context.backlog.length > 0) {
    const backlogTitles = context.backlog.map((t) => t.title).join(", ");
    prompt += `

Topics in backlog: ${backlogTitles}`;
  }

  if (context?.preferences) {
    const { preferredTerms, avoidedTerms } = context.preferences;
    prompt += `

User preferences:
- Preferred terms to preserve: ${preferredTerms.join(", ")}
- Terms to avoid: ${avoidedTerms.join(", ")}`;
  }

  return prompt;
}

function parseStructuredResponse(response: string): LLMResponse {
  try {
    // Parse the structured JSON response
    const parsed = JSON.parse(response);

    // Validate required fields
    if (
      !parsed.message ||
      !parsed.topicUpdates ||
      !parsed.topicUpdates.currentTopic
    ) {
      throw new Error("Missing required fields");
    }

    // Transform topic structure for our internal format
    const allNewTopics = [];

    // Add newTopics as simple topic objects
    if (
      Array.isArray(parsed.topicUpdates.newTopics) &&
      parsed.topicUpdates.newTopics.length > 0
    ) {
      allNewTopics.push(
        ...parsed.topicUpdates.newTopics.map((topicTitle: string) => ({
          title: topicTitle,
          status: "backlog" as const,
          questions: [],
          notes: [],
        }))
      );
    }

    const topicUpdates = {
      currentTopic: { title: parsed.topicUpdates.currentTopic },
      newTopics: allNewTopics.length > 0 ? allNewTopics : undefined,
    };

    return {
      message: parsed.message,
      topicUpdates,
    };
  } catch (error) {
    // Fallback to legacy parsing for backwards compatibility
    console.warn("Failed to parse structured response:", error);
    return {
      message: response,
      topicUpdates: undefined,
    };
  }
}
