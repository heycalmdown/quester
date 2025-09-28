# Topic Detection and Storage Specification

## Context

This specification defines the implementation of topic detection and storage functionality for the Quester conversational writing agent. This feature enables the system to track conversation topics, manage a backlog of side topics, and support the divergence-convergence flow outlined in the PRD.

## Problem

During conversations, users naturally introduce new topics or tangential ideas that need to be captured and revisited later. Without proper topic management:

- Side topics are lost when conversation shifts
- Context gets fragmented across multiple discussion threads
- Users feel overwhelmed when exploring every branch immediately
- Important themes get buried in lengthy conversations

## Goal

Implement a comprehensive topic detection and storage system that includes:

1. **Topic Detection Engine**
   - Analyze user responses to identify new topics
   - Distinguish between main topic continuation and side topic introduction
   - Track topic shifts and conversation flow changes

2. **Topic Backlog Management**
   - Store discovered side topics for later exploration
   - Maintain topic context and relevance information

3. **Context Tracking System**
   - Mark topic shifts and conversation direction changes
   - Maintain conversation context across topic switches
   - Enable smooth returns to previous topics

4. **Divergence-Convergence Support**
   - Track exploration phase vs. synthesis phase
   - Support broadening ideas during divergence
   - Enable focusing on key themes during convergence

## Non-Goals

- Real-time topic analysis during typing (batch analysis only)
- Automatic topic merging or deduplication
- Advanced NLP topic modeling beyond LLM capabilities
- Multi-session topic persistence (scope limited to single sessions)

## Constraints

- **Tech Stack**: TypeScript, Nuxt 3, Vue 3, Pinia, file-based storage
- **LLM Backend Only**: Topic analysis must run on server-side API routes
- **File-based Persistence**: Topics stored in session JSON files
- **Single-user Design**: No concurrent topic management needed
- **Performance**: Topic detection should not significantly impact response time

## Success Criteria

1. System can detect when new topics are introduced in user responses
2. Side topics are automatically added to session backlog
3. Users can explicitly navigate to backlog topics
4. Context is preserved when switching between topics
5. Topic detection integrates seamlessly with existing conversation flow
6. All topic data persists with session files

## Implementation Approach

1. **Phase 1**: Core topic detection logic using LLM analysis
2. **Phase 2**: Topic storage and backlog management
3. **Phase 3**: Context tracking and topic switching
4. **Phase 4**: Integration with conversation flow UI

## File Structure Extensions

```
sessions/
└── [sessionId]/
    ├── conversation.md          # Existing conversation log
    ├── session.json            # Existing session state
    └── topics.md               # Enhanced: topic backlog and context
```

## Integration Points

1. **Message Processing**: Topic detection runs after each user message
2. **Session Management**: Topic data saves with session persistence
3. **Conversation Flow**: Topic switching integrates with Q&A cycles
4. **LLM Prompting**: Topic context informs question generation
5. **UI Components**: Backlog panel integrates with conversation interface

## Validation Criteria

1. **Accuracy**: Topic detection correctly identifies 90%+ of new topic introductions
2. **Performance**: Topic analysis completes within 500ms
3. **Persistence**: Topic data survives session reloads and restarts
4. **Usability**: Users can easily navigate and manage topic backlog
5. **Context Preservation**: Switching topics maintains conversation coherence