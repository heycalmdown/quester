# Multi-Agent Architecture Migration Checklist

## User-Facing Functionality Verification

- [x] **First Message Flow**: Send first message → currentTopic is created and displayed
- [x] **Topic Transition**: User shifts topic → currentTopic changes, old topic moves to backlog
- [x] **New Topic Detection**: User mentions side topic → appears in backlog
- [x] **Language Matching**: User writes in Korean → Response in Korean / User writes in English → Response in English
- [x] **Session Persistence**: Refresh page → conversation and topics are preserved
- [x] **Question Quality**: Agent asks one question at a time, summarizes user's answer

## Performance & Compatibility

- [x] **Response Time**: Total response time < 10 seconds (acceptable for sequential calls)
- [x] **No Client Changes**: Existing UI components work without modification
- [x] **Error Handling**: LLM failure shows appropriate error message to user
- [x] **Session Loading**: Can load and resume previous sessions correctly
