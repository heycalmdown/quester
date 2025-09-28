import { defineStore } from 'pinia'
import type { Session, Message, Topic, LLMRequest } from '~/types'

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
        .sort((a, b) => a.priority - b.priority)
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
          method: 'POST',
          body: { title }
        })

        this.currentSession = response
        return response
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
        this.currentSession = session
        return session
      } catch (error) {
        this.error = 'Failed to load session'
        console.error('Error loading session:', error)
        throw error
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

        await $fetch(`/api/sessions/${this.currentSession.id}`, {
          method: 'POST',
          body: this.currentSession
        })
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
          messages: this.currentSession.messages,
          context: {
            currentTopic: this.currentTopic || undefined,
            backlog: this.backlogTopics,
            preferences: this.currentSession.userPreferences
          }
        }

        // Get response from LLM
        const response = await $fetch<{ message: string }>('/api/chat', {
          method: 'POST',
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

    addTopic(title: string, priority: number = 1) {
      if (!this.currentSession) return

      const topic: Topic = {
        id: generateTopicId(),
        title,
        priority,
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

    updateTopicPriority(topicId: string, newPriority: number) {
      if (!this.currentSession) return

      const topic = this.currentSession.topics.find(t => t.id === topicId)
      if (topic) {
        topic.priority = newPriority
      }
    },

    updateUserPreferences(preferredTerms: string[], avoidedTerms: string[]) {
      if (!this.currentSession) return

      this.currentSession.userPreferences = {
        preferredTerms,
        avoidedTerms
      }
    },

    clearSession() {
      this.currentSession = null
      this.error = null
    }
  }
})

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

function generateTopicId(): string {
  return `topic_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}