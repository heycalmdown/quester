import OpenAI from "openai";
import type { LLMRequest, LLMResponse, Message } from "~/types";
import { runOrchestrator } from "../agents/orchestrator";
import { runInterviewer } from "../agents/interviewer";
import { runWriter } from "../agents/writer";
import { loadDraft, saveDraft } from "../utils/draftPersistence";
import { runInBackground, startTask, completeTask, failTask } from "../utils/backgroundTasks";

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

    // Step 4: Trigger Writer Agent in background (non-blocking)
    const sessionId = body.sessionId;
    const currentTopicId = body.context?.currentTopic?.id;

    if (sessionId && currentTopicId) {
      runInBackground(
        async () => {
          try {
            startTask(sessionId, currentTopicId, 'draft_generation');

            // Filter messages by current topic (simplified - matches all for now)
            const topicMessages = body.messages;

            // Load previous draft if exists
            const previousDraft = await loadDraft(sessionId, currentTopicId);

            // Run Writer Agent
            const writerResult = await runWriter(
              {
                topicId: currentTopicId,
                topicTitle: orchestratorResult?.currentTopic || body.context?.currentTopic?.title || "Discussion",
                topicMessages,
                previousDraft: previousDraft ? {
                  sections: previousDraft.sections,
                  completeness: previousDraft.completeness
                } : undefined,
                updateMode: previousDraft ? 'incremental' : 'full_revision'
              },
              openai,
              model
            );

            // Save draft
            await saveDraft(sessionId, {
              topicId: currentTopicId,
              topicTitle: orchestratorResult?.currentTopic || body.context?.currentTopic?.title || "Discussion",
              sections: writerResult.sections,
              completeness: writerResult.completeness,
              missingAspects: writerResult.missingAspects,
              updatedAt: new Date().toISOString()
            });

            completeTask(sessionId, currentTopicId);
            console.log(`Draft generated for topic ${currentTopicId} (${writerResult.completeness}% complete)`);
          } catch (error: any) {
            failTask(sessionId, currentTopicId, error?.message || 'Unknown error');
            console.error('Writer Agent background task failed:', error);
          }
        },
        (error) => {
          console.error('Unhandled error in Writer background task:', error);
        }
      );
    }

    return response;
  } catch (error: any) {
    console.error("Chat API error:", error?.message || error);

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to process chat request",
    });
  }
});
