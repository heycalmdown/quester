# Boilerplate Generation Specification

## Context

This specification defines the goals and requirements for generating boilerplate code for the Quester project, based on the technical architecture defined in `@ARCHITECTURE.md`.

## Problem

The Quester project needs a complete Nuxt 3 application structure that follows the defined architecture guardrails and supports the conversational writing agent functionality described in the PRD.

## Goal

Generate a complete boilerplate codebase that includes:

1. **Nuxt 3 Project Structure**
   - TypeScript configuration
   - Tailwind CSS setup
   - Pinia store configuration
   - Package.json with required dependencies

2. **Backend API Layer**
   - Server API routes for LLM interactions
   - OpenAI integration with caching
   - File-based session persistence (Markdown + JSON)

3. **Frontend Components**
   - Vue 3 components for conversational interface
   - Chat/interview UI components
   - Session management interface

4. **Core Features Foundation**
   - Session state management
   - Topic backlog system
   - Question/answer flow structure
   - Summarization and confirmation loops

## Non-Goals

- Complete feature implementation (focus on structure and foundations)
- UI/UX design implementation (basic functional UI only)
- Advanced caching mechanisms
- Multi-user support

## Constraints

- **Tech Stack**: TypeScript, Nuxt 3, Vue 3, Pinia, Tailwind CSS, pnpm
- **LLM Backend Only**: All OpenAI calls must run on server-side API routes
- **File-based Persistence**: No database, use local directories with Markdown/JSON
- **Single-user Design**: No concurrency control needed
- **Code Quality**: Follow CLAUDE.md guidelines for clean, maintainable code

## Success Criteria

1. Project can be installed and run with `pnpm install && pnpm dev`
2. Basic conversational interface is functional
3. Backend API can handle LLM requests
4. Session persistence works with file system
5. Code follows architecture guidelines and quality standards
6. All core dependencies are properly configured

## Implementation Approach

1. **Phase 1**: Basic Nuxt 3 project setup with TypeScript and Tailwind
2. **Phase 2**: Server API structure for LLM integration
3. **Phase 3**: Frontend components and state management
4. **Phase 4**: Session persistence and file management
5. **Phase 5**: Core conversation flow structure

## File Structure Overview

```
/
├── components/           # Vue components
├── composables/         # Vue composables
├── pages/              # Nuxt pages
├── server/             # Server API routes
├── stores/             # Pinia stores
├── types/              # TypeScript definitions
├── utils/              # Utility functions
├── sessions/           # File-based session storage
├── nuxt.config.ts      # Nuxt configuration
├── tailwind.config.js  # Tailwind configuration
├── package.json        # Dependencies
└── tsconfig.json       # TypeScript configuration
```