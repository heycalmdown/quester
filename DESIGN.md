# Quester System Design

## 1. Overview

This document describes how Quester implements the requirements defined in PRD.md using a multi-agent architecture.

### Core Challenge

The PRD requires Quester to act as a "seasoned interviewer" that:
- Guides users through divergence-convergence flow
- Detects when to shift topics
- Knows when to stop asking questions
- Produces structured documents as output

A single-prompt LLM cannot achieve this because it's purely reactive. We need a meta-level system that can:
- Monitor conversation depth and quality
- Make proactive decisions about topic switching
- Generate and maintain document drafts continuously
- Trigger convergence at the right moment

### Design Principles

1. **Separation of concerns**: Each agent has a single, clear responsibility
2. **Continuous artifact generation**: Drafts are updated every turn, not at the end
3. **Meta-level control**: Orchestrator makes flow decisions separate from content generation
4. **Context efficiency**: Provide only relevant context to each agent

---

## 2. Agent Architecture

### 2.1 Overview

```
┌────────────────────────────────────────────────┐
│  Orchestrator Agent                            │
│  - Topic detection & classification            │
│  - Flow control (diverge/converge)             │
│  - Topic switching decisions                   │
│  - Session termination judgment                │
└─────────────┬──────────────────────────────────┘
              │
        ┌─────┴──────┬──────────────┐
        │            │              │
┌───────▼──────┐ ┌──▼─────────┐ ┌──▼────────┐
│ Interviewer  │ │ Writer     │ │ Reviewer  │
│ Agent        │ │ Agent      │ │ Agent     │
│              │ │            │ │(Optional) │
│ - Questions  │ │ - Draft    │ │ - Quality │
│ - Summary    │ │   updates  │ │   check   │
└──────────────┘ └────────────┘ └───────────┘
```

### 2.2 Agent Responsibilities

#### Orchestrator Agent

**Purpose**: Meta-level control and decision making

**Responsibilities**:
- Detect topics mentioned in user messages
- Classify current topic vs. new backlog topics
- Decide when to switch topics based on:
  - Conversation depth (number of turns)
  - Draft completeness
  - User signals (e.g., "that's enough", "let's move on")
- Trigger convergence phase when appropriate
- Provide high-level instructions to other agents

**Input**:
- User message
- Session state (messages, topics, drafts)
- Conversation metrics (turns per topic, draft lengths)

**Output**:
```
action: continue_current_topic | switch_to_topic | start_convergence | end_session
topicUpdates:
  - currentTopic
  - newBacklogTopics (array)
reasoning: explanation of decision
instruction:
  - targetAgent: which agent to invoke
  - directive: high-level instruction (e.g., "Ask about benefits of B")
```

#### Interviewer Agent

**Purpose**: Generate questions and summarize answers

**Responsibilities**:
- Ask ONE question at a time
- Summarize user's answers
- Confirm understanding
- Focus questions on filling gaps in current draft

**Input**:
- Current topic context (recent messages related to this topic)
- Current draft state (to identify missing aspects)
- Instruction from Orchestrator
- User preferences (preferred/avoided terms)

**Output**:
```
message: Question or summary for user
```

**Key constraint**: Does NOT make topic detection or flow control decisions

#### Writer Agent

**Purpose**: Transform conversation into structured documents

**Responsibilities**:
- Generate/update draft for current topic
- Structure content into sections
- Maintain consistency across updates
- Identify missing aspects

**Input**:
- All messages related to target topic
- Previous draft version (if exists)
- Update mode: 'incremental' | 'full_revision'

**Output**:
```
draft:
  - sections (array of title + content)
  - completeness: 0-100
  - missingAspects: array of what's still needed
```

**Invocation timing**:
- **Speculative execution**: Immediately after agent sends question to user (while user is thinking/typing)
- Foreground: When user requests to see draft

**Rationale for speculative execution**:
- User thinking/typing time (10-30 seconds) can be utilized for draft generation
- When user's answer arrives, draft is already updated based on conversation so far
- Enables near-instant next response without waiting for draft update
- Architecture supports adding more parallel tasks in future (e.g., next question candidates, scenario prediction)

#### Reviewer Agent (Optional)

**Purpose**: Assess draft quality and completeness

