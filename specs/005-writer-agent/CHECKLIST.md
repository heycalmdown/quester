# Spec 005: Writer Agent - Verification Checklist

## Core Functionality

- [ ] Start a new session and have a conversation about a topic
- [ ] Verify draft file exists at `sessions/{sessionId}/drafts/{topicId}.md`
- [ ] Draft file contains valid frontmatter (topicId, topicTitle, completeness, missingAspects, updatedAt)
- [ ] Draft file contains structured Markdown content

## Continuous Updates

- [ ] Send first message about topic → draft generated automatically
- [ ] Send follow-up message about same topic → draft updated with new information
- [ ] Draft content reflects information from multiple conversation turns

## Multiple Topics

- [ ] Discuss topic A, then switch to topic B → two separate draft files created
- [ ] Each draft file contains topic-specific content only

## Session Persistence

- [ ] Create session with conversation and draft → restart server → draft files still exist
- [ ] Resume session → draft content unchanged after restart

## Performance

- [ ] Chat response time remains under 5 seconds (draft runs in background)
- [ ] Draft generation completes within 15 seconds
- [ ] System remains responsive with 5+ topics and drafts

## Error Handling

- [ ] Corrupt draft file frontmatter → system continues without crashing
- [ ] Delete drafts directory during session → system recreates on next save
