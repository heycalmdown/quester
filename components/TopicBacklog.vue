<template>
  <div class="bg-white rounded-lg shadow p-4">
    <h3 class="text-lg font-medium text-gray-900 mb-4">Topic Backlog</h3>

    <div v-if="backlogTopics.length === 0" class="text-gray-500 text-sm">
      No topics in backlog yet
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="topic in backlogTopics"
        :key="topic.id"
        class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
      >
        <div class="flex-1">
          <div class="font-medium text-gray-900">{{ topic.title }}</div>
        </div>
        <div class="flex space-x-2">
          <UButton
            size="xs"
            variant="outline"
            @click="$emit('set-current', topic.id)"
          >
            Discuss
          </UButton>
        </div>
      </div>
    </div>

    <div v-if="currentTopic" class="mt-6 pt-4 border-t">
      <h4 class="font-medium text-gray-900 mb-2">Current Topic</h4>
      <div class="p-3 bg-blue-50 rounded-lg">
        <div class="font-medium text-blue-900">{{ currentTopic.title }}</div>
        <div class="text-sm text-blue-700 mt-1">Status: {{ currentTopic.status }}</div>
        <UButton
          size="xs"
          variant="outline"
          color="blue"
          class="mt-2"
          @click="$emit('complete-topic', currentTopic.id)"
        >
          Mark Complete
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Topic } from '~/types'

interface Props {
  backlogTopics: Topic[]
  currentTopic?: Topic | null
}

interface Emits {
  (e: 'set-current', topicId: string): void
  (e: 'complete-topic', topicId: string): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>