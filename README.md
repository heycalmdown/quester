# Quester

A conversational writing agent that acts like a seasoned interviewer, guiding users through questions to clarify, confirm, and structure their thoughts into finished writing.

## Features

- **Conversational Interface**: Natural dialogue flow with one question at a time
- **Topic Management**: Automatic topic detection and backlog management
- **File-based Persistence**: Sessions stored as Markdown and JSON files
- **User Preferences**: Preserve preferred terms, avoid disliked ones
- **Divergence-Convergence Flow**: Broaden ideas, then narrow to key themes

## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript, Tailwind CSS, Nuxt UI
- **Backend**: Nuxt Server API, OpenAI API
- **State Management**: Pinia
- **Package Manager**: pnpm

## Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd quester
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Run the development server:**
   ```bash
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)

## Project Structure

```
/
├── components/           # Vue components
│   ├── ChatMessage.vue   # Individual chat message display
│   ├── ChatInput.vue     # Message input component
│   └── TopicBacklog.vue  # Topic management sidebar
├── pages/               # Nuxt pages
│   └── index.vue        # Main application page
├── server/              # Server API routes
│   └── api/
│       ├── chat.post.ts      # LLM chat endpoint
│       └── sessions/         # Session management endpoints
├── stores/              # Pinia stores
│   └── session.ts       # Session state management
├── types/               # TypeScript definitions
│   └── index.ts         # Core type definitions
├── server/              # Server API routes and utilities
│   ├── api/                  # API endpoints
│   └── utils/                # Server-side utilities
│       └── sessionPersistence.ts # File-based session storage
├── sessions/            # Session storage directory (auto-created)
└── nuxt.config.ts       # Nuxt configuration
```

## Usage

1. **Start a new session** by clicking "New Session"
2. **Begin the conversation** - Quester will guide you with questions
3. **Topics are automatically tracked** in the sidebar backlog
4. **Sessions are automatically saved** as files in the `sessions/` directory

## Architecture

- **LLM Backend Only**: All OpenAI calls run on server-side API routes
- **File-based Persistence**: No database - sessions stored as local files
- **Single-user Design**: No concurrency control needed
- **Clean Code**: Follows established patterns and best practices

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Run type checking
pnpm typecheck
```

## Boilerplate Status

### ✅ Core Infrastructure Complete
- [x] Nuxt 3 project setup with TypeScript and Tailwind CSS
- [x] Server API structure for LLM integration
- [x] File-based session persistence (Markdown + JSON)
- [x] Pinia state management configuration
- [x] Basic Vue components for conversation interface
- [x] Package.json with all required dependencies
- [x] Development server runs successfully (`pnpm dev`)

### ✅ Architecture Compliance
- [x] LLM calls isolated to server-side only
- [x] No database dependencies (file-based storage)
- [x] Single-user design (no concurrency control)
- [x] TypeScript strict mode enabled
- [x] Clean code structure following CLAUDE.md guidelines

### 🚀 Ready for Feature Development
The boilerplate foundation is complete and ready for implementing the core Quester features described in the PRD.

### Known Issues

- **Circular Dependency Warnings**: You may see warnings about circular dependencies from Nitro and OpenAI libraries. These are harmless framework warnings and don't affect functionality.
- **OpenAI ES Module Warnings**: Some warnings about `'this' keyword is equivalent to 'undefined'` may appear during build. These are library-specific and can be safely ignored.