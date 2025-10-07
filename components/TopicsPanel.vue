<template>
  <div class="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
        Topics
      </h2>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Current Topic -->
      <div v-if="currentTopic" class="mb-6">
        <h3 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Current Topic</h3>
        <div
          class="cursor-pointer rounded-lg border-2 bg-blue-50 p-3 dark:bg-blue-900/20"
          :class="selectedDraftTopicId === currentTopic.id ? 'border-blue-500' : 'border-blue-200 dark:border-blue-800'"
          @click="$emit('select-draft', currentTopic.id)"
        >
          <div class="mb-2 font-medium text-blue-900 dark:text-blue-100">
            {{ currentTopic.title }}
          </div>
          <div class="flex space-x-2">
            <UButton
              size="xs"
              variant="outline"
              color="blue"
              @click.stop="$emit('complete-topic', currentTopic.id)"
            >
              Mark Complete
            </UButton>
          </div>
        </div>
      </div>

      <!-- Backlog Topics -->
      <div>
        <h3 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Backlog</h3>

        <div v-if="backlogTopics.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No topics in backlog yet
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="topic in backlogTopics"
            :key="topic.id"
            class="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            :class="selectedDraftTopicId === topic.id ? 'border-gray-400 bg-gray-50 dark:border-gray-500 dark:bg-gray-800' : 'border-gray-200 dark:border-gray-700'"
            @click="$emit('select-draft', topic.id)"
          >
            <div class="mb-2 font-medium text-gray-900 dark:text-white">
              {{ topic.title }}
            </div>
            <UButton
              size="xs"
              variant="outline"
              @click.stop="$emit('set-current', topic.id)"
            >
              Discuss
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Topic } from '~/types'

interface Props {
  backlogTopics: Topic[]
  currentTopic?: Topic | null
  selectedDraftTopicId?: string | null
}

interface Emits {
  (e: 'set-current', topicId: string): void
  (e: 'complete-topic', topicId: string): void
  (e: 'select-draft', topicId: string): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>