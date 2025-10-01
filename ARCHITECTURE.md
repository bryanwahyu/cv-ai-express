# Candidate Evaluator Architecture

## Overviewn
- Node.js/Express service exposing an HTTP API for submitting candidate evaluation requests and polling their status.
- Layered design separating transport (`interfaces`), orchestration (`application`), business rules (`domain`), and integrations (`infrastructure`).
- Asynchronous job queue decouples incoming requests from long-running LLM evaluations.
- Stateless application instance; in-memory repository/queue provided for development.

```
Client → HTTP API (/evaluate) → SubmitEvaluationUseCase → JobRepository.save
       → JobQueue.enqueue → EvaluationProcessor.process → OpenRouterEvaluator
Client ← HTTP API (/result/:id) ← JobRepository.findById ← Job state/result
```

## Request Lifecycle
1. **Submit evaluation** (`POST /evaluate`)
   - Accepts raw JSON (`cv_text`, `report_text`) or text uploads (`cv_file`, `report_file`).
   - `SubmitEvaluationCommand` captures the inputs and passes them to `SubmitEvaluationUseCase`.
   - `EvaluationRequest` validates non-empty strings and becomes part of an `EvaluationJob` aggregate.
   - Job is persisted via `JobRepository.save` and hand-off to the queue (`JobQueue.enqueue`).

2. **Background processing**
   - `InMemoryJobQueue` schedules jobs with `setImmediate`, ensuring single-job processing at a time.
   - `EvaluationProcessor` transitions the job to `processing`, calls `OpenRouterEvaluator`, and stores the structured `EvaluationResult` on success or error message on failure.
   - Job state is updated via `JobRepository.update` for each transition.

3. **Retrieve evaluation** (`GET /result/:id`)
   - `GetEvaluationResultUseCase` reads the latest job snapshot.
   - HTTP layer formats the response, exposing job status, structured result, and any error metadata.

## Layer Breakdown
- **Interfaces (`src/interfaces/http`)**
  - Express server configuration (`createServer.js`) with JSON and multipart parsing (via `multer`).
  - HTTP routes translate requests into application commands and map domain objects to API responses.

- **Application (`src/application`)**
  - `SubmitEvaluationUseCase` orchestrates validation, job creation, persistence, and queue hand-off.
  - `GetEvaluationResultUseCase` retrieves job projections for clients.
  - `EvaluationProcessor` encapsulates domain-to-integration coordination during job execution.

- **Domain (`src/domain`)**
  - Entities/value objects: `EvaluationRequest`, `EvaluationResult`, `EvaluationJob`, with `JobStatus` enum.
  - `ValidationError` centralizes input validation failures.
  - Repository abstraction (`JobRepository`) defines persistence contracts.

- **Infrastructure (`src/infrastructure`)**
  - Persistence: `InMemoryJobRepository` (Map-backed store).
  - Queue: `InMemoryJobQueue` (single-worker, cooperative scheduling).
  - LLM client: `OpenRouterEvaluator` (Axios-based integration, JSON parsing/validation helpers).

## Key Data Structures
- **EvaluationJob**: Aggregates request, status (`processing|completed|error`), result payload, retry metadata, and timestamps.
- **EvaluationResult**: Domain representation of evaluator output; serialized for API consumption via `toJSON`.
- **EvaluationRequest**: Validated raw inputs (CV text and study report) ensuring downstream operations receive clean text.

## Error Handling
- HTTP layer converts `ValidationError` into `400 Bad Request` responses; other errors bubble to the Express error middleware (500).
- Processor marks job status as `error` with descriptive messages for downstream polling clients.
- OpenRouter client wraps network/LLM parsing issues in deterministic error messages.

## Configuration & Secrets
- `.env` defines API credentials and runtime configuration: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_TIMEOUT_MS`, `OPENROUTER_SITE_URL`, `OPENROUTER_APP_NAME`, and `PORT`.
- Defaults baked into constructors allow the service to run locally with minimal setup (e.g., in-memory adapters, port 3000).

## Extensibility Notes
- Swap in durable implementations by extending `JobRepository` / `JobQueue` interfaces with database or message broker integrations.
- Wrap additional evaluation backends by implementing an evaluator with the same contract consumed by `EvaluationProcessor`.
- Enhance file handling by adding parsers for binary formats before populating `EvaluationRequest`.
- For horizontal scaling, replace in-memory adapters with shared infrastructure and coordinate queue workers across instances.

