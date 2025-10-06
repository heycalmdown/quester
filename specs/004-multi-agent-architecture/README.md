# Spec 004: Multi-Agent Architecture Migration

## Context

Currently, Quester uses a single LLM call to handle all tasks (topic detection + question generation). This differs from the multi-agent architecture defined in DESIGN.md. All responsibilities are concentrated in a single prompt, making independent improvement of each function difficult and limiting future extensibility.

## Problem

- Current: One LLM call handles both topic detection and question generation simultaneously
- Result: Difficult to improve quality of each function and test independently
- Limitation: Complexity increases dramatically when adding new agents like Writer/Reviewer

## Goal

Migrate to multi-agent structure **while maintaining only currently working features**:
1. Orchestrator Agent: Topic detection and classification
2. Interviewer Agent: Question generation
3. Preserve 100% of existing functionality (response format, topic management, user experience)

## Non-Goals

- Writer Agent implementation (no draft generation feature)
- Reviewer Agent implementation (optional)
- Adding new features
- UI/UX changes

## Constraints

- Tech stack: TypeScript, Nuxt 3, OpenAI Responses API
- Maintain backend-only LLM calls
- Maintain file-based persistence
- Maintain compatibility with existing Session/Topic data structures

---

## Implementation Plan

### 1. Agent Separation Structure

#### 1.1 Orchestrator Agent
**Responsibility**: Topic detection & classification
- **Input**: Full conversation history + existing topics context
- **Output**:
  ```typescript
  {
    currentTopic: string,
    newTopics: string[]
  }
  ```
- **Prompt**: Clear instructions focused on topic detection
- **Location**: `server/agents/orchestrator.ts`

#### 1.2 Interviewer Agent
**Responsibility**: Question generation
- **Input**:
  - Full conversation history
  - Orchestrator's topic detection results
  - User preferences (preferredTerms, avoidedTerms)
  - Current topic context
- **Output**:
  ```typescript
  {
    message: string  // Question/response in user's language
  }
  ```
- **Prompt**: Focused on interviewer role (one question at a time, summarize & confirm)
- **Location**: `server/agents/interviewer.ts`

### 2. Execution Flow

```
User Message
    ↓
[1] Orchestrator Agent execution
    → Generate topic detection results
    ↓
[2] Interviewer Agent execution
    → Generate question based on Orchestrator results + context
    ↓
Response to User
```

### 3. File Structure Changes

#### Files to create:
```
server/
  agents/
    orchestrator.ts      # Topic detection agent
    interviewer.ts       # Question generation agent
    types.ts            # Agent-specific types
  utils/
    agentRunner.ts      # Agent execution utility (optional)
```

#### Files to modify:
- `server/api/chat.post.ts`: Change to multi-agent orchestration logic
- `types/index.ts`: Add agent-related types (if needed)

#### Functions to remove:
- `buildSystemPrompt()` → Split into separate prompts for Orchestrator/Interviewer
- `parseStructuredResponse()` → Split into response parsers for each Agent

### 4. Maintain API Response Format

**Final response format (unchanged)**:
```typescript
{
  message: string,
  topicUpdates?: {
    currentTopic?: { title: string },
    newTopics?: Partial<Topic>[]
  }
}
```

This ensures 100% compatibility with existing client code (`stores/session.ts`).

### 5. Error Handling

- Independent error handling for each Agent execution
- Orchestrator failure: Run Interviewer only without topic updates (fallback)
- Interviewer failure: Entire request fails (same as current)
- Timeout: Independent timeout per Agent (maintain existing 15s)

### 6. Testing Strategy

#### Unit Tests:
- Orchestrator Agent: Verify topic detection logic
- Interviewer Agent: Verify question generation logic

#### Integration Tests:
- Verify 100% pass rate for existing scenarios:
  - First message → currentTopic creation
  - Topic transition → currentTopic change + existing topic moves to backlog
  - New topic mention → Add to newTopics
  - User language matching verification

### 7. Migration Verification

**Before/After Comparison**:
- [ ] Same input → Same topic detection results
- [ ] Same input → Same question generation quality
- [ ] Session persistence works correctly
- [ ] Response time comparison (minimize performance degradation)

---

## Detailed Implementation Steps

### Step 1: Implement Orchestrator Agent
1. Create `server/agents/types.ts`: Define Agent input/output types
2. Create `server/agents/orchestrator.ts`:
   - Write topic detection-focused prompt
   - Call OpenAI Responses API (structured output)
   - Parse and validate response

### Step 2: Implement Interviewer Agent
1. Create `server/agents/interviewer.ts`:
   - Write question generation-focused prompt
   - Use Orchestrator results as context
   - Reflect user preferences
   - Ensure multilingual responses

### Step 3: Refactor chat.post.ts
1. Remove existing single LLM call
2. Sequential execution:
   - Execute Orchestrator → Save results
   - Execute Interviewer (pass Orchestrator results)
3. Combine responses (maintain existing format)
4. Add error handling

### Step 4: Test and Verify
1. Regression test existing functionality
2. Verify topic detection accuracy
3. Verify question quality
4. Measure response time

---

## Success Criteria

- [ ] All existing features work identically
- [ ] Topic detection separated into dedicated Agent
- [ ] Question generation separated into dedicated Agent
- [ ] No client code changes required
- [ ] Response time increase < 30% (unavoidable due to sequential calls)
- [ ] Test coverage maintained or improved

---

## Risks & Mitigation

### Risk 1: Increased Response Time
- **Cause**: 2 LLM calls (sequential)
- **Mitigation**:
  - Optimize max_output_tokens for each Agent
  - Reduce processing time through concise prompts
  - Consider parallel execution in future (maintain sequential for now)

### Risk 2: Topic Detection Quality Degradation
- **Cause**: Potential information loss due to context separation
- **Mitigation**:
  - Pass sufficient conversation history to Orchestrator
  - Migrate existing prompt's topic detection logic as-is

### Risk 3: Interviewer Response Quality Degradation
- **Cause**: Topic context separation
- **Mitigation**:
  - Clearly pass Orchestrator results to Interviewer
  - Migrate existing prompt's interviewer logic as-is

---

## Assumptions

1. OpenAI Responses API is fast enough (each call < 5s)
2. Topic detection and question generation can be performed independently
3. Latency from sequential execution is not critical to user experience (< 10s total response time)

---

## Future Enhancements (Out of Scope)

- Add Writer Agent (draft generation)
- Add Reviewer Agent (quality check)
- Parallel agent execution
- Agent result caching
- Fine-tuned models per agent
