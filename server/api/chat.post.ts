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

    // Convert our message format to OpenAI format
    const openaiMessages = body.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add system prompt for Quester behavior
    const systemPrompt = buildSystemPrompt(body.context);

    const completion = await openai.chat.completions.create({
      model: "o4-mini",
      messages: [{ role: "system", content: systemPrompt }, ...openaiMessages],
      max_completion_tokens: 1500, // Increased from 500 to allow longer responses
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw createError({
        statusCode: 500,
        statusMessage: "No response from OpenAI",
      });
    }

    // Parse response and extract structured information
    const structuredResponse = parseQuesterResponse(response);

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

IMPORTANT: After your response, if you detect new topics or side topics in the user's message, provide them in this exact format:
[TOPICS]
- Main Topic: [title if user is continuing current discussion]
- New Topics: [comma-separated list of new topics mentioned]
- Side Topics: [comma-separated list of tangential topics to save for later]
[/TOPICS]

Guidelines:
- If this is the FIRST topic mentioned in the conversation, put it in "New Topics" not "Main Topic"
- If user shifts focus to a new topic or wants to discuss something else first, use "Main Topic"
- If user clearly states what they want to explore or write about, ALWAYS include [TOPICS] section
- Be proactive in detecting topics mentioned by users`;

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

function parseQuesterResponse(response: string): LLMResponse {
  // Extract main message (everything before [TOPICS] section)
  const topicsMatch = response.match(/\[TOPICS\]([\s\S]*?)\[\/TOPICS\]/);
  const message = topicsMatch
    ? response.replace(/\[TOPICS\][\s\S]*?\[\/TOPICS\]/, "").trim()
    : response;

  // Parse topic updates if present
  let topicUpdates;
  if (topicsMatch) {
    const topicsSection = topicsMatch[1];
    topicUpdates = parseTopicsSection(topicsSection);
  }

  return {
    message,
    needsConfirmation:
      message.includes("Is that correct?") ||
      message.includes("Does that sound right?"),
    topicUpdates,
  };
}

function parseTopicsSection(topicsText: string) {
  const lines = topicsText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const updates: NonNullable<LLMResponse["topicUpdates"]> = {};

  for (const line of lines) {
    if (line.startsWith("- Main Topic:")) {
      const title = line.replace("- Main Topic:", "").trim();
      if (
        title &&
        title !== "[title if user is continuing current discussion]"
      ) {
        updates.currentTopic = { title };
      }
    } else if (line.startsWith("- New Topics:")) {
      const topics = line.replace("- New Topics:", "").trim();
      if (
        topics &&
        topics !== "[comma-separated list of new topics mentioned]"
      ) {
        updates.newTopics = topics.split(",").map((topic) => ({
          title: topic.trim(),
          priority: 2, // Medium priority for new topics
          status: "backlog" as const,
          questions: [],
          notes: [],
        }));
      }
    } else if (line.startsWith("- Side Topics:")) {
      const topics = line.replace("- Side Topics:", "").trim();
      if (
        topics &&
        topics !==
          "[comma-separated list of tangential topics to save for later]"
      ) {
        const sideTopics = topics.split(",").map((topic) => ({
          title: topic.trim(),
          priority: 3, // Lower priority for side topics
          status: "backlog" as const,
          questions: [],
          notes: [],
        }));
        updates.newTopics = updates.newTopics
          ? [...updates.newTopics, ...sideTopics]
          : sideTopics;
      }
    }
  }

  return Object.keys(updates).length > 0 ? updates : undefined;
}
