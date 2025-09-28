# Quester Architecture Guardrails

## Tech Stack

- TypeScript
- Nuxt 3 (Vue 3, Pinia, Server API)
- Tailwind CSS
- pnpm, vite, vitest
- OpenAI Responses API (with caching, backend only)

## Technical Direction

- **LLM backend execution**: All LLM calls run only on the backend (Server API), never from client.
- **File-based persistence**: No DB. Each session is a local directory containing Markdown (artifacts) and JSON (state).
- **Single-user assumption**: Concurrency control unnecessary; keep design simple.
