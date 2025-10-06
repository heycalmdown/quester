export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface Topic {
  id: string
  title: string
  status: 'active' | 'completed' | 'backlog'
  questions: string[]
  notes: string[]
}

export interface Session {
  id: string
  title?: string
  messages: Message[]
  topics: Topic[]
  currentTopic?: string
  userPreferences: {
    preferredTerms: string[]
    avoidedTerms: string[]
  }
  createdAt: Date
  updatedAt: Date
}

export interface LLMRequest {
  sessionId: string
  messages: Message[]
  context?: {
    currentTopic?: Topic
    backlog: Topic[]
    preferences: Session['userPreferences']
  }
}

export interface LLMResponse {
  message: string
  topicUpdates?: {
    currentTopic?: { title: string }
    newTopics?: Partial<Topic>[]
  }
}

export interface DraftSection {
  title: string
  content: string
}

export interface Draft {
  topicId: string
  topicTitle: string
  sections: DraftSection[]
  completeness: number
  missingAspects: string[]
  updatedAt: string
}

export interface DraftMetadata {
  topicId: string
  topicTitle: string
  completeness: number
  updatedAt: string
}

export interface BackgroundTask {
  sessionId: string
  taskType: 'draft_generation'
  topicId: string
  status: 'running' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  error?: string
}