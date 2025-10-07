# Spec 006: Draft UI with Three-Panel Layout - Verification Checklist

## UI Structure

- [ ] Three panels visible simultaneously: Chat (left), Topics (middle), Drafts (right)
- [ ] Panel widths are proportional: Chat 40%, Topics 20%, Drafts 40%
- [ ] All panels are visible when session is active
- [ ] Layout is responsive (hides Drafts panel on tablet/mobile)

## Chat Panel

- [ ] Chat panel shows conversation messages
- [ ] Chat input field is functional
- [ ] Sending messages works as before (no regression)
- [ ] Session title and created date are displayed

## Topics Panel

- [ ] Topics panel shows list of backlog topics
- [ ] Current topic is highlighted differently
- [ ] "Discuss" button switches topic context
- [ ] "Mark Complete" button updates topic status
- [ ] Empty state message appears when no topics exist
- [ ] Clicking a topic loads its draft in the Drafts panel
- [ ] Selected topic for draft viewing is visually indicated

## Drafts Panel

- [ ] Drafts panel shows empty state when no topic is selected ("Select a topic to view its draft")
- [ ] Clicking a topic in Topics panel loads its draft in Drafts panel
- [ ] Draft content appears in the Drafts panel
- [ ] "Draft is being generated" message appears if selected topic has no draft yet

## Draft Display

- [ ] Draft content renders Markdown as formatted HTML
- [ ] Headings, lists, and paragraphs are styled correctly
- [ ] Topic title appears at the top of the draft viewer
- [ ] Completeness percentage is displayed (e.g., "75%")
- [ ] Last updated timestamp is shown
- [ ] Missing aspects section appears when there are missing aspects
- [ ] Missing aspects are displayed as a bulleted list

## Data Fetching

- [ ] Selecting a topic fetches its draft from the server
- [ ] Loading states are shown during data fetching
- [ ] Draft data updates when Writer Agent generates new drafts

## Error Handling

- [ ] If draft fetch fails, an error message is displayed
- [ ] UI does not crash or break when API errors occur
- [ ] Retry button appears when draft fetching fails
- [ ] Error messages are user-friendly

## Empty States

- [ ] "No session active" message appears when no session exists
- [ ] "Select a topic to view its draft" message appears when no topic is selected
- [ ] "Draft is being generated" message appears if selected topic has no draft yet

## Backward Compatibility

- [ ] Existing chat functionality works as before
- [ ] Existing topic management works as before
- [ ] No breaking changes to session/topic data structures
- [ ] Previous sessions can be resumed without issues

## Overall Experience

- [ ] Panel layout feels intuitive and not overwhelming
- [ ] Draft viewer is easy to read
- [ ] Completeness percentage helps track progress
- [ ] Missing aspects provide clear guidance on what's needed
- [ ] Topic selection and draft viewing interaction is smooth
