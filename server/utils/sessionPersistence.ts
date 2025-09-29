import { promises as fs } from 'fs'
import { join } from 'path'
import type { Session, Message, Topic } from '~/types'

const SESSIONS_DIR = join(process.cwd(), 'sessions')

async function ensureSessionsDir() {
  try {
    await fs.access(SESSIONS_DIR)
  } catch {
    await fs.mkdir(SESSIONS_DIR, { recursive: true })
  }
}

export async function createNewSession(title?: string): Promise<Session> {
  await ensureSessionsDir()

  const sessionId = generateSessionId()
  const session: Session = {
    id: sessionId,
    title,
    messages: [],
    topics: [],
    userPreferences: {
      preferredTerms: [],
      avoidedTerms: []
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }

  await saveSessionToFile(sessionId, session)
  return session
}

export async function saveSessionToFile(sessionId: string, session: Session): Promise<void> {
  try {
    await ensureSessionsDir()

    const sessionDir = join(SESSIONS_DIR, sessionId)
    await fs.mkdir(sessionDir, { recursive: true })

    // Save session metadata as JSON
    const metadataPath = join(sessionDir, 'session.json')
    const jsonData = JSON.stringify(session, null, 2)
    await fs.writeFile(metadataPath, jsonData)

    // Save messages as Markdown for human readability
    const messagesPath = join(sessionDir, 'conversation.md')
    const markdownContent = generateConversationMarkdown(session.messages)
    await fs.writeFile(messagesPath, markdownContent)

    // Save topics as structured Markdown
    const topicsPath = join(sessionDir, 'topics.md')
    const topicsContent = generateTopicsMarkdown(session.topics)
    await fs.writeFile(topicsPath, topicsContent)
  } catch (error) {
    console.error('Error in saveSessionToFile:', error)
    console.error('Session ID:', sessionId)
    console.error('Session dir path:', join(SESSIONS_DIR, sessionId))
    throw error
  }
}

export async function readSessionFromFile(sessionId: string): Promise<Session> {
  await ensureSessionsDir()

  const sessionDir = join(SESSIONS_DIR, sessionId)
  const metadataPath = join(sessionDir, 'session.json')

  try {
    const content = await fs.readFile(metadataPath, 'utf-8')
    const session = JSON.parse(content) as Session

    // Convert date strings back to Date objects
    session.createdAt = new Date(session.createdAt)
    session.updatedAt = new Date(session.updatedAt)
    session.messages.forEach(msg => {
      msg.timestamp = new Date(msg.timestamp)
    })

    return session
  } catch (error) {
    throw new Error(`Session ${sessionId} not found`)
  }
}

export async function listSessions(): Promise<{ id: string; title?: string; updatedAt: Date }[]> {
  await ensureSessionsDir()

  try {
    const entries = await fs.readdir(SESSIONS_DIR, { withFileTypes: true })
    const sessionDirs = entries.filter(entry => entry.isDirectory())

    const sessions = await Promise.all(
      sessionDirs.map(async (dir) => {
        try {
          const session = await readSessionFromFile(dir.name)
          return {
            id: session.id,
            title: session.title,
            updatedAt: session.updatedAt
          }
        } catch {
          return null
        }
      })
    )

    return sessions
      .filter(Boolean)
      .sort((a, b) => b!.updatedAt.getTime() - a!.updatedAt.getTime()) as { id: string; title?: string; updatedAt: Date }[]
  } catch {
    return []
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

function generateConversationMarkdown(messages: Message[]): string {
  const header = `# Conversation\n\n`

  const content = messages.map(msg => {
    const role = msg.role === 'user' ? 'User' : 'Quester'
    const timestamp = msg.timestamp.toISOString()
    return `## ${role} (${timestamp})\n\n${msg.content}\n`
  }).join('\n')

  return header + content
}

function generateTopicsMarkdown(topics: Topic[]): string {
  const header = `# Topics\n\n`

  if (topics.length === 0) {
    return header + 'No topics yet.\n'
  }

  const content = topics.map(topic => {
    const status = topic.status.charAt(0).toUpperCase() + topic.status.slice(1)

    let topicContent = `## ${topic.title} (${status})\n\n`

    if (topic.questions.length > 0) {
      topicContent += `### Questions\n\n${topic.questions.map(q => `- ${q}`).join('\n')}\n\n`
    }

    if (topic.notes.length > 0) {
      topicContent += `### Notes\n\n${topic.notes.map(n => `- ${n}`).join('\n')}\n\n`
    }

    return topicContent
  }).join('\n')

  return header + content
}