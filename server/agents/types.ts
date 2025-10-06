import type { Message, Topic } from "~/types";

// Orchestrator Agent Types
export interface OrchestratorInput {
  messages: Message[];
  currentTopic?: Topic;
  existingTopics: Topic[];
}

export interface OrchestratorOutput {
  currentTopic: string;
  newTopics: string[];
}

// Interviewer Agent Types
export interface InterviewerInput {
  messages: Message[];
  topicContext: {
    currentTopic: string;
    backlogTopics: string[];
  };
  userPreferences: {
    preferredTerms: string[];
    avoidedTerms: string[];
  };
}

export interface InterviewerOutput {
  message: string;
}
