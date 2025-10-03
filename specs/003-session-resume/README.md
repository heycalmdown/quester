# Session Resume on Reload Specification

## Context

Quester persists single-user conversation sessions in the local filesystem (`sessions/session_<timestamp>_<suffix>/`). Each session stores full message history, topic backlog, and timestamps, both inside `session.json` and encoded in the directory name. Currently, reconnecting or refreshing the app does not automatically restore the latest session, forcing users to restart the interview even when valid session data exists. Maintaining continuity directly supports the PRD goals of preserving context, tracking topics, and delivering coherent outputs.

## Problem

When the client reloads or a user returns later, the UI initializes a brand-new session instead of resurfacing the most recent one. As a result:
- Conversation history and topic backlog appear empty despite existing persisted data.
- Users cannot seamlessly continue an interview after an accidental refresh.
- Divergence/convergence flow is broken because the system loses the active topic context.

## Goal

Implement seamless session resumption so that:
1. The application detects previously persisted sessions on startup.
2. The newest session (by directory timestamp, falling back to `updatedAt` when needed) loads automatically, including messages, topics, and preferences.
3. Users can explicitly start a fresh session when needed without deleting previous history.
4. Session metadata stays up-to-date so the "latest" session reflects real activity.

## Non-Goals

- Multi-device or multi-user synchronization.
- Advanced session management UI (e.g., archives, tagging, bulk delete).
- Cross-session topic merging or analytics.
- Solving stale data caused by manual filesystem edits.

## Constraints

- **Tech Stack**: Nuxt 3, Vue 3, Pinia, TypeScript, Tailwind.
- **Persistence**: File-based storage only; no database.
- **Backend Responsibility**: Session lookup logic runs server-side; the client must not read the filesystem directly.
- **Performance**: Session detection must feel instantaneous (<200ms for typical session counts).
- **Reliability**: Missing or corrupt session data must fail gracefully without crashing the app.

## Success Criteria

1. Refreshing the browser while mid-conversation restores the same messages, topics, and state.
2. Launching the app after closing the tab resumes the most recently updated session.
3. Starting a new session explicitly clears the UI while leaving old sessions intact.
4. If no sessions exist, the app starts with a clean slate and does not error.
5. Automated tests cover at least one resume success path and one missing-session path.

## Approach Evaluation

- **Option A – Directory scan on demand**: Pros: no new files, the timestamped directory names make selection cheap; Cons: O(n) directory read each startup; Risks: slower if hundreds of sessions accumulate.  
- **Option B – Maintain `sessions/index.json`**: Pros: constant-time latest lookup, easy previews; Cons: extra write on each session mutation; Risks: index drift if writes fail or crash mid-update.

**Decision**: Adopt Option A initially for simplicity and lower maintenance overhead. Revisit an index file only if session volume causes noticeable latency.

## Implementation Approach

1. **Backend session service**: Add a utility to list session directories and derive recency primarily from the directory timestamp (use `session.json.updatedAt` only when timestamps tie). Make resilience choices (ignore malformed entries, log warnings).
2. **API surface**: Create an endpoint (e.g., `GET /api/sessions/latest`) that returns the full latest session payload or `null` if none exist.
3. **Client boot flow**: On application mount or store initialization, request the latest session. If found, hydrate the Pinia store with messages, topics, backlog, and preferences. Show a loading indicator while fetching.
4. **Session lifecycle updates**: Ensure `updatedAt` (and `topics`, backlog summaries) update on every message send/save in case additional metadata is needed beyond the directory timestamp.
5. **New session affordance**: Provide a clear action to start a clean session (`POST /api/sessions`), resetting client state while leaving existing sessions untouched.

## File Structure Touchpoints

```
sessions/
└── [sessionId]/
    ├── session.json         # must include current `updatedAt`, messages, topics, preferences
    ├── conversation.md
    └── topics.md
server/
└── utils/sessions.ts       # (new or extended) directory scanning helper
└── api/sessions/latest.get.ts
stores/
└── sessionStore.ts         # hydrate from latest session on setup
```

## Integration Points

1. **Session persistence**: Reuse existing file-based helpers for read/write; harden against malformed JSON.
2. **Conversation flow**: Hydrated store should trigger chat UI render without requiring manual refresh.
3. **Topic backlog**: Ensure resumed sessions repopulate backlog panels and topic state machines.
4. **Error handling**: If resume fails, fall back to creating a new session and surface a non-intrusive toast/log.
5. **Telemetry/logging**: (future) capture resume success/failure for diagnostics.

## Validation Criteria

1. Manual test: Start a conversation, reload, and verify continuity (messages, topics, preferences).
2. Manual test: Delete all sessions, reload, confirm a new session starts without errors.
3. Automated test: Session service returns newest session given multiple directories.
4. Automated test: API endpoint returns `null` when no sessions exist and handles corrupt session gracefully.
5. UI test: Store hydration renders previous messages immediately after resume.
