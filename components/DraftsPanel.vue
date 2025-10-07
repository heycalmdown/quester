<template>
  <div class="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
        Draft Viewer
      </h2>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Empty State: No topic selected -->
      <div v-if="!selectedDraftTopicId" class="flex h-full items-center justify-center">
        <div class="text-center">
          <div class="mb-2 text-4xl">📄</div>
          <p class="text-gray-600 dark:text-gray-400">
            Select a topic to view its draft
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="isDraftLoading" class="flex h-full items-center justify-center">
        <div class="text-center">
          <UIcon name="i-heroicons-arrow-path" class="mb-2 h-8 w-8 animate-spin text-gray-400" />
          <p class="text-gray-600 dark:text-gray-400">
            Loading draft...
          </p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="draftError" class="flex h-full items-center justify-center">
        <div class="text-center">
          <div class="mb-2 text-4xl">⚠️</div>
          <p class="mb-4 text-red-600 dark:text-red-400">
            {{ draftError }}
          </p>
          <UButton @click="retryFetch" color="gray" variant="outline">
            Retry
          </UButton>
        </div>
      </div>

      <!-- Empty State: Draft not yet generated -->
      <div v-else-if="!currentDraft" class="flex h-full items-center justify-center">
        <div class="text-center">
          <div class="mb-2 text-4xl">⏳</div>
          <p class="text-gray-600 dark:text-gray-400">
            Draft is being generated. Check back soon!
          </p>
        </div>
      </div>

      <!-- Draft Content -->
      <div v-else class="space-y-4">
        <!-- Draft Header -->
        <div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            {{ currentDraft.topicTitle }}
          </h3>

          <!-- Completeness Progress -->
          <div class="mb-2">
            <div class="mb-1 flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Completeness</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ currentDraft.completeness }}%
              </span>
            </div>
            <UProgress :value="currentDraft.completeness" :max="100" color="primary" />
          </div>

          <!-- Last Updated -->
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {{ formatTimestamp(currentDraft.updatedAt) }}
          </p>
        </div>

        <!-- Draft Content (Markdown Rendered) -->
        <div class="prose prose-sm max-w-none rounded-lg bg-white p-6 shadow dark:prose-invert dark:bg-gray-800" v-html="renderedContent" />

        <!-- Missing Aspects -->
        <div v-if="currentDraft.missingAspects && currentDraft.missingAspects.length > 0" class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <details class="cursor-pointer">
            <summary class="text-sm font-medium text-gray-900 dark:text-white">
              Missing Aspects ({{ currentDraft.missingAspects.length }})
            </summary>
            <ul class="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li v-for="(aspect, index) in currentDraft.missingAspects" :key="index">
                {{ aspect }}
              </li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { marked } from 'marked'
import { useSessionStore } from '~/stores/session'

const sessionStore = useSessionStore()
const { currentDraft, selectedDraftTopicId, isDraftLoading, draftError } = storeToRefs(sessionStore)

const renderedContent = computed(() => {
  if (!currentDraft.value || !currentDraft.value.sections) return ''

  const sections = currentDraft.value.sections
    .map(s => `## ${s.title}\n\n${s.content}`)
    .join('\n\n')

  return marked.parse(sections)
})

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

const retryFetch = () => {
  if (selectedDraftTopicId.value) {
    sessionStore.fetchDraftByTopicId(selectedDraftTopicId.value)
  }
}
</script>

<style scoped>
/* Ensure prose styles work well with dark mode */
.prose {
  @apply text-gray-900;
}

.dark .prose {
  @apply text-gray-100;
}
</style>
