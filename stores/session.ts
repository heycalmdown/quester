import { defineStore } from 'pinia'
import type { FetchOptions } from 'ofetch'
import type { Session, Message, Topic, LLMRequest, LLMResponse } from '~/types'

type SessionIdRoute = `/api/sessions/${string}`

export const useSessionStore = defineStore('session', {
  state: () => ({
    currentSession: null as Session | null,
    isLoading: false,
    error: null as string | null
  }),

  getters: {
    hasActiveSession: (state) => state.currentSession !== null,

    currentTopic: (state) => {
      if (!state.currentSession?.currentTopic) return null
      return state.currentSession.topics.find(
        topic => topic.id === state.currentSession?.currentTopic
      )
    },

    backlogTopics: (state) => {
      if (!state.currentSession) return []
      return state.currentSession.topics
        .filter(topic => topic.status === 'backlog')
        .sort((a, b) => a.title.localeCompare(b.title))
    },

    completedTopics: (state) => {
      if (!state.currentSession) return []
      return state.currentSession.topics.filter(topic => topic.status === 'completed')
    }
  },

  actions: {
    async createNewSession(title?: string) {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<Session>('/api/sessions', {
          method: 'post',
          body: { title }
        })

        this.currentSession = normalizeSession(response)
        return this.currentSession
      } catch (error) {
        this.error = 'Failed to create new session'
        console.error('Error creating session:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async loadSession(sessionId: string) {
      this.isLoading = true
      this.error = null

      try {
        const session = await $fetch<Session>(`/api/sessions/${sessionId}`)
        this.currentSession = normalizeSession(session)
        return this.currentSession
      } catch (error) {
        this.error = 'Failed to load session'
        console.error('Error loading session:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async resumeLatestSession() {
      this.isLoading = true

      try {
        const session = await $fetch<Session | null>('/api/sessions/latest')

        if (!session) {
          this.currentSession = null
          return false
        }

        this.currentSession = normalizeSession(session)
        return true
      } catch (error) {
        console.error('Error resuming latest session:', error)
        return false
      } finally {
        this.isLoading = false
      }
    },

    async saveCurrentSession() {
      if (!this.currentSession) {
        throw new Error('No active session to save')
      }

      this.isLoading = true
      this.error = null

      try {
        this.currentSession.updatedAt = new Date()

        const sessionRoute: SessionIdRoute = `/api/sessions/${this.currentSession.id}`
        const updateOptions: FetchOptions<'json', Session> = {
          method: 'post',
          body: this.currentSession
        }

        // Nitro route typing cannot match our interpolated ID, so we cast to runtime-compatible shape.
        await $fetch(sessionRoute as any, updateOptions as any)
      } catch (error) {
        this.error = 'Failed to save session'
        console.error('Error saving session:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async sendMessage(content: string) {
      if (!this.currentSession) {
        throw new Error('No active session')
      }

      this.isLoading = true
      this.error = null

      try {
        // Add user message
        const userMessage: Message = {
          id: generateMessageId(),
          role: 'user',
          content,
          timestamp: new Date()
        }

        this.currentSession.messages.push(userMessage)

        // Prepare request for LLM
        const request: LLMRequest = {
          sessionId: this.currentSession.id,
          messages: this.currentSession.messages,
          context: {
            currentTopic: this.currentTopic || undefined,
            backlog: this.backlogTopics,
            preferences: this.currentSession.userPreferences
          }
        }

        // Get response from LLM
        const response = await $fetch<LLMResponse>('/api/chat', {
          method: 'post',
          body: request
        })

        // Add assistant message
        const assistantMessage: Message = {
          id: generateMessageId(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date()
        }

        this.currentSession.messages.push(assistantMessage)

        // Process topic updates if present
        if (response.topicUpdates) {
          this.applyTopicUpdates(response.topicUpdates)
        }

        // Save session
        await this.saveCurrentSession()

        return assistantMessage
      } catch (error) {
        this.error = 'Failed to send message'
        console.error('Error sending message:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    addTopic(title: string) {
      if (!this.currentSession) return

      const topic: Topic = {
        id: generateTopicId(),
        title,
        status: 'backlog',
        questions: [],
        notes: []
      }

      this.currentSession.topics.push(topic)
    },

    setCurrentTopic(topicId: string) {
      if (!this.currentSession) return

      const topic = this.currentSession.topics.find(t => t.id === topicId)
      if (topic) {
        this.currentSession.currentTopic = topicId
        topic.status = 'active'
      }
    },

    completeTopic(topicId: string) {
      if (!this.currentSession) return

      const topic = this.currentSession.topics.find(t => t.id === topicId)
      if (topic) {
        topic.status = 'completed'

        // Clear current topic if it was the active one
        if (this.currentSession.currentTopic === topicId) {
          this.currentSession.currentTopic = undefined
        }
      }
    },


    updateUserPreferences(preferredTerms: string[], avoidedTerms: string[]) {
      if (!this.currentSession) return

      this.currentSession.userPreferences = {
        preferredTerms,
        avoidedTerms
      }
    },

    applyTopicUpdates(topicUpdates: NonNullable<LLMResponse['topicUpdates']>) {
      if (!this.currentSession) return

      // Update current topic if specified
      if (topicUpdates.currentTopic) {
        const currentTopicId = this.currentSession.currentTopic

        // Check if this is a topic transition (new topic title different from current)
        const currentTopic = currentTopicId ? this.currentSession.topics.find(t => t.id === currentTopicId) : null
        const isTopicTransition = currentTopic &&
          topicUpdates.currentTopic.title &&
          topicUpdates.currentTopic.title !== currentTopic.title

        if (isTopicTransition) {
          // Move current topic to backlog
          if (currentTopic) {
            currentTopic.status = 'backlog'
          }

          // Create new current topic
          const newTopic: Topic = {
            id: generateTopicId(),
            title: topicUpdates.currentTopic.title || 'Current Discussion',
            status: 'active',
            questions: [],
            notes: []
          }
          this.currentSession.topics.push(newTopic)
          this.currentSession.currentTopic = newTopic.id
        } else if (currentTopic) {
          // Update existing topic with new information (same topic)
          currentTopic.title = topicUpdates.currentTopic.title || currentTopic.title
        } else {
          // Create new current topic if none exists
          const newTopic: Topic = {
            id: generateTopicId(),
            title: topicUpdates.currentTopic.title || 'Current Discussion',
            status: 'active',
            questions: [],
            notes: []
          }
          this.currentSession.topics.push(newTopic)
          this.currentSession.currentTopic = newTopic.id
        }
      }

      // Add new topics to backlog (with duplicate prevention)
      if (topicUpdates.newTopics && topicUpdates.newTopics.length > 0) {
        const hasCurrentTopic = !!this.currentSession.currentTopic
        const existingTopicTitles = this.currentSession.topics.map(t => t.title.toLowerCase())

        for (let i = 0; i < topicUpdates.newTopics.length; i++) {
          const newTopicData = topicUpdates.newTopics[i]
          const isFirstNewTopic = i === 0
          const topicTitle = newTopicData.title || 'Unnamed Topic'

          // Skip if topic with same title already exists
          if (existingTopicTitles.includes(topicTitle.toLowerCase())) {
            continue
          }

          const newTopic: Topic = {
            id: generateTopicId(),
            title: topicTitle,
            // If no current topic exists, make the first new topic active
            status: (!hasCurrentTopic && isFirstNewTopic) ? 'active' : (newTopicData.status || 'backlog'),
            questions: newTopicData.questions || [],
            notes: newTopicData.notes || []
          }

          this.currentSession.topics.push(newTopic)

          // Set the first new topic as current if no current topic exists
          if (!hasCurrentTopic && isFirstNewTopic) {
            this.currentSession.currentTopic = newTopic.id
          }
        }
      }

    },

    clearSession() {
      this.currentSession = null
      this.error = null
    }
  }
})

function normalizeSession(session: Session): Session {
  return {
    ...session,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
    messages: session.messages.map(message => ({
      ...message,
      timestamp: new Date(message.timestamp)
    }))
  }
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

function generateTopicId(): string {
  return `topic_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}
