# Product Requirements Document

## Product: **Quester**

**One-line Definition:**  
A conversational writing agent that acts like a seasoned interviewer, guiding users through questions to clarify, confirm, and structure their thoughts into a finished piece of writing.

---

## 1. Background

Many people want to write but struggle to start or structure their ideas. Existing AI tools often lose the user’s voice or flatten the dialogue. Quester approaches writing as an interview: asking questions, clarifying answers, and shaping them into coherent output using a **divergence–convergence flow**.

---

## 2. Problem Statement

- Users get blocked due to lack of structure.
- AI outputs ignore users’ key terms and intentions.
- Asking too many questions at once overwhelms users.
- Context is lost when conversations drift.
- Exploring every branch creates fatigue and excessive length.

---

## 3. Goals

1. Summarize messy answers and confirm with follow-up questions.
2. Preserve important terms, exclude disliked ones.
3. Ask one question at a time to avoid overwhelm.
4. Track context: detect topic shifts, mark them, and return.
5. Maintain a **Topic Backlog**: store side-topics for later.
6. Reorder Backlog priorities as conversation flow becomes clear.
7. Provide **Framing**: summarize direction mid-interview and confirm with the user.
8. Deliver structured outputs: outline, blog article, or exploration notes.

---

## 4. Personas

- **Blogger / Aspiring writer** – has ideas but struggles to structure.
- **Knowledge worker / Researcher** – wants to organize thoughts into notes or articles.
- **Marketer / Planner** – needs to extract content ideas quickly through dialogue.

---

## 5. Key Features

- **Question design**: one question at a time, professional interviewer tone.
- **Summarize & confirm loop**: rephrase → confirm → refine.
- **Language rules**: preserve key terms, avoid rejected terms.
- **Context tracking**: detect shifts, mark them, return later.
- **Topic Backlog**: capture side-topics, revisit after current one ends.
- **Priority adjustment**: drop irrelevant topics lower in the backlog.
- **Divergence–convergence**: broaden ideas, then narrow to key themes.
- **Outputs**: structured outline, draft article, or notes.

---

## 6. User Journey

1. User starts conversation (with or without a topic).
2. Quester asks one question, summarizes answer, confirms.
3. New topics go to Backlog.
4. Quester occasionally reframes direction:
   - “So this is mainly about (X), right?”
5. If user agrees, reorder Backlog accordingly.
6. If not, continue and reframe later.
7. After divergence, move to convergence: summarize and close topics.
8. Provide final outline and finished draft.

---

## 7. Success Metrics

- Engagement: avg. number of dialogue turns per session.
- Completeness: user feedback on final output usability.
- Retention: repeat usage rate.
- Satisfaction: perceived “interviewer experience” score.

---

## 8. Technical Requirements

- LLM-based dialogue with context memory.
- Backlog management + priority adjustment.
- Divergence/convergence flow control.
- User-specific word filter (preserve/avoid).
- Summarization + framing logic.

---

## 9. Out of Scope

- Automatic blog publishing (API integrations).
- Perfect replication of user’s tone/style (focus only on term preservation).
- Multimodal inputs (image/audio) at launch.

---

## 10. Future Scope

- Blog/notes integration.
- Voice-based interview mode.
- Multimodal input (images → text).
- Team interview collaboration.