**Responsibilities**:
- Evaluate draft completeness
- Suggest improvements
- Recommend when topic is sufficiently covered

**Input**: Draft document

**Output**: Quality assessment and recommendations

---

## 3. Context Management Strategy

### 3.1 Architecture

Context Builder utilities prepare agent-specific contexts based on Orchestrator decisions

```
Orchestrator Decision
  ↓
"switch_to_topic: B"
  ↓
Context Builder (utility/logic)
  ↓
buildInterviewerContext(sessionState, topicB)
  ↓
Interviewer Agent
```

**Responsibilities**:
- **Orchestrator**: Decides what to do (e.g., "switch to topic B")
- **Context Builder**: Prepares data for target agent based on Orchestrator's decision
- **Agents**: Focus on their core task (question generation, draft writing, etc.)

### 3.2 Agent Context Specifications

Each agent receives context tailored to its responsibility:

#### Orchestrator Context
```
recentMessages: last 10 messages
topicSummaries: for each topic
  - status (completed/active/backlog)
  - draftLength
  - turns count
backlogTopics: array of topic IDs in backlog
```

#### Interviewer Context
```
currentTopicMessages: all messages where current topic was discussed
recentCrossTopicMessages: last 5-10 messages across all topics
relatedTopicsSummary: for each related topic
  - summary of what was discussed
  - relationToCurrentTopic (if applicable)
currentDraft:
  - completeness (0-100)
  - missingAspects (array)
instruction: directive from Orchestrator
```

**Hybrid approach**: Deep context for current topic + recent conversation flow + summarized context for related topics. This balances focus with natural topic transitions.

#### Writer Context
```
topicMessages: all messages for this topic only
relatedTopicDrafts: for each related topic
  - summary
  - keyPoints (array)
previousDraft: existing draft for this topic (if any)
```

### 3.3 Context Builder Utilities

**Purpose**: Centralized logic for preparing agent-specific contexts

```
buildOrchestratorContext(sessionState):
  - extract recent N messages
  - compute topic summaries (status, metrics)
  - filter backlog topics

buildInterviewerContext(sessionState, targetTopic):
  - filter messages by target topic
  - get recent cross-topic messages
  - build related topics summary with relationships
  - attach current draft state
  - include orchestrator instruction

buildWriterContext(sessionState, targetTopic):
  - filter messages for target topic only
  - get related topic drafts for coherence
  - attach previous draft version
```

**Benefits**:
- Single responsibility: each utility focuses on data preparation
- Reusable and testable
- Easy to modify context requirements without touching Orchestrator or Agents
- Avoids duplication across agents

### 3.4 Design Rationale

Context Builders isolate data preparation from decision-making and content generation:
- **Orchestrator** receives high-level summaries for flow control decisions
- **Interviewer** receives focused topic context plus recent flow for natural conversation
- **Writer** receives deep topic-specific context for coherent document generation

---

## 4. Draft Generation Flow

### 4.1 Continuous Update Approach

Instead of generating the final document at the end, drafts are updated continuously:

```
User message → Orchestrator → Interviewer → User sees question
                                                      ↓
                                          [User thinking/typing]
                                                      ↓
                                            Writer (parallel)
                                                      ↓
                                              Draft updated
                                                      ↓
                              User answer arrives → Next turn (draft already ready)
```

**Key optimization**: Writer runs speculatively while user is composing their response, utilizing the 10-30 second wait time. This enables immediate next-turn processing without draft generation delays.

### 4.2 Why Continuous Updates?

1. **User can check progress anytime**: "Show me what we have so far"
2. **Interviewer asks better questions**: Knows what's missing in draft
3. **Natural convergence**: Draft completeness signals when to move on
4. **Supports PRD goal**: Divergence-convergence becomes tangible

### 4.3 Draft Lifecycle

```
Topic created
  ↓
First message about topic
  ↓
Writer creates initial draft (v1)
  ↓
More conversation
  ↓
Writer updates draft (v2, v3, ...)
  ↓
Orchestrator sees: completeness > 70%, turns > 5
  ↓
Suggests topic switch or convergence
  ↓
Draft marked as complete
```

### 4.4 Storage

