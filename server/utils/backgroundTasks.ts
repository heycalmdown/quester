import type { BackgroundTask } from '~/types'

// Simple in-memory task tracker
const tasks = new Map<string, BackgroundTask>()

function generateTaskId(sessionId: string, topicId: string): string {
  return `${sessionId}:${topicId}`
}

export function startTask(
  sessionId: string,
  topicId: string,
  taskType: BackgroundTask['taskType']
): BackgroundTask {
  const taskId = generateTaskId(sessionId, topicId)
  const task: BackgroundTask = {
    sessionId,
    taskType,
    topicId,
    status: 'running',
    startedAt: new Date().toISOString()
  }

  tasks.set(taskId, task)
  return task
}

export function completeTask(
  sessionId: string,
  topicId: string
): void {
  const taskId = generateTaskId(sessionId, topicId)
  const task = tasks.get(taskId)

  if (task) {
    task.status = 'completed'
    task.completedAt = new Date().toISOString()
  }
}

export function failTask(
  sessionId: string,
  topicId: string,
  error: string
): void {
  const taskId = generateTaskId(sessionId, topicId)
  const task = tasks.get(taskId)

  if (task) {
    task.status = 'failed'
    task.completedAt = new Date().toISOString()
    task.error = error
  }
}

export function getTask(
  sessionId: string,
  topicId: string
): BackgroundTask | undefined {
  const taskId = generateTaskId(sessionId, topicId)
  return tasks.get(taskId)
}

export function cleanupTask(
  sessionId: string,
  topicId: string
): void {
  const taskId = generateTaskId(sessionId, topicId)
  tasks.delete(taskId)
}

export async function runInBackground<T>(
  fn: () => Promise<T>,
  onError?: (error: Error) => void
): Promise<void> {
  // Fire and forget - don't block caller
  fn().catch((error) => {
    console.error('Background task error:', error)
    if (onError) {
      onError(error)
    }
  })
}
