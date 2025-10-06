import OpenAI from "openai";
import type { LLMRequest, LLMResponse } from "~/types";
import { runOrchestrator } from "../agents/orchestrator";
import { runInterviewer } from "../agents/interviewer";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const openai = new OpenAI({
    apiKey: config.openaiApiKey,
    timeout: 15000,
    maxRetries: 0,
  });

  try {
    const body = await readBody<LLMRequest>(event);

    if (!body.messages || body.messages.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Messages are required",
      });
    }

    const model: string = config.openaiModel || "gpt-5-mini";

    // Step 1: Run Orchestrator Agent for topic detection
    let orchestratorResult;
    try {
      orchestratorResult = await runOrchestrator(
        {
          messages: body.messages,
          currentTopic: body.context?.currentTopic,
          existingTopics: body.context?.backlog || [],
        },
        openai,
        model
      );
    } catch (error) {
      console.warn("Orchestrator failed, continuing without topic updates:", error);
      orchestratorResult = null;
    }

    // Step 2: Run Interviewer Agent for question generation
    const interviewerResult = await runInterviewer(
      {
        messages: body.messages,
        topicContext: {
          currentTopic: orchestratorResult?.currentTopic || body.context?.currentTopic?.title || "General Discussion",
          backlogTopics: body.context?.backlog?.map((t) => t.title) || [],
        },
        userPreferences: body.context?.preferences || {
          preferredTerms: [],
          avoidedTerms: [],
        },
      },
      openai,
      model
    );

    // Step 3: Combine results into existing response format
    const response: LLMResponse = {
      message: interviewerResult.message,
      topicUpdates: orchestratorResult
        ? {
            currentTopic: { title: orchestratorResult.currentTopic },
            newTopics:
              orchestratorResult.newTopics.length > 0
                ? orchestratorResult.newTopics.map((title) => ({
                    title,
                    status: "backlog" as const,
                    questions: [],
                    notes: [],
                  }))
                : undefined,
          }
        : undefined,
    };

    return response;
  } catch (error: any) {
    console.error("Chat API error:", error?.message || error);

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to process chat request",
    });
  }
});
