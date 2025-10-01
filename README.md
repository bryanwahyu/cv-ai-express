# Candidate Evaluation Service

Backend service that queues CV and study case evaluations and delegates scoring to an OpenRouter-hosted LLM.

## Prerequisites

- Node.js 18+
- An OpenRouter API key with access to the chosen model (`gpt-4o-mini` by default)

## Setup

```bash
npm install
cp .env.example .env  # provide your OpenRouter credentials
```

## Architecture

The service follows a lightweight Domain-Driven Design layout:
- `src/domain` — core domain models (requests, jobs, results) and errors.
- `src/application` — use cases and services orchestrating the domain.
- `src/infrastructure` — technical adapters such as the OpenRouter client, queue, and persistence.
- `src/interfaces` — transport layer (Express HTTP server).

### Environment variables

Create a `.env` file with at least:

```
OPENROUTER_API_KEY=sk-...
# Optional overrides
OPENROUTER_MODEL=gpt-4o-mini
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=Candidate Evaluator
OPENROUTER_TIMEOUT_MS=45000
PORT=3000
```

## Running

```bash
npm run start
```

During development you can use hot reload:

```bash
npm run dev
```

## API

- `POST /evaluate` — enqueue a CV/report pair for asynchronous evaluation. Returns `{ job_id, status }`.
- `GET /result/:id` — fetch the current status and evaluation payload (or error) for a job.

All responses are JSON.
