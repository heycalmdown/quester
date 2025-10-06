import OpenAI from "openai";
import type { InterviewerInput, InterviewerOutput } from "./types";

export async function runInterviewer(
  input: InterviewerInput,
  openai: OpenAI,
  model: string
): Promise<InterviewerOutput> {
  const instructions = buildInterviewerPrompt(input);

  const conversationHistory = input.messages
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n\n");

  const responseSchema = {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "Your conversational response to the user",
      },
    },
    required: ["message"],
    additionalProperties: false,
  };

  const completion = await openai.responses.create({
    model,
    instructions,
    input: conversationHistory,
    max_output_tokens: 1000,
    store: false,
    text: {
      format: {
        type: "json_schema",
        name: "interviewer_output",
        schema: responseSchema,
        strict: true,
      },
    },
  });

  const response = completion.output_text;

  if (!response) {
    throw new Error("No response from Interviewer");
  }

  const parsed = JSON.parse(response);

  if (!parsed.message) {
    throw new Error("Interviewer must provide message");
  }

  return {
    message: parsed.message,
  };
}

function buildInterviewerPrompt(input: InterviewerInput): string {
  const basePrompt = `You are the Interviewer agent for Quester, a conversational writing agent that acts like a seasoned interviewer.

Your role:
- Ask ONE question at a time to avoid overwhelming the user
- Summarize their answers and confirm understanding before proceeding
- Preserve important terms they use, avoid terms they dislike
- Use divergence-convergence flow: broaden ideas, then narrow to key themes
- Provide framing: occasionally summarize direction and confirm with user
- IMPORTANT: Always respond in the same language that the user uses. Match their language exactly.

Your goal is to guide users through questions to clarify, confirm, and structure their thoughts into finished writing.`;

  let prompt = basePrompt;

  prompt += `

Current topic context:
- Main topic being discussed: "${input.topicContext.currentTopic}"`;

  if (input.topicContext.backlogTopics.length > 0) {
    const backlogTitles = input.topicContext.backlogTopics.join(", ");
    prompt += `
- Topics in backlog for later: ${backlogTitles}`;
  }

  if (
    input.userPreferences.preferredTerms.length > 0 ||
    input.userPreferences.avoidedTerms.length > 0
  ) {
    prompt += `

User preferences:`;

    if (input.userPreferences.preferredTerms.length > 0) {
      prompt += `
- Preferred terms to preserve: ${input.userPreferences.preferredTerms.join(", ")}`;
    }

    if (input.userPreferences.avoidedTerms.length > 0) {
      prompt += `
- Terms to avoid: ${input.userPreferences.avoidedTerms.join(", ")}`;
    }
  }

  prompt += `

Generate your response as a professional interviewer, following the guidelines above.`;

  return prompt;
}
