<template>
  <div class="border-t bg-white p-4">
    <form @submit.prevent="handleSubmit" class="flex space-x-3">
      <UTextarea
        v-model="message"
        :disabled="isLoading"
        placeholder="Type your response..."
        :rows="1"
        autoresize
        class="flex-1"
        @keydown.enter.exact.prevent="handleSubmit"
        @keydown.enter.shift.exact.prevent="message += '\n'"
      />
      <UButton
        type="submit"
        :disabled="!message.trim() || isLoading"
        :loading="isLoading"
        icon="i-heroicons-paper-airplane"
        size="lg"
        color="primary"
      >
        Send
      </UButton>
    </form>
    <div class="text-xs text-gray-500 mt-2">
      Press Enter to send, Shift+Enter for new line
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isLoading?: boolean
}

interface Emits {
  (e: 'send', message: string): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<Emits>()

const message = ref('')

function handleSubmit() {
  if (!message.value.trim() || props.isLoading) return

  emit('send', message.value.trim())
  message.value = ''
}
</script>