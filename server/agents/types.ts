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

// Writer Agent Types
export interface WriterInput {
  topicId: string;
  topicTitle: string;
  topicMessages: Message[];
  previousDraft?: {
    sections: Array<{ title: string; content: string }>;
    completeness: number;
  };
  updateMode: 'incremental' | 'full_revision';
}

export interface WriterOutput {
  sections: Array<{
    title: string;
    content: string;
  }>;
  completeness: number;
  missingAspects: string[];
}
