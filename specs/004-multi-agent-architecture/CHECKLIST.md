# Multi-Agent Architecture Migration Checklist

## User-Facing Functionality Verification
- [ ] **First Message Flow**: Send first message → currentTopic is created and displayed
- [ ] **Topic Transition**: User shifts topic → currentTopic changes, old topic moves to backlog
- [ ] **New Topic Detection**: User mentions side topic → appears in backlog
- [ ] **Language Matching**: User writes in Korean → Response in Korean / User writes in English → Response in English
- [ ] **Session Persistence**: Refresh page → conversation and topics are preserved
- [ ] **Question Quality**: Agent asks one question at a time, summarizes user's answer

## Performance & Compatibility
- [ ] **Response Time**: Total response time < 10 seconds (acceptable for sequential calls)
- [ ] **No Client Changes**: Existing UI components work without modification
- [ ] **Error Handling**: LLM failure shows appropriate error message to user
- [ ] **Session Loading**: Can load and resume previous sessions correctly
