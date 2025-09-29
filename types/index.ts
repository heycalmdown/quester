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