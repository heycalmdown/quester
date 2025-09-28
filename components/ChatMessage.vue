<template>
  <div
    :class="[
      'chat-message',
      message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'
    ]"
  >
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0">
        <UAvatar
          :icon="message.role === 'user' ? 'i-heroicons-user' : 'i-heroicons-chat-bubble-left-ellipsis'"
          :color="message.role === 'user' ? 'blue' : 'gray'"
          size="sm"
        />
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-gray-900 mb-1">
          {{ message.role === 'user' ? 'You' : 'Quester' }}
        </div>
        <div class="text-sm text-gray-700 whitespace-pre-wrap">
          {{ message.content }}
        </div>
        <div class="text-xs text-gray-500 mt-2">
          {{ formatTimestamp(message.timestamp) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Message } from '~/types'

interface Props {
  message: Message
}

defineProps<Props>()

function formatTimestamp(timestamp: Date): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>