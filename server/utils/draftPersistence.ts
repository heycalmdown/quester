import { promises as fs } from 'fs'
import { join } from 'path'
import type { Draft, DraftMetadata } from '~/types'

const SESSIONS_DIR = join(process.cwd(), 'sessions')

async function ensureDraftsDir(sessionId: string): Promise<string> {
  const draftsDir = join(SESSIONS_DIR, sessionId, 'drafts')
  try {
    await fs.access(draftsDir)
  } catch {
    await fs.mkdir(draftsDir, { recursive: true })
  }
  return draftsDir
}

function draftToMarkdown(draft: Draft): string {
  const frontmatter = `---
topicId: "${draft.topicId}"
topicTitle: "${draft.topicTitle}"
completeness: ${draft.completeness}
missingAspects:
${draft.missingAspects.map(aspect => `  - "${aspect}"`).join('\n')}
updatedAt: "${draft.updatedAt}"
---

`

  const content = draft.sections.map(section => {
    return `## ${section.title}\n\n${section.content}\n`
  }).join('\n')

  return frontmatter + content
}

function markdownToDraft(markdown: string): Draft {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  const match = markdown.match(frontmatterRegex)

  if (!match) {
    throw new Error('Invalid draft format: missing frontmatter')
  }

  const [, frontmatterStr, contentStr] = match

  // Parse frontmatter
  const topicIdMatch = frontmatterStr.match(/topicId:\s*"([^"]+)"/)
  const topicTitleMatch = frontmatterStr.match(/topicTitle:\s*"([^"]+)"/)
  const completenessMatch = frontmatterStr.match(/completeness:\s*(\d+)/)
  const updatedAtMatch = frontmatterStr.match(/updatedAt:\s*"([^"]+)"/)

  const missingAspectsMatch = frontmatterStr.match(/missingAspects:\s*\n((?:\s+-\s+"[^"]+"\n?)+)/)
  const missingAspects: string[] = []
  if (missingAspectsMatch) {
    const aspectLines = missingAspectsMatch[1].match(/"([^"]+)"/g)
    if (aspectLines) {
      missingAspects.push(...aspectLines.map(line => line.replace(/"/g, '')))
    }
  }

  if (!topicIdMatch || !topicTitleMatch || !completenessMatch || !updatedAtMatch) {
    throw new Error('Invalid draft format: missing required frontmatter fields')
  }

  // Parse sections
  const sections: Draft['sections'] = []
  const sectionRegex = /^##\s+(.+?)\n\n([\s\S]*?)(?=\n##\s|$)/gm
  let sectionMatch

  while ((sectionMatch = sectionRegex.exec(contentStr)) !== null) {
    sections.push({
      title: sectionMatch[1].trim(),
      content: sectionMatch[2].trim()
    })
  }

  return {
    topicId: topicIdMatch[1],
    topicTitle: topicTitleMatch[1],
    completeness: parseInt(completenessMatch[1], 10),
    missingAspects,
    updatedAt: updatedAtMatch[1],
    sections
  }
}

export async function saveDraft(
  sessionId: string,
  draft: Draft
): Promise<void> {
  try {
    const draftsDir = await ensureDraftsDir(sessionId)
    const draftPath = join(draftsDir, `${draft.topicId}.md`)
    const markdown = draftToMarkdown(draft)
    await fs.writeFile(draftPath, markdown, 'utf-8')
  } catch (error) {
    console.error('Error saving draft:', error)
    throw error
  }
}

export async function loadDraft(
  sessionId: string,
  topicId: string
): Promise<Draft | null> {
  try {
    const draftsDir = await ensureDraftsDir(sessionId)
    const draftPath = join(draftsDir, `${topicId}.md`)
    const markdown = await fs.readFile(draftPath, 'utf-8')
    return markdownToDraft(markdown)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    console.error('Error loading draft:', error)
    throw error
  }
}

export async function listDrafts(
  sessionId: string
): Promise<DraftMetadata[]> {
  try {
    const draftsDir = await ensureDraftsDir(sessionId)
    const entries = await fs.readdir(draftsDir)
    const mdFiles = entries.filter(file => file.endsWith('.md'))

    const metadata = await Promise.all(
      mdFiles.map(async (file) => {
        const topicId = file.replace('.md', '')
        try {
          const draft = await loadDraft(sessionId, topicId)
          if (!draft) return null

          return {
            topicId: draft.topicId,
            topicTitle: draft.topicTitle,
            completeness: draft.completeness,
            updatedAt: draft.updatedAt
          }
        } catch (error) {
          console.warn(`Failed to load draft metadata for ${topicId}:`, error)
          return null
        }
      })
    )

    return metadata.filter((m): m is DraftMetadata => m !== null)
  } catch (error) {
    console.error('Error listing drafts:', error)
    return []
  }
}

export async function deleteDraft(
  sessionId: string,
  topicId: string
): Promise<void> {
  try {
    const draftsDir = await ensureDraftsDir(sessionId)
    const draftPath = join(draftsDir, `${topicId}.md`)
    await fs.unlink(draftPath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Error deleting draft:', error)
      throw error
    }
  }
}
