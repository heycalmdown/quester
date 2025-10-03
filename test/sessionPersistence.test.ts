import { promises as fs } from 'fs'
import { join } from 'path'
import os from 'os'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { Session } from '~/types'

vi.mock('h3', () => ({
  defineEventHandler: (handler: unknown) => handler,
  createError: (details: any = {}) => ({ ...details })
}))

describe('session persistence latest session handling', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(join(os.tmpdir(), 'quester-test-'))
    vi.resetModules()
    vi.spyOn(process, 'cwd').mockReturnValue(tempDir)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  test('getLatestSession returns null when no sessions exist', async () => {
    const { getLatestSession } = await import('~/server/utils/sessionPersistence')
    await expect(getLatestSession()).resolves.toBeNull()
  })

  test('getLatestSession prioritizes directory timestamp', async () => {
    vi.useFakeTimers()

    const utils = await import('~/server/utils/sessionPersistence')

    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    const first = await utils.createNewSession('First Session')

    vi.setSystemTime(new Date('2024-01-02T00:00:00Z'))
    const second = await utils.createNewSession('Second Session')

    const olderDirNewerMetadata = await utils.readSessionFromFile(first.id)
    olderDirNewerMetadata.updatedAt = new Date('2024-04-01T00:00:00Z')
    await utils.saveSessionToFile(olderDirNewerMetadata.id, olderDirNewerMetadata)

    const latest = await utils.getLatestSession()
    expect(latest?.id).toBe(second.id)
  })

  test('getLatestSession falls back to updatedAt when directory timestamps match', async () => {
    const { saveSessionToFile, getLatestSession } = await import('~/server/utils/sessionPersistence')

    const sharedTimestamp = 1700000000000
    const olderId = `session_${sharedTimestamp}_aaaaaa`
    const newerId = `session_${sharedTimestamp}_bbbbbb`

    const olderSession: Session = {
      id: olderId,
      title: 'Older metadata',
      messages: [],
      topics: [],
      userPreferences: { preferredTerms: [], avoidedTerms: [] },
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z')
    }

    const newerSession: Session = {
      id: newerId,
      title: 'Newer metadata',
      messages: [],
      topics: [],
      userPreferences: { preferredTerms: [], avoidedTerms: [] },
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-03T00:00:00Z')
    }

    await saveSessionToFile(olderSession.id, olderSession)
    await saveSessionToFile(newerSession.id, newerSession)

    const latest = await getLatestSession()
    expect(latest?.id).toBe(newerSession.id)
  })

  test('latest session API returns null when no sessions exist', async () => {
    const { default: handler } = await import('~/server/api/sessions/latest.get')
    await expect(handler({} as any)).resolves.toBeNull()
  })

  test('latest session API returns newest session payload', async () => {
    const { saveSessionToFile } = await import('~/server/utils/sessionPersistence')
    const { default: handler } = await import('~/server/api/sessions/latest.get')

    const olderId = 'session_1700000000000_apiold'
    const newerId = 'session_1800000000000_apinew'

    const olderSession: Session = {
      id: olderId,
      title: 'Older API session',
      messages: [],
      topics: [],
      userPreferences: { preferredTerms: [], avoidedTerms: [] },
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z')
    }

    const newerSession: Session = {
      id: newerId,
      title: 'Newer API session',
      messages: [],
      topics: [],
      userPreferences: { preferredTerms: [], avoidedTerms: [] },
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-03T00:00:00Z')
    }

    await saveSessionToFile(olderSession.id, olderSession)
    await saveSessionToFile(newerSession.id, newerSession)

    const response = await handler({ method: 'GET' } as any)
    expect(response?.id).toBe(newerSession.id)
  })
})
