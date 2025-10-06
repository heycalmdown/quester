import OpenAI from "openai";
import type { OrchestratorInput, OrchestratorOutput } from "./types";

export async function runOrchestrator(
  input: OrchestratorInput,
  openai: OpenAI,
  model: string
): Promise<OrchestratorOutput> {
  const instructions = buildOrchestratorPrompt(input);

  const conversationHistory = input.messages
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n\n");

  const responseSchema = {
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
  };

  const completion = await openai.responses.create({
    model,
    instructions,
    input: conversationHistory,
    max_output_tokens: 500,
    store: false,
    text: {
      format: {
        type: "json_schema",
        name: "orchestrator_output",
        schema: responseSchema,
        strict: true,
      },
    },
  });

  const response = completion.output_text;

  if (!response) {
    throw new Error("No response from Orchestrator");
  }

  const parsed = JSON.parse(response);

  if (!parsed.currentTopic) {
    throw new Error("Orchestrator must provide currentTopic");
  }

  return {
    currentTopic: parsed.currentTopic,
    newTopics: parsed.newTopics || [],
  };
}

function buildOrchestratorPrompt(input: OrchestratorInput): string {
  const basePrompt = `You are the Orchestrator agent for Quester, responsible for topic detection and classification.

Your role:
- Analyze the conversation to identify the main topic currently being discussed
- Detect any new side-topics mentioned that should be tracked separately
- Distinguish between the active topic and tangential topics

Guidelines for topic detection:
- currentTopic must always be provided and represent what's actively being discussed
- If this is the very first message and user mentions a topic, set that as currentTopic
- If user shifts focus to a new topic, update currentTopic accordingly
- newTopics should contain any other topics mentioned that aren't the main focus of discussion
- Be proactive in identifying the main conversational thread vs. tangential topics
- Always provide a clear, descriptive currentTopic even for general conversations
- IMPORTANT: If there is a current active topic and the conversation continues on the same topic, you MUST return the EXACT same topic title. Do not rephrase, expand, or modify it in any way.`;

  let prompt = basePrompt;

  if (input.currentTopic) {
    prompt += `

Current active topic: "${input.currentTopic.title}"
IMPORTANT: If the conversation is still about this same topic, return EXACTLY: "${input.currentTopic.title}"`;
  }

  if (input.existingTopics.length > 0) {
    const existingTitles = input.existingTopics.map((t) => t.title).join(", ");
    prompt += `

Existing topics in backlog: ${existingTitles}`;
  }

  prompt += `

Analyze the conversation and return:
- currentTopic: The main topic currently being discussed
- newTopics: Array of new side-topics mentioned (empty array if none)`;

  return prompt;
}
