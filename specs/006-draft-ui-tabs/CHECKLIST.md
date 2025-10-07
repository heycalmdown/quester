# Spec 006: Draft UI with Three-Panel Layout - Verification Checklist

## UI Structure

- [x] Three panels visible simultaneously: Chat (left), Topics (middle), Drafts (right)
- [x] Panel widths are proportional: Chat 40%, Topics 20%, Drafts 40%
- [x] All panels are visible when session is active
- [ ] Layout is responsive (hides Drafts panel on tablet/mobile)

## Chat Panel

- [x] Chat panel shows conversation messages
- [x] Chat input field is functional
- [x] Sending messages works as before (no regression)
- [x] Session title and created date are displayed

## Topics Panel

- [x] Topics panel shows list of backlog topics
- [x] Current topic is highlighted differently
- [x] "Discuss" button switches topic context
- [x] "Mark Complete" button updates topic status
- [x] Empty state message appears when no topics exist
- [x] Clicking a topic loads its draft in the Drafts panel
- [x] Selected topic for draft viewing is visually indicated

## Drafts Panel

- [x] Drafts panel shows empty state when no topic is selected ("Select a topic to view its draft")
- [x] Clicking a topic in Topics panel loads its draft in Drafts panel
- [x] Draft content appears in the Drafts panel
- [x] "Draft is being generated" message appears if selected topic has no draft yet

## Draft Display

- [x] Draft content renders Markdown as formatted HTML
- [x] Headings, lists, and paragraphs are styled correctly
- [x] Topic title appears at the top of the draft viewer
- [x] Completeness percentage is displayed (e.g., "75%")
- [x] Last updated timestamp is shown
- [x] Missing aspects section appears when there are missing aspects
- [x] Missing aspects are displayed as a bulleted list

## Data Fetching

- [x] Selecting a topic fetches its draft from the server
- [x] Loading states are shown during data fetching
- [x] Draft data updates when Writer Agent generates new drafts

## Session Management

- [x] Starting a new session clears previous draft data
- [x] Ending a session clears draft panel

## Overall Experience

- [x] Panel layout feels intuitive and not overwhelming
- [x] Draft viewer is easy to read
- [x] Completeness percentage helps track progress
- [x] Topic selection and draft viewing interaction is smooth
