<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Quester</h1>
            <p class="text-gray-600">Your conversational writing companion</p>
          </div>
          <div class="flex space-x-4">
            <UButton
              v-if="!sessionStore.hasActiveSession"
              @click="startNewSession"
              :loading="sessionStore.isLoading"
              icon="i-heroicons-plus"
            >
              New Session
            </UButton>
            <UButton
              v-if="sessionStore.hasActiveSession"
              @click="endSession"
              variant="outline"
              icon="i-heroicons-x-mark"
            >
              End Session
            </UButton>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Welcome Screen -->
      <div v-if="!sessionStore.hasActiveSession" class="text-center py-12">
        <div class="max-w-2xl mx-auto">
          <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-16 h-16 text-blue-500 mx-auto mb-6" />
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Quester
          </h2>
          <p class="text-lg text-gray-600 mb-8">
            Start a conversation and let me guide you through questions to clarify,
            confirm, and structure your thoughts into finished writing.
          </p>
          <UButton
            @click="startNewSession"
            :loading="sessionStore.isLoading"
            size="lg"
            icon="i-heroicons-play"
          >
            Start Your First Session
          </UButton>
        </div>
      </div>

      <!-- Active Session -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Chat Area -->
        <div class="lg:col-span-3">
          <div class="bg-white rounded-lg shadow">
            <!-- Session Header -->
            <div class="border-b p-4">
              <h2 class="text-lg font-medium text-gray-900">
                {{ sessionStore.currentSession?.title || 'Untitled Session' }}
              </h2>
              <p class="text-sm text-gray-500">
                Started {{ formatDate(sessionStore.currentSession?.createdAt) }}
              </p>
            </div>

            <!-- Messages -->
            <div class="h-96 overflow-y-auto p-4 space-y-4">
              <div v-if="messages.length === 0" class="text-center text-gray-500 py-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
              <ChatMessage
                v-for="message in messages"
                :key="message.id"
                :message="message"
              />
            </div>

            <!-- Input -->
            <ChatInput
              :is-loading="sessionStore.isLoading"
              @send="handleSendMessage"
            />
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <TopicBacklog
            :backlog-topics="sessionStore.backlogTopics"
            :current-topic="sessionStore.currentTopic"
            @set-current="handleSetCurrentTopic"
            @complete-topic="handleCompleteTopic"
            @increase-priority="handleIncreasePriority"
            @decrease-priority="handleDecreasePriority"
          />
        </div>
      </div>
    </main>

    <!-- Error Toast -->
    <UNotifications />
  </div>
</template>

<script setup>
const sessionStore = useSessionStore()
const toast = useToast()

// Computed
const messages = computed(() => sessionStore.currentSession?.messages || [])

// Methods
async function startNewSession() {
  try {
    await sessionStore.createNewSession()

    // Add welcome message from Quester
    await nextTick()
    if (sessionStore.currentSession) {
      sessionStore.currentSession.messages.push({
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm Quester, your conversational writing companion. I'll help you structure your thoughts through guided questions. What would you like to explore or write about today?",
        timestamp: new Date()
      })
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to start new session',
      color: 'red'
    })
  }
}

function endSession() {
  sessionStore.clearSession()
}

async function handleSendMessage(content) {
  try {
    await sessionStore.sendMessage(content)
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to send message',
      color: 'red'
    })
  }
}

function handleSetCurrentTopic(topicId) {
  sessionStore.setCurrentTopic(topicId)
}

function handleCompleteTopic(topicId) {
  sessionStore.completeTopic(topicId)
}

function handleIncreasePriority(topicId) {
  const topic = sessionStore.currentSession?.topics.find(t => t.id === topicId)
  if (topic && topic.priority > 1) {
    sessionStore.updateTopicPriority(topicId, topic.priority - 1)
  }
}

function handleDecreasePriority(topicId) {
  const topic = sessionStore.currentSession?.topics.find(t => t.id === topicId)
  if (topic) {
    sessionStore.updateTopicPriority(topicId, topic.priority + 1)
  }
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

// Handle errors
watch(() => sessionStore.error, (error) => {
  if (error) {
    toast.add({
      title: 'Error',
      description: error,
      color: 'red'
    })
  }
})
</script>