- Location: `sessions/{sessionId}/drafts/{topicId}.md`
- Format: Markdown with metadata
- Versioning: Overwrite (no version history in MVP)

---

## 5. Divergence-Convergence Implementation

### 5.1 Divergence Phase

**Goal**: Explore ideas, accumulate topics in backlog

**Orchestrator behavior**:
- Allow new topics to be added to backlog
- Don't force premature convergence
- Encourage breadth

**Trigger**: Early in session, user mentions multiple topics

**Interviewer behavior**:
- Ask exploratory questions
- "What else comes to mind?"
- Acknowledge new topics: "We can talk about that later"

### 5.2 Convergence Phase

**Goal**: Narrow down, finalize drafts, complete topics

**Orchestrator triggers convergence when**:
- Draft completeness > 70% AND turns > 5
- Backlog empty OR user shows fatigue
- User explicitly requests: "Let's wrap up"

**Orchestrator behavior**:
- Ask: "Topic A seems well covered. Shall we summarize and move on?"
- Shift from exploration to finalization
- Invoke Writer with 'full_revision' mode

**Interviewer behavior**:
- Ask closing questions: "Anything else important about A?"
- Summarize key points
- Confirm completeness with user

### 5.3 State Transitions

```
Session Start
  ↓
DIVERGENCE: accumulate topics
  ↓
(multiple topics in backlog, low completeness)
  ↓
DEEP_DIVE: focus on one topic
  ↓
(high completeness on current topic)
  ↓
CONVERGENCE: finalize current topic
  ↓
Switch to next topic OR
  ↓
END_SESSION
```

---

## 6. Topic Management

### 6.1 Topic Lifecycle

```
mentioned → backlog → active → completed
```

- **mentioned**: Detected but not yet in formal backlog
- **backlog**: Queued for future discussion
- **active**: Currently being discussed
- **completed**: Draft finalized, no longer active

### 6.2 Topic Detection (Orchestrator)

Orchestrator analyzes user message and determines:
- Is this continuing current topic?
- Is this a new topic?
- Is user requesting to switch to backlog topic?

### 6.3 Topic Switching Logic

Orchestrator decides to switch when:

**User-driven**:
- Explicit: "Let's talk about B now"
- Implicit: "I think that's enough about A"

**System-driven**:
- Current topic completeness > threshold
- Conversation depth > threshold without progress
- Backlog topic has higher priority

### 6.4 Context Reconstruction on Switch

When switching from A to B:
1. Save A's current state (mark as completed or backlog)
2. Load B's context (previous messages about B, if any)
3. Build hybrid context (see Section 3.2)
4. Interviewer receives instruction: "Resume topic B, previously mentioned in context of..."

---

## 7. Handling the "Endless Questions" Problem

### 7.1 Problem

Single-prompt LLMs keep asking questions indefinitely because:
- They're reactive: if user answers, they ask more
- No meta-awareness of "enough is enough"
- No goal-oriented stopping criteria

### 7.2 Solution

**Orchestrator monitors**:
- Conversation depth per topic
- Draft completeness
- Diminishing returns (new info per turn decreasing)

**Orchestrator intervenes**:
```
After 5 turns on topic A with 80% draft completeness:

Orchestrator → Interviewer instruction:
"Prepare to close topic A. Ask one final question:
'Anything else important about A we should capture?'"

User: "No, that's it"

Orchestrator → action: 'switch_to_topic' (B) or 'start_convergence'
```

**Interviewer never decides this** — only Orchestrator has the meta-view to judge.

---

## 8. Alignment with PRD

| PRD Requirement | Design Solution |
|-----------------|-----------------|
| Ask one question at a time | Interviewer Agent responsibility |
| Detect topic shifts | Orchestrator topic detection |
| Topic Backlog management | Orchestrator maintains backlog state |
| Reorder priorities | Orchestrator switches based on criteria |
| Framing: summarize direction | Orchestrator triggers convergence prompts |
| Divergence-convergence flow | Phase transitions in Section 5 |
| Structured outputs | Writer Agent continuous drafts |
| Preserve key terms | Interviewer context includes preferences |

---

## References

- [PRD.md](./PRD.md): Product requirements
- [ARCHITECTURE.md](./ARCHITECTURE.md): Technical stack and constraints
